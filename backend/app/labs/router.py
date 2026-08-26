import hmac
import hashlib
import json
import secrets
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user, require_subscription
from ..config import settings
from .terminal import terminal_manager

router = APIRouter(
    prefix="/labs",
    tags=["Practice Labs"]
)


def generate_lab_flag(lab_id: str) -> str:
    """
    Generate a deterministic CTF flag for a lab using HMAC-SHA256.

    The flag is derived from the lab ID and a secret key (FLAG_SECRET),
    so it is:
      - Deterministic: same secret + lab_id = same flag (across restarts if
        FLAG_SECRET is persisted in .env)
      - Unique per deployment: different FLAG_SECRET = different flags
      - Not stored in source code
    """
    signature = hmac.new(
        settings.FLAG_SECRET.encode("utf-8"),
        lab_id.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()[:16]
    return f"FLAG{{{signature}}}"


# Seed labs list — flags are NOT stored here; they are generated at runtime from FLAG_SECRET
SEED_LABS = [
    {
        "id": "linux-navigation",
        "title": "Linux Command Navigation",
        "category": "Linux",
        "difficulty": "Easy",
        "time_limit": 1800,
        "xp_reward": 100,
        "description": "Practice filesystem navigation using commands like cd, ls, and pwd in a sandbox container environment.",
        "container_template": "linux-basic",
    },
    {
        "id": "sql-injection-bypass",
        "title": "SQL Injection Bypass",
        "category": "Web Security",
        "difficulty": "Medium",
        "time_limit": 2700,
        "xp_reward": 250,
        "description": "Bypass standard authentication mechanisms by exploiting vulnerable SQL search queries.",
        "container_template": "web-security",
    },
    {
        "id": "packet-sniffer-recon",
        "title": "Packet Sniffer & Wireshark",
        "category": "Networking",
        "difficulty": "Medium",
        "time_limit": 3600,
        "xp_reward": 300,
        "description": "Intercept traffic on a local area network to capture plaintext login credentials.",
        "container_template": "networking",
    },
    {
        "id": "book-recon",
        "title": "Book Recon",
        "category": "OSINT",
        "difficulty": "Easy",
        "time_limit": 1800,
        "xp_reward": 100,
        "description": "Find the flag hidden in the vulnerable web application.",
        "container_template": "osint-basic",
    },
    {
        "id": "sql-beginner",
        "title": "SQL Beginner",
        "category": "Web Security",
        "difficulty": "Easy",
        "time_limit": 1800,
        "xp_reward": 150,
        "description": "Exploit a basic SQL injection vulnerability to retrieve the flag.",
        "container_template": "web-security",
    },
    {
        "id": "ctf-101",
        "title": "Capture The Flag 101",
        "category": "CTF",
        "difficulty": "Medium",
        "time_limit": 2700,
        "xp_reward": 250,
        "description": "Your first multi-step CTF challenge. Follow the breadcrumbs.",
        "container_template": "ctf-basic",
    },
    {
        "id": "linux-privesc",
        "title": "Linux Privesc",
        "category": "Linux",
        "difficulty": "Hard",
        "time_limit": 3600,
        "xp_reward": 500,
        "description": "Escalate your privileges on a Linux machine to read the root flag.",
        "container_template": "linux-basic",
    },
    {
        "id": "bug-hunter",
        "title": "Bug Hunter",
        "category": "Web Security",
        "difficulty": "Expert",
        "time_limit": 5400,
        "xp_reward": 1000,
        "description": "Find and chain multiple vulnerabilities in a complex web app.",
        "container_template": "web-security",
    },
    {
        "id": "root-access",
        "title": "Root Access",
        "category": "Privilege Escalation",
        "difficulty": "Medium",
        "time_limit": 2700,
        "xp_reward": 300,
        "description": "Gain root access to the system using misconfigurations.",
        "container_template": "linux-basic",
    },
    {
        "id": "xss-master",
        "title": "XSS Master",
        "category": "Web Security",
        "difficulty": "Medium",
        "time_limit": 2400,
        "xp_reward": 200,
        "description": "Bypass XSS filters and execute arbitrary JavaScript.",
        "container_template": "web-security",
    },
    {
        "id": "network-sniffer",
        "title": "Network Sniffer",
        "category": "Networking",
        "difficulty": "Easy",
        "time_limit": 1800,
        "xp_reward": 120,
        "description": "Analyze network traffic to extract credentials.",
        "container_template": "networking",
    },
    {
        "id": "crypto-basics",
        "title": "Crypto Basics",
        "category": "Crypto",
        "difficulty": "Easy",
        "time_limit": 1800,
        "xp_reward": 100,
        "description": "Decode encrypted messages using classic ciphers.",
        "container_template": "crypto-basic",
    },
]

def seed_labs_if_empty(db: Session):
    for l in SEED_LABS:
        db_lab = db.query(models.Lab).filter(models.Lab.id == l["id"]).first()
        if not db_lab:
            db_lab = models.Lab(
                id=l["id"],
                title=l["title"],
                type=l["category"],
                difficulty=l["difficulty"],
                time_limit=l["time_limit"],
                xp_reward=l["xp_reward"],
                description=l["description"],
                container_template=l["container_template"]
            )
            db.add(db_lab)
        else:
            db_lab.title = l["title"]
            db_lab.type = l["category"]
            db_lab.difficulty = l["difficulty"]
            db_lab.time_limit = l["time_limit"]
            db_lab.xp_reward = l["xp_reward"]
            db_lab.description = l["description"]
            db_lab.container_template = l["container_template"]
    db.commit()

@router.get("", response_model=List[schemas.LabResponse])
def get_labs(db: Session = Depends(get_db)):
    return db.query(models.Lab).all()

@router.post("/start", response_model=schemas.LabSessionResponse)
def start_lab_session(
    request: schemas.LabStartRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_subscription)
):
    # Check if lab exists
    lab = db.query(models.Lab).filter(models.Lab.id == request.lab_id).first()
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested lab environment does not exist."
        )
    
    # Check if there is an active session
    active_session = db.query(models.LabSession).filter(
        models.LabSession.user_id == current_user.id,
        models.LabSession.lab_id == request.lab_id,
        models.LabSession.status == "running"
    ).first()
    
    if active_session:
        return active_session
        
    # Start fresh session
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=lab.time_limit)
    new_session = models.LabSession(
        user_id=current_user.id,
        lab_id=lab.id,
        container_id=f"sandbox-container-{current_user.id[:8]}-{lab.id[:8]}-{secrets.token_hex(3)}",
        status="running",
        started_at=datetime.now(timezone.utc),
        expires_at=expires_at
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.post("/{session_id}/reset", response_model=schemas.LabSessionResponse)
def reset_lab_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_subscription)
):
    session = db.query(models.LabSession).filter(
        models.LabSession.id == session_id,
        models.LabSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or permission denied."
        )
        
    lab = db.query(models.Lab).filter(models.Lab.id == session.lab_id).first()
    session.started_at = datetime.now(timezone.utc)
    session.expires_at = datetime.now(timezone.utc) + timedelta(seconds=lab.time_limit if lab else 3600)
    session.status = "running"
    
    db.commit()
    db.refresh(session)
    return session

@router.post("/{session_id}/submit")
def submit_flag(
    session_id: str,
    flag_submission: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_subscription)
):
    session = db.query(models.LabSession).filter(
        models.LabSession.id == session_id,
        models.LabSession.user_id == current_user.id,
        models.LabSession.status == "running"
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active running session found to submit flag for."
        )
        
    # Generate the expected flag using HMAC — never stored in source code
    expected_flag = generate_lab_flag(session.lab_id)
        
    if flag_submission.strip() == expected_flag:
        # Success!
        session.status = "completed"
        session.completed_at = datetime.now(timezone.utc)
        
        # Award XP to user
        lab = db.query(models.Lab).filter(models.Lab.id == session.lab_id).first()
        xp_gain = lab.xp_reward if lab else 100
        current_user.xp += xp_gain
        current_user.streak_days += 1 # simple progression metric
        
        db.commit()
        return {
            "correct": True,
            "message": f"Congratulations! Flag accepted. Awarded +{xp_gain} XP.",
            "xp_awarded": xp_gain
        }
    else:
        return {
            "correct": False,
            "message": "Incorrect flag payload. Review instructions or ask the AI coach for hints!"
        }


@router.get("/{lab_id}/flag")
def get_lab_flag(
    lab_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Retrieve the generated flag for a specific lab.
    Restricted to admin users only — used for container provisioning and testing.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can retrieve lab flags."
        )

    # Verify the lab exists
    lab = db.query(models.Lab).filter(models.Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested lab does not exist."
        )
    flag = generate_lab_flag(lab_id)
    return {
        "lab_id": lab_id,
        "flag": flag,
        "generated_flag": flag
    }

class ProxyForwardRequest(BaseModel):
    method: str = "GET"
    url: str
    headers: dict = {}
    body: str = ""

@router.post("/proxy/forward")
def proxy_forward_request(
    req: ProxyForwardRequest,
    current_user: models.User = Depends(require_subscription)
):
    """
    Execute HTTP request inspection server-side for the Web Proxy Inspector tool.
    Detects SQLi/XSS vulnerability injection payloads or proxies live target HTTP calls.
    """
    url_lower = req.url.lower()
    body_lower = req.body.lower()
    
    # Analyze payloads for educational sandbox vulnerabilities
    if "' or '1'='1" in body_lower or "or 1=1" in url_lower:
        flag = generate_lab_flag("sql-injection-bypass")
        res_body = json.dumps({
            "status": "vulnerable",
            "vulnerability": "SQL Injection Discovered!",
            "payload_executed": req.body,
            "flag": flag,
            "database_backend": "SQLite 3.x",
            "exposed_table": "users (admin hash leaked)"
        }, indent=2)
        return {
            "status": 200,
            "headers": {"Content-Type": "application/json", "X-Proxy-Intercepted": "true"},
            "body": res_body
        }
    elif "<script>" in body_lower or "javascript:" in body_lower or "<img" in body_lower:
        flag = generate_lab_flag("xss-master")
        res_body = json.dumps({
            "status": "vulnerable",
            "vulnerability": "Reflected XSS Triggered!",
            "rendered_payload": req.body,
            "flag": flag,
            "context": "Inline script executed in browser DOM context"
        }, indent=2)
        return {
            "status": 200,
            "headers": {"Content-Type": "application/json", "X-Proxy-Intercepted": "true"},
            "body": res_body
        }
    else:
        res_body = json.dumps({
            "status": 200,
            "message": "HTTP Proxy request processed successfully.",
            "target": req.url,
            "method": req.method,
            "request_length": len(req.body)
        }, indent=2)
        return {
            "status": 200,
            "headers": {"Content-Type": "application/json", "X-Proxy-Intercepted": "true"},
            "body": res_body
        }

class HintUnlockRequest(BaseModel):
    level: int
    cost: int

@router.post("/{lab_id}/hints/unlock")
def unlock_socratic_hint(
    lab_id: str,
    req: HintUnlockRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_subscription)
):
    """
    Unlock a progressive Socratic hint and persist XP deduction to user account.
    """
    if req.cost < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cost must be a positive integer."
        )

    if current_user.xp < req.cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient XP to unlock this hint level."
        )
        
    current_user.xp -= req.cost
    db.commit()
    
    return {
        "unlocked": True,
        "level": req.level,
        "cost": req.cost,
        "remaining_xp": current_user.xp
    }

@router.websocket("/ws/{session_id}/terminal")
async def websocket_terminal_endpoint(websocket: WebSocket, session_id: str):
    await terminal_manager.handle_websocket(websocket, session_id)

