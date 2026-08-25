from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user, has_active_subscription

router = APIRouter(
    prefix="/billing",
    tags=["Billing & Subscriptions"]
)

class CheckoutRequest(BaseModel):
    plan_name: str
    billing_period: str = "monthly"

@router.post("/checkout")
def create_checkout_session(
    request: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Process subscription plan upgrade or checkout session.
    """
    valid_plans = ["Free", "Pro", "Premium"]
    if request.plan_name not in valid_plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan selected. Choose from: {', '.join(valid_plans)}"
        )
        
    days_to_add = 365 if request.billing_period == "annually" else 30
    now = datetime.now(timezone.utc)

    if request.plan_name == "Free":
        current_user.subscription_tier = "free"
        current_user.subscription_status = "inactive"
        current_user.subscription_expires_at = None
        if current_user.role not in ["admin", "instructor"]:
            current_user.role = "student"
    elif request.plan_name == "Pro":
        current_user.subscription_tier = "pro"
        current_user.subscription_status = "active"
        current_user.subscription_expires_at = now + timedelta(days=days_to_add)
        if current_user.role not in ["admin", "instructor"]:
            current_user.role = "pro_member"
    elif request.plan_name == "Premium":
        current_user.subscription_tier = "premium"
        current_user.subscription_status = "active"
        current_user.subscription_expires_at = now + timedelta(days=days_to_add)
        if current_user.role not in ["admin", "instructor"]:
            current_user.role = "premium_member"

    db.commit()
    db.refresh(current_user)
        
    is_sub = has_active_subscription(current_user)
    return {
        "status": "success",
        "message": f"Successfully activated {request.plan_name} plan ({request.billing_period}).",
        "plan_name": request.plan_name,
        "billing_period": request.billing_period,
        "user_role": current_user.role,
        "subscription_tier": current_user.subscription_tier,
        "subscription_status": current_user.subscription_status,
        "subscription_expires_at": current_user.subscription_expires_at,
        "is_subscribed": is_sub
    }

@router.get("/status", response_model=schemas.SubscriptionStatusResponse)
def get_subscription_status(
    current_user: models.User = Depends(get_current_user)
):
    """
    Get current user's subscription entitlement, tier, and feature access permissions.
    """
    is_sub = has_active_subscription(current_user)
    return schemas.SubscriptionStatusResponse(
        tier=current_user.subscription_tier or ("pro" if current_user.role == "pro_member" else "premium" if current_user.role == "premium_member" else "free"),
        status=current_user.subscription_status or ("active" if is_sub else "inactive"),
        is_subscribed=is_sub,
        expires_at=current_user.subscription_expires_at,
        can_access_courses=is_sub,
        can_access_labs=is_sub,
        role=current_user.role
    )

@router.post("/cancel")
def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Cancel active subscription and revert user access to Free tier.
    """
    current_user.subscription_status = "canceled"
    current_user.subscription_tier = "free"
    current_user.subscription_expires_at = None
    if current_user.role not in ["admin", "instructor"]:
        current_user.role = "student"
        
    db.commit()
    db.refresh(current_user)
    
    return {
        "status": "success",
        "message": "Your subscription has been canceled. Courses and sandbox labs are now locked.",
        "subscription_status": "canceled",
        "user_role": current_user.role
    }

