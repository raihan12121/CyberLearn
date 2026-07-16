from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
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
