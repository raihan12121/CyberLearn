from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user, get_optional_user
from ..auth.utils import get_password_hash

router = APIRouter(
    prefix="/posts",
    tags=["Community Feed"]
)

# Seed posts list
SEED_POSTS = [
    {
        "title": "Welcome to CyberLearn Community!",
        "content": "Discuss writeups, security news, ask questions, and share knowledge here.",
        "category": "Announcements"
    },
    {
        "title": "SQL Injection login bypass tips",
        "content": "Make sure to check how quotation marks are matched in SQL command structures.",
        "category": "Writeups"
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
                upvotes=10
            )
            db.add(db_post)
        db.commit()

@router.get("", response_model=List[schemas.PostResponse])
def get_posts(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    # Find or create a system user to associate seed posts with
    system_user = db.query(models.User).filter(models.User.email == "system@cyberlearn.io").first()
    if not system_user:
        system_user = models.User(
            email="system@cyberlearn.io",
            password_hash=get_password_hash("system_pass_not_loginable_123"),
            full_name="System Admin",
            role="admin"
        )
        db.add(system_user)
        db.commit()
        db.refresh(system_user)
        
    seed_posts_if_empty(db, system_user.id)

    posts = db.query(models.Post).options(
        joinedload(models.Post.user)
    ).order_by(models.Post.created_at.desc()).all()

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
            category=p.category,
            upvotes=p.upvotes,
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
    db_post = models.Post(
        user_id=current_user.id,
        title=post_in.title,
        content=post_in.content,
        category=post_in.category,
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
        upvotes=db_post.upvotes,
        has_upvoted=True,
        created_at=db_post.created_at
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
        post.upvotes = max(0, post.upvotes - 1)
        has_upvoted = False
    else:
        # Cast vote
        new_vote = models.PostVote(user_id=current_user.id, post_id=post.id)
        db.add(new_vote)
        post.upvotes += 1
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
        upvotes=post.upvotes,
        has_upvoted=has_upvoted,
        created_at=post.created_at
    )

