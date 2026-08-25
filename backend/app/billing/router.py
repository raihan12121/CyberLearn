import random
import re
from datetime import datetime, timedelta, timezone
from typing import List, Optional
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

PROMO_CODES = {
    "CYBER2026": {"discount_pct": 50.0, "description": "50% Off New Year Cyber Special"},
    "HACKER100": {"discount_pct": 100.0, "description": "100% Off VIP First Cycle"},
    "STUDENT20": {"discount_pct": 20.0, "description": "20% Student Community Discount"},
    "SPRING25": {"discount_pct": 25.0, "description": "25% Spring Promotion"},
}

PLAN_BASE_PRICES = {
    "pro": {"monthly": 12.00, "annually": 120.00},
    "premium": {"monthly": 24.00, "annually": 240.00},
    "free": {"monthly": 0.00, "annually": 0.00},
}

def calculate_pricing(
    purchase_type: str = "subscription",
    plan_name: str = "Pro",
    billing_period: str = "monthly",
    duration_months: int = 1,
    course_price: float = 49.00,
    promo_code: Optional[str] = None
):
    if purchase_type == "course_lifetime":
        subtotal = float(course_price)
    else:
        plan_key = (plan_name or "pro").lower()
        if plan_key not in PLAN_BASE_PRICES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan name '{plan_name}'."
            )
            
        period_key = (billing_period or "monthly").lower()
        dur = max(1, duration_months or 1)
        
        if period_key == "annually" or dur == 12:
            subtotal = PLAN_BASE_PRICES[plan_key]["annually"]
        else:
            monthly_rate = PLAN_BASE_PRICES[plan_key]["monthly"]
            if dur == 1:
                subtotal = monthly_rate
            elif dur == 2:
                # 2 months bundle discount ($2 off for Pro, $4 off for Premium)
                subtotal = (monthly_rate * 2) - (2.00 if plan_key == "pro" else 4.00)
            elif dur == 3:
                # 3 months bundle discount ($6 off for Pro, $12 off for Premium)
                subtotal = (monthly_rate * 3) - (6.00 if plan_key == "pro" else 12.00)
            elif dur == 6:
                # 6 months bundle discount ($14 off for Pro, $28 off for Premium)
                subtotal = (monthly_rate * 6) - (14.00 if plan_key == "pro" else 28.00)
            else:
                subtotal = monthly_rate * dur
                
    discount_amount = 0.00
    discount_pct = 0.00
    
    if promo_code:
        code_upper = promo_code.strip().upper()
        if code_upper in PROMO_CODES:
            discount_pct = PROMO_CODES[code_upper]["discount_pct"]
            discount_amount = round(subtotal * (discount_pct / 100.0), 2)
            
    total_paid = max(0.00, round(subtotal - discount_amount, 2))
    return {
        "subtotal": round(subtotal, 2),
        "discount_amount": discount_amount,
        "discount_pct": discount_pct,
        "tax_amount": 0.00,
        "total_paid": total_paid
    }

def detect_card_brand(card_num: str) -> str:
    cleaned = re.sub(r"\D", "", card_num)
    if cleaned.startswith("4"):
        return "visa"
    elif cleaned.startswith(("51", "52", "53", "54", "55")) or (len(cleaned) >= 4 and 2221 <= int(cleaned[:4]) <= 2720):
        return "mastercard"
    elif cleaned.startswith(("34", "37")):
        return "amex"
    elif cleaned.startswith(("6011", "65", "644", "645")):
        return "discover"
    return "card"


@router.post("/validate-promo", response_model=schemas.PromoValidationResponse)
def validate_promo_code(
    request: schemas.PromoValidationRequest,
    db: Session = Depends(get_db)
):
    """
    Validate a discount promotional code against plan, duration, or lifetime course.
    """
    code_upper = request.promo_code.strip().upper()
    if code_upper not in PROMO_CODES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or expired promo code '{request.promo_code}'."
        )
        
    course_price = 49.00
    if request.purchase_type == "course_lifetime" and request.course_id:
        course = db.query(models.Course).filter(models.Course.id == request.course_id).first()
        if course and course.price is not None:
            course_price = float(course.price)
            
    promo = PROMO_CODES[code_upper]
    pricing = calculate_pricing(
        purchase_type=request.purchase_type,
        plan_name=request.plan_name or "Pro",
        billing_period=request.billing_period or "monthly",
        duration_months=request.duration_months or 1,
        course_price=course_price,
        promo_code=code_upper
    )
    
    return schemas.PromoValidationResponse(
        valid=True,
        promo_code=code_upper,
        discount_pct=promo["discount_pct"],
        discount_amount=pricing["discount_amount"],
        original_price=pricing["subtotal"],
        final_price=pricing["total_paid"],
        message=f"{promo['description']} applied successfully ({int(promo['discount_pct'])}% off)!"
    )


@router.post("/process-payment")
def process_payment(
    request: schemas.ProcessPaymentRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Process realistic payment for all-access subscriptions or lifetime course purchases.
    """
    purchase_type = request.purchase_type or "subscription"
    
    target_course = None
    course_price = 49.00
    if purchase_type == "course_lifetime":
        if not request.course_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course ID is required for lifetime course purchase."
            )
        target_course = db.query(models.Course).filter(models.Course.id == request.course_id).first()
        if not target_course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target course with ID '{request.course_id}' was not found."
            )
        if target_course.price is not None:
            course_price = float(target_course.price)
    else:
        valid_plans = ["Pro", "Premium", "Free"]
        if request.plan_name not in valid_plans:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid plan '{request.plan_name}'. Must be one of: {', '.join(valid_plans)}"
            )

    pricing = calculate_pricing(
        purchase_type=purchase_type,
        plan_name=request.plan_name or "Pro",
        billing_period=request.billing_period or "monthly",
        duration_months=request.duration_months or 1,
        course_price=course_price,
        promo_code=request.promo_code
    )
    
    card_brand = None
    card_last4 = None
    
    if request.payment_method == "credit_card":
        if request.card_number:
            card_num = (request.card_number or "").replace(" ", "").replace("-", "")
            if len(card_num) < 13 or not card_num.isdigit():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid credit card number. Please enter a valid 13-19 digit card number."
                )
                
            # Simulation of realistic test card declines
            if card_num.endswith("0002"):
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Your card was declined by the issuing bank. Please check your card balance or try a different card."
                )
            elif card_num.endswith("0003"):
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Payment failed: Insufficient funds in the designated account."
                )
                
            now_dt = datetime.now()
            if request.card_exp_year is not None and request.card_exp_month is not None:
                if request.card_exp_year < now_dt.year or (request.card_exp_year == now_dt.year and request.card_exp_month < now_dt.month):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="The card expiration date has already passed."
                    )
                    
            card_brand = detect_card_brand(card_num)
            card_last4 = card_num[-4:]
        else:
            card_brand = "visa"
            card_last4 = "4242"
    elif request.payment_method in ["paypal", "google_pay", "crypto"]:
        card_brand = request.payment_method
        card_last4 = "TOKEN"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported payment method '{request.payment_method}'."
        )
        
    now_utc = datetime.now(timezone.utc)
    invoice_num = f"INV-{now_utc.year}-{random.randint(100000, 999999)}"

    # Handle Course Lifetime Purchase
    if purchase_type == "course_lifetime" and target_course:
        # Check if already purchased
        existing_cp = db.query(models.CoursePurchase).filter(
            models.CoursePurchase.user_id == current_user.id,
            models.CoursePurchase.course_id == target_course.id
        ).first()

        invoice = models.Invoice(
            invoice_number=invoice_num,
            user_id=current_user.id,
            purchase_type="course_lifetime",
            course_id=target_course.id,
            plan_tier="lifetime",
            billing_cycle="lifetime",
            currency="USD",
            subtotal=pricing["subtotal"],
            discount_amount=pricing["discount_amount"],
            tax_amount=pricing["tax_amount"],
            total_paid=pricing["total_paid"],
            payment_method=request.payment_method,
            card_brand=card_brand,
            card_last4=card_last4,
            cardholder_name=request.cardholder_name or current_user.full_name or current_user.email,
            billing_country=request.billing_country or "United States",
            billing_zip=request.billing_zip or "10001",
            promo_code=request.promo_code.upper() if request.promo_code else None,
            status="paid"
        )
        db.add(invoice)
        db.flush()

        if not existing_cp:
            course_purchase = models.CoursePurchase(
                user_id=current_user.id,
                course_id=target_course.id,
                purchase_type="lifetime",
                amount_paid=pricing["total_paid"],
                invoice_id=invoice.id
            )
            db.add(course_purchase)

        db.commit()
        db.refresh(invoice)

        return {
            "status": "success",
            "message": f"Successfully purchased lifetime access to '{target_course.title}'!",
            "purchase_type": "course_lifetime",
            "course_id": target_course.id,
            "course_title": target_course.title,
            "invoice": schemas.InvoiceResponse.model_validate(invoice),
            "is_purchased": True,
            "has_access": True,
            "access_type": "lifetime"
        }

    # Handle All-Access Subscription Purchase
    duration_months = request.duration_months or (12 if request.billing_period == "annually" else 1)
    days_to_add = 365 if (request.billing_period == "annually" or duration_months == 12) else (duration_months * 30)
    
    plan_tier_val = (request.plan_name or "pro").lower()
    current_user.subscription_tier = plan_tier_val
    current_user.subscription_status = "active"
    current_user.subscription_expires_at = now_utc + timedelta(days=days_to_add)
    
    if current_user.role not in ["admin", "instructor"]:
        current_user.role = f"{plan_tier_val}_member"
        
    billing_cycle_label = f"{duration_months}-months" if duration_months > 1 and request.billing_period != "annually" else (request.billing_period or "monthly")
    
    invoice = models.Invoice(
        invoice_number=invoice_num,
        user_id=current_user.id,
        purchase_type="subscription",
        plan_tier=plan_tier_val,
        billing_cycle=billing_cycle_label,
        currency="USD",
        subtotal=pricing["subtotal"],
        discount_amount=pricing["discount_amount"],
        tax_amount=pricing["tax_amount"],
        total_paid=pricing["total_paid"],
        payment_method=request.payment_method,
        card_brand=card_brand,
        card_last4=card_last4,
        cardholder_name=request.cardholder_name or current_user.full_name or current_user.email,
        billing_country=request.billing_country or "United States",
        billing_zip=request.billing_zip or "10001",
        promo_code=request.promo_code.upper() if request.promo_code else None,
        status="paid"
    )
    
    db.add(invoice)
    db.commit()
    db.refresh(current_user)
    db.refresh(invoice)
    
    is_sub = has_active_subscription(current_user)
    return {
        "status": "success",
        "message": f"Payment successfully authorized! CyberLearn {request.plan_name} plan is now active for {duration_months} month(s).",
        "purchase_type": "subscription",
        "invoice": schemas.InvoiceResponse.model_validate(invoice),
        "user_role": current_user.role,
        "subscription_tier": current_user.subscription_tier,
        "subscription_status": current_user.subscription_status,
        "subscription_expires_at": current_user.subscription_expires_at,
        "is_subscribed": is_sub
    }


@router.post("/checkout")
def create_checkout_session(
    request: schemas.ProcessPaymentRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Backwards-compatible wrapper routing to payment processor.
    """
    return process_payment(request, db, current_user)


@router.get("/invoices", response_model=List[schemas.InvoiceResponse])
def get_user_invoices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieve all historical billing invoices and receipts for the authenticated user.
    """
    invoices = (
        db.query(models.Invoice)
        .filter(models.Invoice.user_id == current_user.id)
        .order_by(models.Invoice.created_at.desc())
        .all()
    )
    return invoices


@router.get("/invoices/{invoice_id}", response_model=schemas.InvoiceResponse)
def get_invoice_detail(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get itemized details of a specific invoice.
    """
    invoice = (
        db.query(models.Invoice)
        .filter(models.Invoice.id == invoice_id, models.Invoice.user_id == current_user.id)
        .first()
    )
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found."
        )
    return invoice


@router.get("/my-courses", response_model=List[schemas.CoursePurchaseResponse])
def get_my_purchased_courses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get list of individual courses owned permanently via lifetime purchases.
    """
    purchases = (
        db.query(models.CoursePurchase)
        .filter(models.CoursePurchase.user_id == current_user.id)
        .order_by(models.CoursePurchase.created_at.desc())
        .all()
    )
    results = []
    for p in purchases:
        c_title = p.course.title if p.course else "Cyber Security Course"
        results.append(schemas.CoursePurchaseResponse(
            id=p.id,
            user_id=p.user_id,
            course_id=p.course_id,
            course_title=c_title,
            purchase_type=p.purchase_type,
            amount_paid=float(p.amount_paid or 0.0),
            invoice_id=p.invoice_id,
            created_at=p.created_at
        ))
    return results


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
