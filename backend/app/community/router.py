from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user
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
def get_posts(db: Session = Depends(get_db)):
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
    return db.query(models.Post).order_by(models.Post.created_at.desc()).all()

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
    db.commit()
    db.refresh(db_post)
    return db_post

@router.post("/{post_id}/upvote", response_model=schemas.PostResponse)
def upvote_post(
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
    post.upvotes += 1
    db.commit()
    db.refresh(post)
    return post

