from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user, get_optional_user
from ..auth.utils import get_password_hash

router = APIRouter(
    prefix="/posts",
    tags=["Community Feed & Problem Sharing"]
)

# Seed posts list with realistic student problems and writeups
SEED_POSTS = [
    {
        "title": "SQL Injection Authentication Bypass failing on SQLite backend (' OR 1=1 -- vs /*)",
        "content": "I was working on the Web Security login bypass lab, and my payload `' OR 1=1 --` was throwing a syntax error. After debugging, I realized SQLite treats `--` as a comment only if followed by a newline or space, whereas in MySQL `/*` or `-- ` is standard. What is the best practice payload for database-agnostic testing?",
        "category": "Questions",
        "tags": "sqli,web-security,sql-injection",
        "is_solved": True,
        "upvotes": 24,
        "comments": [
            {
                "author": "Alice Mentor",
                "role": "instructor",
                "content": "Great question! For universal SQLi fuzzing, try using `' OR '1'='1` or `' OR 1=1 #` which does not rely on comment delimiters. Also remember that in production backends, parameterized queries (prepared statements) completely eliminate the need to sanitize quotation marks.",
                "is_solution": True
            }
        ]
    },
    {
        "title": "Linux SUID Privilege Escalation: How GTFOBins binaries work under the hood",
        "content": "Here is a detailed breakdown of how misconfigured binaries with the SUID bit set (`chmod 4755`) can spawn a root shell when executing with elevated EUID (Effective User ID). If `find` or `vim` has the SUID bit, executing `find . -exec /bin/sh -p \\;` preserves the root EUID!",
        "category": "Writeups",
        "tags": "linux,privesc,suid,gtfobins",
        "is_solved": False,
        "upvotes": 42,
        "comments": [
            {
                "author": "Bob Security",
                "role": "student",
                "content": "Always remember the `-p` flag on modern `/bin/sh` or `/bin/bash` to prevent the shell from dropping SUID privileges back to the real UID.",
                "is_solution": False
            }
        ]
    },
    {
        "title": "Wireshark packet capture analysis: Detecting ARP spoofing & MITM attacks",
        "content": "I captured a `.pcap` file during the Network Security Essentials lab and noticed duplicate IP addresses mapped to different MAC addresses in rapid succession. Is looking at `arp.duplicate-address-frame` in Wireshark display filters sufficient for real-world IDS alerts?",
        "category": "Questions",
        "tags": "networking,wireshark,arp-spoofing",
        "is_solved": True,
        "upvotes": 18,
        "comments": [
            {
                "author": "NetworkPro",
                "role": "pro_member",
                "content": "Yes! Dynamic ARP Inspection (DAI) on managed switches paired with DHCP Snooping is the hardware defense standard against ARP poisoning.",
                "is_solution": True
            }
        ]
    },
    {
        "title": "Critical OAuth 2.0 State Parameter CSRF Exploit Pattern Analysis",
        "content": "A deep dive into why omitting the cryptographic `state` parameter in OAuth authorization code flows allows attackers to bind their victim's account to an attacker-controlled third-party provider profile.",
        "category": "Security News",
        "tags": "oauth,csrf,identity",
        "is_solved": False,
        "upvotes": 35,
        "comments": []
    }
]

def seed_posts_if_empty(db: Session, admin_id: str):
    count = db.query(models.Post).count()
    if count == 0:
        for p in SEED_POSTS:
            db_post = models.Post(
                user_id=admin_id,
                title=p["title"],
                content=p["content"],
                category=p["category"],
                tags=p.get("tags"),
                is_solved=p.get("is_solved", False),
                upvotes=p["upvotes"]
            )
            db.add(db_post)
            db.flush()

            for c in p.get("comments", []):
                db_comment = models.Comment(
                    post_id=db_post.id,
                    user_id=admin_id,
                    content=c["content"],
                    is_solution=c.get("is_solution", False)
                )
                db.add(db_comment)
        db.commit()

@router.get("", response_model=List[schemas.PostResponse])
def get_posts(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_solved: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    # Find or create a system user to associate seed posts with
    system_user = db.query(models.User).filter(models.User.email == "system@cyberlearn.io").first()
    if not system_user:
        system_user = models.User(
            email="system@cyberlearn.io",
            password_hash=get_password_hash("system_pass_not_loginable_123"),
            full_name="CyberLearn Community",
            username="community_admin",
            role="admin"
        )
        db.add(system_user)
        db.commit()
        db.refresh(system_user)
        
    seed_posts_if_empty(db, system_user.id)

    query = db.query(models.Post).options(
        joinedload(models.Post.user),
        joinedload(models.Post.comments)
    )

    if category and category.lower() != "all":
        query = query.filter(models.Post.category.ilike(f"%{category}%"))

    if is_solved is not None:
        query = query.filter(models.Post.is_solved == is_solved)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (models.Post.title.ilike(search_term)) | 
            (models.Post.content.ilike(search_term)) |
            (models.Post.tags.ilike(search_term))
        )

    posts = query.order_by(models.Post.created_at.desc()).all()

    voted_post_ids = set()
    if current_user and posts:
        post_ids = [p.id for p in posts]
        voted_post_ids = set(
            row[0] for row in db.query(models.PostVote.post_id).filter(
                models.PostVote.user_id == current_user.id,
                models.PostVote.post_id.in_(post_ids)
            ).all()
        )

    results = []
    for p in posts:
        author_name = (p.user.full_name or p.user.username) if p.user else "Learner"
        author_username = p.user.username if p.user else "learner"
        author_avatar = p.user.avatar_url if p.user else None
        has_upvoted = p.id in voted_post_ids

        results.append(schemas.PostResponse(
            id=p.id,
            user_id=p.user_id,
            author_name=author_name,
            author_username=author_username,
            author_avatar=author_avatar,
            title=p.title,
            content=p.content,
            category=p.category or "General",
            tags=p.tags,
            is_solved=p.is_solved or False,
            upvotes=p.upvotes or 0,
            comment_count=len(p.comments) if p.comments else 0,
            has_upvoted=has_upvoted,
            created_at=p.created_at
        ))

    return results

@router.post("", response_model=schemas.PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not post_in.title.strip() or not post_in.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post title and problem description content cannot be empty."
        )

    db_post = models.Post(
        user_id=current_user.id,
        title=post_in.title.strip(),
        content=post_in.content.strip(),
        category=post_in.category or "Questions",
        tags=post_in.tags.strip() if post_in.tags else None,
        is_solved=False,
        upvotes=1
    )
    db.add(db_post)
    db.flush()

    # Author auto-votes their own created post
    initial_vote = models.PostVote(user_id=current_user.id, post_id=db_post.id)
    db.add(initial_vote)

    db.commit()
    db.refresh(db_post)

    return schemas.PostResponse(
        id=db_post.id,
        user_id=db_post.user_id,
        author_name=current_user.full_name or current_user.username or "Learner",
        author_username=current_user.username or current_user.email.split("@")[0],
        author_avatar=current_user.avatar_url,
        title=db_post.title,
        content=db_post.content,
        category=db_post.category,
        tags=db_post.tags,
        is_solved=db_post.is_solved,
        upvotes=db_post.upvotes,
        comment_count=0,
        has_upvoted=True,
        created_at=db_post.created_at
    )

@router.get("/{post_id}", response_model=schemas.PostDetailResponse)
def get_post_detail(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    post = db.query(models.Post).options(
        joinedload(models.Post.user),
        joinedload(models.Post.comments).joinedload(models.Comment.user)
    ).filter(models.Post.id == post_id).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found."
        )

    has_upvoted = False
    if current_user:
        vote = db.query(models.PostVote).filter(
            models.PostVote.user_id == current_user.id,
            models.PostVote.post_id == post.id
        ).first()
        has_upvoted = bool(vote)

    formatted_comments = []
    if post.comments:
        for c in sorted(post.comments, key=lambda x: x.created_at):
            c_author = (c.user.full_name or c.user.username) if c.user else "Community Member"
            formatted_comments.append(schemas.CommentResponse(
                id=c.id,
                post_id=c.post_id,
                user_id=c.user_id,
                author_name=c_author,
                author_username=c.user.username if c.user else "member",
                author_avatar=c.user.avatar_url if c.user else None,
                author_role=c.user.role if c.user else "student",
                content=c.content,
                is_solution=c.is_solution or False,
                created_at=c.created_at
            ))

    author_name = (post.user.full_name or post.user.username) if post.user else "Learner"
    author_username = post.user.username if post.user else "learner"
    author_avatar = post.user.avatar_url if post.user else None

    return schemas.PostDetailResponse(
        id=post.id,
        user_id=post.user_id,
        author_name=author_name,
        author_username=author_username,
        author_avatar=author_avatar,
        title=post.title,
        content=post.content,
        category=post.category,
        tags=post.tags,
        is_solved=post.is_solved or False,
        upvotes=post.upvotes or 0,
        comment_count=len(formatted_comments),
        has_upvoted=has_upvoted,
        created_at=post.created_at,
        comments=formatted_comments
    )

@router.post("/{post_id}/comments", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    post_id: str,
    comment_in: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found."
        )

    if not comment_in.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment content cannot be blank."
        )

    db_comment = models.Comment(
        post_id=post.id,
        user_id=current_user.id,
        content=comment_in.content.strip(),
        is_solution=False
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    return schemas.CommentResponse(
        id=db_comment.id,
        post_id=db_comment.post_id,
        user_id=db_comment.user_id,
        author_name=current_user.full_name or current_user.username or "Learner",
        author_username=current_user.username or current_user.email.split("@")[0],
        author_avatar=current_user.avatar_url,
        author_role=current_user.role,
        content=db_comment.content,
        is_solution=db_comment.is_solution,
        created_at=db_comment.created_at
    )

@router.post("/{post_id}/toggle-solved", response_model=schemas.PostResponse)
def toggle_solved(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).options(joinedload(models.Post.user)).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found."
        )

    # Only author, admin, or instructor can mark solved
    if post.user_id != current_user.id and current_user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author or an instructor can mark this problem as resolved."
        )

    post.is_solved = not (post.is_solved or False)
    db.commit()
    db.refresh(post)

    author_name = (post.user.full_name or post.user.username) if post.user else "Learner"
    return schemas.PostResponse(
        id=post.id,
        user_id=post.user_id,
        author_name=author_name,
        author_username=post.user.username if post.user else "learner",
        author_avatar=post.user.avatar_url if post.user else None,
        title=post.title,
        content=post.content,
        category=post.category,
        tags=post.tags,
        is_solved=post.is_solved,
        upvotes=post.upvotes,
        comment_count=len(post.comments) if post.comments else 0,
        has_upvoted=False,
        created_at=post.created_at
    )

@router.post("/{post_id}/upvote", response_model=schemas.PostResponse)
def upvote_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).options(joinedload(models.Post.user)).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Check if user has already upvoted this post (Idempotency / Toggle)
    existing_vote = db.query(models.PostVote).filter(
        models.PostVote.user_id == current_user.id,
        models.PostVote.post_id == post.id
    ).first()

    has_upvoted = False
    if existing_vote:
        # Un-vote toggle
        db.delete(existing_vote)
        post.upvotes = max(0, (post.upvotes or 1) - 1)
        has_upvoted = False
    else:
        # Cast vote
        new_vote = models.PostVote(user_id=current_user.id, post_id=post.id)
        db.add(new_vote)
        post.upvotes = (post.upvotes or 0) + 1
        has_upvoted = True

    db.commit()
    db.refresh(post)

    author_name = (post.user.full_name or post.user.username) if post.user else "Learner"
    author_username = post.user.username if post.user else "learner"
    author_avatar = post.user.avatar_url if post.user else None

    return schemas.PostResponse(
        id=post.id,
        user_id=post.user_id,
        author_name=author_name,
        author_username=author_username,
        author_avatar=author_avatar,
        title=post.title,
        content=post.content,
        category=post.category,
        tags=post.tags,
        is_solved=post.is_solved or False,
        upvotes=post.upvotes,
        comment_count=len(post.comments) if post.comments else 0,
        has_upvoted=has_upvoted,
        created_at=post.created_at
    )

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    if post.user_id != current_user.id and current_user.role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author or an admin can delete this post."
        )

    db.delete(post)
    db.commit()
    return None


