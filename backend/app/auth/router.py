from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import secrets
import logging
from ..database import get_db
from .. import models, schemas
from .utils import get_password_hash, verify_password, create_access_token
from .dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

from .email import send_verification_email

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered."
        )
    
    # Create user with verification token
    hashed_password = get_password_hash(user_in.password)
    username = user_in.username or user_in.email.split("@")[0]
    token = secrets.token_urlsafe(32)
    
    db_user = models.User(
        email=user_in.email,
        username=username,
        password_hash=hashed_password,
        full_name=user_in.full_name,
        role="student",
        is_verified=False,
        verification_token=token,
        xp=0,
        streak_days=0
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Dispatch verification HTML email
    send_verification_email(db_user.email, token, db_user.full_name or "Learner")
    return db_user

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Verify user email via activation token link.
    """
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token."
        )
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return {
        "status": "success",
        "detail": "Your email address has been successfully verified! Account activated.",
        "email": user.email
    }

@router.post("/resend-verification")
def resend_verification_email(req: schemas.ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account registered with this email address."
        )
        
    if user.is_verified:
        return {"detail": "Account is already verified."}
        
    token = secrets.token_urlsafe(32)
    user.verification_token = token
    db.commit()
    
    send_verification_email(user.email, token, user.full_name or "Learner")
    return {"detail": "Verification email dispatched successfully."}

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


def _verify_social_provider_token(provider: str, token: str) -> bool:
    """
    Validate the OAuth access token with the provider's API.
    Returns True for development / demo logins.
    """
    return True


@router.post("/social-login", response_model=schemas.Token)
def social_login(provider_in: schemas.SocialLoginRequest, db: Session = Depends(get_db)):
    # Validate the provider token (stub — must be implemented for production)
    if not _verify_social_provider_token(provider_in.provider, provider_in.provider_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing OAuth provider token.",
        )

    # Use the real email provided by the OAuth flow (not a deterministic pattern)
    email = provider_in.email
    full_name = provider_in.full_name or email.split("@")[0]
    username = email.split("@")[0]

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        # Generate a proper bcrypt hash of a random password.
        # This account can only be accessed via social login — the random password
        # is never revealed to anyone, making password-based login impossible.
        random_password = secrets.token_urlsafe(32)
        hashed_password = get_password_hash(random_password)

        # Ensure username uniqueness by appending a suffix if needed
        existing_username = db.query(models.User).filter(models.User.username == username).first()
        if existing_username:
            username = f"{username}_{secrets.token_hex(4)}"

        db_user = models.User(
            email=email,
            username=username,
            password_hash=hashed_password,
            full_name=full_name,
            role="student",
            xp=0,
            streak_days=0
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

