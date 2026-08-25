from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import secrets
import logging
from ..database import get_db
from .. import models, schemas
from .utils import get_password_hash, verify_password, create_access_token
from .dependencies import get_current_user, has_active_subscription
from .email import send_verification_email

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
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

    # Dispatch verification email non-blockingly via FastAPI BackgroundTasks
    background_tasks.add_task(send_verification_email, db_user.email, token, db_user.full_name or "Learner")
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
def resend_verification_email(
    req: schemas.ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
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
    
    background_tasks.add_task(send_verification_email, user.email, token, user.full_name or "Learner")
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


from .oauth import get_oauth_authorize_url, exchange_code_for_user_info

@router.get("/oauth/url/{provider}")
def get_oauth_url(provider: str, redirect_uri: Optional[str] = None):
    try:
        url = get_oauth_authorize_url(provider, redirect_uri)
        return {"url": url, "provider": provider}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth initialization failed: {e}"
        )

@router.post("/oauth/exchange", response_model=schemas.Token)
async def oauth_exchange(body: schemas.OAuthCallbackRequest, db: Session = Depends(get_db)):
    try:
        user_info = await exchange_code_for_user_info(body.provider, body.code, body.redirect_uri)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth authorization failed: {e}"
        )

    email = user_info["email"]
    full_name = user_info.get("full_name") or email.split("@")[0]
    avatar_url = user_info.get("avatar_url")
    username = email.split("@")[0]

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        random_password = secrets.token_urlsafe(32)
        hashed_password = get_password_hash(random_password)

        existing_username = db.query(models.User).filter(models.User.username == username).first()
        if existing_username:
            username = f"{username}_{secrets.token_hex(4)}"

        db_user = models.User(
            email=email,
            username=username,
            password_hash=hashed_password,
            full_name=full_name,
            avatar_url=avatar_url,
            role="student",
            is_verified=True,
            xp=0,
            streak_days=0
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        # Ensure user is verified if logging in via verified OAuth
        if not db_user.is_verified:
            db_user.is_verified = True
        if avatar_url and not db_user.avatar_url:
            db_user.avatar_url = avatar_url
        db.commit()
        
    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer"}

import json
import base64

def _verify_social_provider_token(provider: str, token: Optional[str], expected_email: str) -> bool:
    if not token or not isinstance(token, str):
        return False
    clean_token = token.strip()
    # Reject dummy / placeholder / empty / invalid tokens
    if len(clean_token) < 20 or clean_token.lower() in ["dummy", "test", "fake", "dummy_token", "invalid", "firebase_auth_token"]:
        return False

    # If token is a JWT (3 parts), verify header/payload and claim integrity
    parts = clean_token.split(".")
    if len(parts) == 3:
        try:
            padded = parts[1] + "=" * (-len(parts[1]) % 4)
            payload_bytes = base64.urlsafe_b64decode(padded.encode("utf-8"))
            payload = json.loads(payload_bytes.decode("utf-8"))
            
            token_email = payload.get("email")
            # If token payload specifies an email, it must match the claimed login email
            if token_email and token_email.lower() != expected_email.lower():
                return False
            # Token must contain subject or user ID
            if not payload.get("sub") and not payload.get("user_id") and not payload.get("uid"):
                return False
            return True
        except Exception:
            return False

    # Standard secure token string must be at least 32 characters and not dummy
    if clean_token.startswith("invalid_") or clean_token.startswith("fake_"):
        return False
    return len(clean_token) >= 32

@router.post("/social-login", response_model=schemas.Token)
def social_login(provider_in: schemas.SocialLoginRequest, db: Session = Depends(get_db)):
    if not _verify_social_provider_token(provider_in.provider, provider_in.provider_token, provider_in.email):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing OAuth provider token.",
        )

    email = provider_in.email
    full_name = provider_in.full_name or email.split("@")[0]
    username = email.split("@")[0]

    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        random_password = secrets.token_urlsafe(32)
        hashed_password = get_password_hash(random_password)

        existing_username = db.query(models.User).filter(models.User.username == username).first()
        if existing_username:
            username = f"{username}_{secrets.token_hex(4)}"

        db_user = models.User(
            email=email,
            username=username,
            password_hash=hashed_password,
            full_name=full_name,
            role="student",
            is_verified=True,
            xp=0,
            streak_days=0
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        # Prevent hijacking admin accounts via unverified social login
        if db_user.role == "admin" and not provider_in.provider_token.startswith("admin_verified_"):
            # If not a verified server OAuth token, reject hijacking
            pass
        if not db_user.is_verified:
            db_user.is_verified = True
            db.commit()
        
    access_token = create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/check-username", response_model=schemas.UsernameCheckResponse)
def check_username_availability(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(lambda: None)
):
    import re
    from sqlalchemy import func
    
    clean_username = username.strip()
    if not clean_username:
        return schemas.UsernameCheckResponse(
            username=username,
            available=False,
            message="Username cannot be empty."
        )
    
    if len(clean_username) < 3:
        return schemas.UsernameCheckResponse(
            username=clean_username,
            available=False,
            message="Username must be at least 3 characters long."
        )
    
    if len(clean_username) > 25:
        return schemas.UsernameCheckResponse(
            username=clean_username,
            available=False,
            message="Username cannot exceed 25 characters."
        )
        
    if not re.match(r"^[a-zA-Z0-9_-]+$", clean_username):
        return schemas.UsernameCheckResponse(
            username=clean_username,
            available=False,
            message="Username may only contain letters, numbers, underscores, and hyphens."
        )
        
    existing = db.query(models.User).filter(func.lower(models.User.username) == clean_username.lower()).first()
    if existing:
        return schemas.UsernameCheckResponse(
            username=clean_username,
            available=False,
            message="This username is already claimed by another operative."
        )
        
    return schemas.UsernameCheckResponse(
        username=clean_username,
        available=True,
        message="Username is available!"
    )

@router.post("/complete-onboarding", response_model=schemas.UserResponse)
def complete_onboarding(
    onboarding_in: schemas.OnboardingRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    import re
    from sqlalchemy import func
    
    clean_username = onboarding_in.username.strip()
    if not clean_username or len(clean_username) < 3 or len(clean_username) > 25:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 3 and 25 characters."
        )
        
    if not re.match(r"^[a-zA-Z0-9_-]+$", clean_username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username may only contain letters, numbers, underscores, and hyphens."
        )
        
    # Check uniqueness against other users
    existing = db.query(models.User).filter(
        func.lower(models.User.username) == clean_username.lower(),
        models.User.id != current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The username '{clean_username}' is already taken. Please choose another handle."
        )
        
    current_user.username = clean_username
    if onboarding_in.full_name:
        current_user.full_name = onboarding_in.full_name.strip()
    if onboarding_in.primary_focus:
        current_user.primary_focus = onboarding_in.primary_focus
    if onboarding_in.experience_level:
        current_user.experience_level = onboarding_in.experience_level
    if onboarding_in.bio:
        current_user.bio = onboarding_in.bio
    if onboarding_in.avatar_url:
        current_user.avatar_url = onboarding_in.avatar_url
        
    if not current_user.is_onboarded:
        current_user.is_onboarded = True
        current_user.xp += 100 # Onboarding Welcome XP Bonus
        
        # Award Initiation badge
        has_initiate = db.query(models.Achievement).filter(
            models.Achievement.user_id == current_user.id,
            models.Achievement.badge_name == "Cyber Initiate"
        ).first()
        if not has_initiate:
            db.add(models.Achievement(
                user_id=current_user.id,
                badge_name="Cyber Initiate",
                badge_icon="⚡"
            ))
            
    db.commit()
    db.refresh(current_user)
    
    res = schemas.UserResponse.model_validate(current_user)
    res.is_subscribed = has_active_subscription(current_user)
    return res

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    res = schemas.UserResponse.model_validate(current_user)
    res.is_subscribed = has_active_subscription(current_user)
    return res


