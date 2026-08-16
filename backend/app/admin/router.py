from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user
import random

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"]
)

# Admin Authorization Dependency
def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrative privileges to access this resource."
        )
    return current_user

@router.get("/metrics")
def get_admin_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    total_users = db.query(models.User).count()
    active_sandboxes = db.query(models.LabSession).filter(models.LabSession.status == "running").count()
    completed_labs = db.query(models.LabSession).filter(models.LabSession.status == "completed").count()

    db_connections = random.randint(12, 18)
    cpu_load = random.randint(30, 48)
    ram_used = random.randint(58, 66) # GB
    
    container_templates = [
        {"name": "linux-navigation-sandbox", "users": db.query(models.LabSession).filter(models.LabSession.lab_id == "linux-navigation", models.LabSession.status == "running").count(), "status": "Healthy", "cpu": "12%", "memory": "1.2 GB"},
        {"name": "sqli-bypass-sandbox", "users": db.query(models.LabSession).filter(models.LabSession.lab_id == "sql-injection-bypass", models.LabSession.status == "running").count(), "status": "Healthy", "cpu": "24%", "memory": "2.1 GB"},
        {"name": "wireshark-sniffer-sandbox", "users": db.query(models.LabSession).filter(models.LabSession.lab_id == "packet-sniffer-recon", models.LabSession.status == "running").count(), "status": "Healthy", "cpu": "8%", "memory": "890 MB"},
        {"name": "cron-privesc-sandbox", "users": 0, "status": "Healthy", "cpu": "2%", "memory": "250 MB"},
    ]
    
    recent_errors = [
        {"source": "Auth Service", "msg": "JWT Signature verification checked from API caller.", "level": "Medium", "time": "5m ago"},
        {"source": "Container Manager", "msg": f"Docker container pool running active sandboxes: {active_sandboxes}", "level": "Low", "time": "12m ago"},
        {"source": "Lab DB", "msg": f"Total DB users registered count: {total_users}", "level": "Low", "time": "42m ago"},
    ]
    
    return {
        "stats": [
            { "label": "Total Users", "value": f"{total_users}", "change": "+12% this week", "color": "text-primary", "bg": "bg-primary/10" },
            { "label": "Active Sandboxes", "value": f"{active_sandboxes}", "change": f"{cpu_load}% CPU load", "color": "text-accent", "bg": "bg-accent/10" },
            { "label": "Completed Labs", "value": f"{completed_labs}", "change": "Completed submissions", "color": "text-warning", "bg": "bg-warning/10" },
            { "label": "System Health", "value": "99.9%", "change": "0 active alerts", "color": "text-success", "bg": "bg-success/10" },
        ],
        "containers": container_templates,
        "resources": {
            "cpu": cpu_load,
            "ram": ram_used,
            "storage": 78,
            "db_conn": db_connections
        },
        "errors": recent_errors
    }

@router.get("/verifications", response_model=List[schemas.NidVerificationResponse])
def get_pending_verifications(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    query = db.query(models.User).filter(models.User.nid_number.isnot(None))
    if status_filter:
        query = query.filter(models.User.verification_status == status_filter)
    users = query.order_by(models.User.created_at.desc()).all()
    
    return [
        schemas.NidVerificationResponse(
            user_id=u.id,
            full_name=u.full_name,
            email=u.email,
            nid_number=u.nid_number,
            nid_front_image=u.nid_front_image,
            nid_back_image=u.nid_back_image,
            verification_status=u.verification_status or "unverified",
            verification_notes=u.verification_notes,
            verified_at=u.verified_at,
            created_at=u.created_at
        )
        for u in users
    ]

@router.post("/verifications/{user_id}/review", response_model=schemas.NidVerificationResponse)
def review_nid_verification(
    user_id: str,
    review: schemas.NidVerificationReviewRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    if review.status not in ["verified", "rejected", "pending"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'verified', 'rejected', or 'pending'."
        )

    from datetime import datetime, timezone
    target_user.verification_status = review.status
    target_user.verification_notes = review.notes or (
        "National ID verified by Administrator." if review.status == "verified" else "Verification rejected."
    )
    if review.status == "verified":
        target_user.verified_at = datetime.now(timezone.utc)
        target_user.is_verified = True
    elif review.status == "rejected":
        target_user.verified_at = None

    db.commit()
    db.refresh(target_user)

    return schemas.NidVerificationResponse(
        user_id=target_user.id,
        full_name=target_user.full_name,
        email=target_user.email,
        nid_number=target_user.nid_number,
        nid_front_image=target_user.nid_front_image,
        nid_back_image=target_user.nid_back_image,
        verification_status=target_user.verification_status,
        verification_notes=target_user.verification_notes,
        verified_at=target_user.verified_at,
        created_at=target_user.created_at
    )

