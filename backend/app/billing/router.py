from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..auth.dependencies import get_current_user

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
        
    # Upgrade user role / tier status
    if request.plan_name in ["Pro", "Premium"]:
        current_user.role = "pro_member" if request.plan_name == "Pro" else "premium_member"
        db.commit()
        db.refresh(current_user)
        
    return {
        "status": "success",
        "message": f"Successfully activated {request.plan_name} plan ({request.billing_period}).",
        "plan_name": request.plan_name,
        "billing_period": request.billing_period,
        "user_role": current_user.role
    }
