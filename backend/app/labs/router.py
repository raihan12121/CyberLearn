from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user

router = APIRouter(
    prefix="/labs",
    tags=["Practice Labs"]
)

# Seed labs list
SEED_LABS = [
    {
        "id": "linux-navigation",
        "title": "Linux Command Navigation",
        "category": "Linux basics",
        "difficulty": "Easy",
        "time_limit": 1800,
        "xp_reward": 100,
        "description": "Practice filesystem navigation using commands like cd, ls, and pwd in a sandbox container environment.",
        "container_template": "linux-basic",
        "flag": "FLAG{cyber_learn_permissions_101}"
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
        "flag": "FLAG{sqli_bypass_successful_1337}"
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
        "flag": "FLAG{network_pcap_sniff_98}"
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
        "flag": "FLAG{book_recon_osint_99}"
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
        "flag": "FLAG{sql_beginner_injection_42}"
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
        "flag": "FLAG{ctf_101_breadcrumbs_55}"
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
        "flag": "FLAG{linux_privesc_root_access_77}"
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
        "flag": "FLAG{bug_hunter_expert_chaining_999}"
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
        "flag": "FLAG{root_access_misconfig_88}"
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
        "flag": "FLAG{xss_master_filter_bypass_123}"
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
        "flag": "FLAG{network_sniffer_wireshark_12}"
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
        "flag": "FLAG{crypto_basics_classic_cipher_10}"
    },
]

def seed_labs_if_empty(db: Session):
    count = db.query(models.Lab).count()
    # If not all seeded labs exist, delete and re-seed to make sure everything matches
    if count < len(SEED_LABS):
        # Clean existing labs if less than total seeded labs
        db.query(models.Lab).delete()
        for l in SEED_LABS:
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
        db.commit()

@router.get("", response_model=List[schemas.LabResponse])
def get_labs(db: Session = Depends(get_db)):
    seed_labs_if_empty(db)
    return db.query(models.Lab).all()

@router.post("/start", response_model=schemas.LabSessionResponse)
def start_lab_session(
    request: schemas.LabStartRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    seed_labs_if_empty(db)
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
    expires_at = datetime.utcnow() + timedelta(seconds=lab.time_limit)
    new_session = models.LabSession(
        user_id=current_user.id,
        lab_id=lab.id,
        container_id=f"sandbox-container-{current_user.id[:8]}-{lab.id[:8]}",
        status="running",
        started_at=datetime.utcnow(),
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
    current_user: models.User = Depends(get_current_user)
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
    session.started_at = datetime.utcnow()
    session.expires_at = datetime.utcnow() + timedelta(seconds=lab.time_limit if lab else 3600)
    session.status = "running"
    
    db.commit()
    db.refresh(session)
    return session

@router.post("/{session_id}/submit")
def submit_flag(
    session_id: str,
    flag_submission: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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
        
    # Find matching flag from seed data
    matching_flag = None
    for l in SEED_LABS:
        if l["id"] == session.lab_id:
            matching_flag = l["flag"]
            break
            
    if not matching_flag:
        matching_flag = "FLAG{default_placeholder}"
        
    if flag_submission.strip() == matching_flag:
        # Success!
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        
        # Award XP to user
        lab = db.query(models.Lab).filter(models.Lab.id == session.lab_id).first()
        xp_gain = lab.xp_reward if lab else 100
        current_user.xp += xp_gain
        current_user.streak_days += 1 # simple progression metric
        
        # Save progress record
        db_progress = models.Progress(
            user_id=current_user.id,
            course_id="web-security-fundamentals", # default link
            lesson_id=session.lab_id,
            status="completed",
            completion_pct=100.0
        )
        db.add(db_progress)
        
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
