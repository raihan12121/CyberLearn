from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from .utils import get_password_hash, verify_password, create_access_token
from .dependencies import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered."
        )
    
    # Create user
    hashed_password = get_password_hash(user_in.password)
    username = user_in.username or user_in.email.split("@")[0]
    db_user = models.User(
        email=user_in.email,
        username=username,
        password_hash=hashed_password,
        full_name=user_in.full_name,
        role="student",
        xp=0,
        streak_days=0
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=schemas.Token)
def login_user(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    # Find user
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not db_user or not verify_password(user_in.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout_user():
    # Stateless JWT does not require DB modifications on logout, simple client discard is enough.
    return {"detail": "Successfully logged out"}

@router.post("/social-login", response_model=schemas.Token)
def social_login(provider_in: schemas.SocialLoginRequest, db: Session = Depends(get_db)):
    email = f"{provider_in.provider}_user@cyberlearn.io"
    full_name = f"{provider_in.provider.capitalize()} User"
    username = f"{provider_in.provider}_user"
    
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        db_user = models.User(
            email=email,
            username=username,
            password_hash="social_login_no_password",
            full_name=full_name,
            role="student",
            xp=100,
            streak_days=1
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
