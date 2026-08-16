import os
import json
import urllib.request
import urllib.error
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth.dependencies import get_current_user
from .. import models, schemas

router = APIRouter(
    prefix="/ai",
    tags=["AI Cyber Coach"]
)

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

def _query_external_llm(user_message: str, user_name: str, system_prompt: Optional[str] = None, history_messages: Optional[List[dict]] = None) -> Optional[str]:
    """
    Attempt to query Gemini API or OpenAI API with custom system instructions.
    """
    default_prompt = (
        f"You are Coach Jarvis, an expert, encouraging ethical cybersecurity tutor at CyberLearn Academy. "
        f"Answer the student's question clearly, concisely, and accurately. Student Name: {user_name}."
    )
    effective_system = system_prompt.strip() if (system_prompt and system_prompt.strip()) else default_prompt

    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            
            contents = []
            # Add past history if available
            if history_messages:
                for h in history_messages[-6:]:
                    role = "user" if h.get("role") == "user" else "model"
                    contents.append({"role": role, "parts": [{"text": h.get("content", "")}]})
            
            prompt_full = f"[System Instructions: {effective_system}]\nStudent Question: {user_message}"
            contents.append({"role": "user", "parts": [{"text": prompt_full}]})

            payload = json.dumps({"contents": contents}).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                candidates = res_data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text")
        except Exception as e:
            print("Gemini API call failed, falling back to security engine:", e)

    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            messages = [{"role": "system", "content": effective_system}]
            if history_messages:
                for h in history_messages[-6:]:
                    r = "user" if h.get("role") == "user" else "assistant"
                    messages.append({"role": r, "content": h.get("content", "")})
            messages.append({"role": "user", "content": user_message})

            payload = json.dumps({
                "model": "gpt-4o-mini",
                "messages": messages
            }).encode("utf-8")
            req = urllib.request.Request(url, data=payload, headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {openai_key}"
            })
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                choices = res_data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content")
        except Exception as e:
            print("OpenAI API call failed, falling back to security engine:", e)

    return None

def _generate_fallback_response(query: str, user_name: str, system_prompt: Optional[str] = None) -> str:
    prompt_tag = f" (Focus: {system_prompt})" if system_prompt else ""
    
    if "same-origin" in query or "sop" in query:
        return (
            f"Hello {user_name}!{prompt_tag}\n\n"
            "The Same-Origin Policy (SOP) is a foundational web browser security model. "
            "It restricts how scripts running on one origin (e.g. https://attacker.com) can access cookies, localStorage, "
            "or DOM content on a different origin (e.g. https://yourbank.com).\n\n"
            "An origin is strictly defined by three components:\n"
            "1. Scheme (e.g. http, https)\n"
            "2. Host Domain (e.g. app.cyberlearn.io)\n"
            "3. Port (e.g. 80, 443)\n\n"
            "If any of these three differ, browsers enforce isolation to protect user privacy!"
        )
    elif "xss" in query or "cross-site" in query:
        return (
            f"Great question on XSS, {user_name}!{prompt_tag}\n\n"
            "Cross-Site Scripting occurs when untrusted user input is rendered in the DOM without sanitization.\n\n"
            "Key XSS Variations:\n"
            "• Reflected XSS: Payload comes from the immediate HTTP request (e.g. search query URL).\n"
            "• Stored XSS: Payload is saved in a database (e.g. user profile, forum comment) and served to subsequent visitors.\n"
            "• DOM XSS: Client-side JavaScript reads input (e.g. location.hash) and writes it directly to innerHTML.\n\n"
            "Mitigation: Always use context-aware HTML entity encoding and strict Content Security Policies (CSP)!"
        )
    elif "sql" in query or "sqli" in query:
        return (
            f"SQL Injection (SQLi) is a critical database flaw, {user_name}!{prompt_tag}\n\n"
            "When input fields concatenate user strings directly into SQL queries, "
            "attackers can break out of string context using single quotes (') and inject boolean conditions like `OR '1'='1` or UNION SELECT statements.\n\n"
            "Defense: Use Prepared Statements and Parameterized Queries (ORMs like SQLAlchemy or PDO)!"
        )
    elif "privilege" in query or "privesc" in query or "sudo" in query:
        return (
            f"Privilege Escalation in Linux involves turning lower-level shell access into root access, {user_name}.\n\n"
            "Common Vectors to inspect:\n"
            "1. SUID Executables: `find / -perm -4000 -type f 2>/dev/null`\n"
            "2. Sudo Privileges: `sudo -l` to see binaries runnable without a password.\n"
            "3. Vulnerable Cron Jobs: Inspect `/etc/crontab` and writeable cron script permissions."
        )
    elif "nmap" in query or "scan" in query or "recon" in query:
        return (
            f"Reconnaissance is step #1 in ethical penetration testing, {user_name}!\n\n"
            "Essential Nmap Cheat Sheet:\n"
            "• `nmap -sV -sC <IP>`: Detect service versions and run default NSE scripts.\n"
            "• `nmap -p- <IP>`: Scan all 65,535 TCP ports.\n"
            "• `nmap -O <IP>`: Perform OS fingerprinting."
        )
    else:
        return (
            f"Hello {user_name}! I am Coach Jarvis, your AI Security Mentor.{prompt_tag}\n\n"
            f"Regarding your query: In cybersecurity assessment, we systematically trace attack vectors, audit network logs, "
            "inspect authentication cookies, and enforce least-privilege configurations.\n\n"
            "Feel free to ask about Web Security (SQLi/XSS), Linux PrivEsc, Nmap Scanning, or Exam Prep!"
        )

# Legacy Chat Route (Backward compatibility)
@router.post("/chat")
def chat_with_coach(request: ChatRequest, current_user: models.User = Depends(get_current_user)):
    user_name = current_user.full_name.split()[0] if (current_user.full_name and current_user.full_name.strip()) else "Agent"
    query = request.message.lower()
    
    llm_reply = _query_external_llm(request.message, user_name)
    if llm_reply:
        return {"reply": llm_reply, "coach_name": "Jarvis (AI LLM Active)"}

    return {
        "reply": _generate_fallback_response(query, user_name),
        "coach_name": "Jarvis"
    }

# ----------------- Multi-Session AI Management ----------------- #

@router.get("/sessions", response_model=List[schemas.AiSessionResponse])
def list_ai_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sessions = db.query(models.AiSession).filter(
        models.AiSession.user_id == current_user.id
    ).order_by(models.AiSession.updated_at.desc()).all()

    # If user has no sessions, create a starter session
    if not sessions:
        starter = models.AiSession(
            user_id=current_user.id,
            title="General Cybersecurity Tutoring",
            system_prompt="You are Coach Jarvis, an expert and patient cybersecurity mentor specializing in practical hands-on labs and exam preparation."
        )
        db.add(starter)
        db.commit()
        db.refresh(starter)
        sessions = [starter]

    result = []
    for s in sessions:
        msg_count = db.query(models.AiChatMessage).filter(models.AiChatMessage.session_id == s.id).count()
        result.append(schemas.AiSessionResponse(
            id=s.id,
            user_id=s.user_id,
            title=s.title,
            system_prompt=s.system_prompt,
            model_type=s.model_type or "gemini-1.5-flash",
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=msg_count
        ))
    return result

@router.post("/sessions", response_model=schemas.AiSessionResponse, status_code=status.HTTP_201_CREATED)
def create_ai_session(
    session_in: schemas.AiSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_session = models.AiSession(
        user_id=current_user.id,
        title=session_in.title or "New AI Security Session",
        system_prompt=session_in.system_prompt,
        model_type=session_in.model_type or "gemini-1.5-flash"
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return schemas.AiSessionResponse(
        id=new_session.id,
        user_id=new_session.user_id,
        title=new_session.title,
        system_prompt=new_session.system_prompt,
        model_type=new_session.model_type,
        created_at=new_session.created_at,
        updated_at=new_session.updated_at,
        message_count=0
    )

@router.get("/sessions/{session_id}")
def get_ai_session_details(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.AiSession).filter(
        models.AiSession.id == session_id,
        models.AiSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Session not found."
        )

    messages = db.query(models.AiChatMessage).filter(
        models.AiChatMessage.session_id == session.id
    ).order_by(models.AiChatMessage.created_at.asc()).all()

    return {
        "session": schemas.AiSessionResponse(
            id=session.id,
            user_id=session.user_id,
            title=session.title,
            system_prompt=session.system_prompt,
            model_type=session.model_type,
            created_at=session.created_at,
            updated_at=session.updated_at,
            message_count=len(messages)
        ),
        "messages": [
            schemas.AiChatMessageResponse(
                id=m.id,
                session_id=m.session_id,
                role=m.role,
                content=m.content,
                created_at=m.created_at
            ) for m in messages
        ]
    }

@router.put("/sessions/{session_id}", response_model=schemas.AiSessionResponse)
def update_ai_session(
    session_id: str,
    session_update: schemas.AiSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.AiSession).filter(
        models.AiSession.id == session_id,
        models.AiSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Session not found."
        )

    if session_update.title:
        session.title = session_update.title
    if session_update.system_prompt is not None:
        session.system_prompt = session_update.system_prompt
    if session_update.model_type:
        session.model_type = session_update.model_type

    db.commit()
    db.refresh(session)

    msg_count = db.query(models.AiChatMessage).filter(models.AiChatMessage.session_id == session.id).count()

    return schemas.AiSessionResponse(
        id=session.id,
        user_id=session.user_id,
        title=session.title,
        system_prompt=session.system_prompt,
        model_type=session.model_type,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=msg_count
    )

@router.delete("/sessions/{session_id}")
def delete_ai_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.AiSession).filter(
        models.AiSession.id == session_id,
        models.AiSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Session not found."
        )

    db.delete(session)
    db.commit()
    return {"status": "deleted", "session_id": session_id}

@router.post("/sessions/{session_id}/chat")
def chat_in_session(
    session_id: str,
    req: schemas.AiSessionChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.AiSession).filter(
        models.AiSession.id == session_id,
        models.AiSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Session not found."
        )

    # Record User Message
    user_msg = models.AiChatMessage(
        session_id=session.id,
        role="user",
        content=req.message
    )
    db.add(user_msg)
    db.commit()

    # Load history for context
    past_messages = db.query(models.AiChatMessage).filter(
        models.AiChatMessage.session_id == session.id
    ).order_by(models.AiChatMessage.created_at.asc()).all()

    history_dicts = [{"role": m.role, "content": m.content} for m in past_messages]

    user_name = current_user.full_name.split()[0] if (current_user.full_name and current_user.full_name.strip()) else "Agent"
    effective_prompt = req.override_system_prompt or session.system_prompt

    # Query LLM or fallback
    llm_reply = _query_external_llm(req.message, user_name, effective_prompt, history_dicts)
    if not llm_reply:
        llm_reply = _generate_fallback_response(req.message.lower(), user_name, effective_prompt)

    # Record Assistant Message
    assistant_msg = models.AiChatMessage(
        session_id=session.id,
        role="assistant",
        content=llm_reply
    )
    db.add(assistant_msg)
    db.commit()

    return {
        "reply": llm_reply,
        "coach_name": "Jarvis",
        "session_id": session.id,
        "system_prompt": effective_prompt
    }
