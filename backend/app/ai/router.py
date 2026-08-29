import os
import json
import time
import hashlib
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..auth.dependencies import get_current_user
from ..config import settings
from .. import models, schemas

logger = logging.getLogger("cyberlearn.ai")

router = APIRouter(
    prefix="/ai",
    tags=["AI Cyber Coach"]
)

# Zero-cost in-memory cache for repetitive queries (10 min TTL)
_ai_response_cache: Dict[str, Dict[str, Any]] = {}
AI_CACHE_TTL_SECONDS = 600

# Active high-availability Gemini models on Google AI Studio
GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest"
]

def _get_cache_key(query: str, system_prompt: Optional[str]) -> str:
    raw = f"{query.strip().lower()}|||{(system_prompt or '').strip().lower()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def _get_from_cache(cache_key: str) -> Optional[str]:
    now = time.time()
    if cache_key in _ai_response_cache:
        entry = _ai_response_cache[cache_key]
        if now - entry["timestamp"] < AI_CACHE_TTL_SECONDS:
            return entry["response"]
        else:
            del _ai_response_cache[cache_key]
    return None

def _store_in_cache(cache_key: str, response: str):
    if len(_ai_response_cache) > 200:
        _ai_response_cache.clear()
    _ai_response_cache[cache_key] = {
        "response": response,
        "timestamp": time.time()
    }

class ChatMessage(BaseModel):
    sender: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

async def _query_external_llm(
    user_message: str,
    user_name: str,
    system_prompt: Optional[str] = None,
    history_messages: Optional[List[dict]] = None
) -> Optional[str]:
    """
    Non-blocking async query to Google Gemini API (with multi-model fallback chain) or OpenAI.
    """
    default_prompt = (
        f"You are Coach Jarvis, an expert, enthusiastic, and encouraging cybersecurity mentor at CyberLearn Academy. "
        f"Address the student warmly (Name: {user_name}). Provide clear, structured, actionable, and practical guidance."
    )
    effective_system = system_prompt.strip() if (system_prompt and system_prompt.strip()) else default_prompt

    # Check cache only for simple standalone single-turn queries
    cache_key = None
    if not history_messages or len(history_messages) == 0:
        cache_key = _get_cache_key(user_message, effective_system)
        cached_reply = _get_from_cache(cache_key)
        if cached_reply:
            logger.info("Serving AI response from in-memory cache")
            return cached_reply

    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        contents = []
        if history_messages:
            for h in history_messages[-10:]:
                raw_text = (h.get("content") or "").strip()
                if not raw_text:
                    continue
                role = "user" if h.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [{"text": raw_text}]})
        
        # Append current user prompt if not duplicate
        if not contents or contents[-1].get("parts", [{}])[0].get("text") != user_message:
            contents.append({"role": "user", "parts": [{"text": user_message}]})

        payload = {
            "system_instruction": {
                "parts": [{"text": effective_system}]
            },
            "contents": contents
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            for model_name in GEMINI_MODELS:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
                try:
                    res = await client.post(
                        url,
                        json=payload,
                        headers={"Content-Type": "application/json"}
                    )
                    if res.status_code == 200:
                        res_data = res.json()
                        candidates = res_data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                reply = parts[0].get("text")
                                if reply:
                                    if cache_key:
                                        _store_in_cache(cache_key, reply)
                                    return reply
                    else:
                        logger.warning(f"Gemini model {model_name} returned status {res.status_code}: {res.text[:120]}")
                except Exception as e:
                    logger.warning(f"Gemini model {model_name} failed: {e}")

    openai_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            messages = [{"role": "system", "content": effective_system}]
            if history_messages:
                for h in history_messages[-10:]:
                    raw_text = (h.get("content") or "").strip()
                    if not raw_text:
                        continue
                    r = "user" if h.get("role") == "user" else "assistant"
                    messages.append({"role": r, "content": raw_text})
            
            if not messages or messages[-1].get("content") != user_message:
                messages.append({"role": "user", "content": user_message})

            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    url,
                    json={"model": "gpt-4o-mini", "messages": messages, "max_tokens": 800},
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {openai_key}"
                    }
                )
                if res.status_code == 200:
                    res_data = res.json()
                    choices = res_data.get("choices", [])
                    if choices:
                        reply = choices[0].get("message", {}).get("content")
                        if reply:
                            if cache_key:
                                _store_in_cache(cache_key, reply)
                            return reply
        except Exception as e:
            logger.warning(f"OpenAI async API call failed: {e}")

    return None

def _generate_fallback_response(query: str, user_name: str, system_prompt: Optional[str] = None) -> str:
    prompt_tag = f" (Focus: {system_prompt})" if system_prompt else ""
    
    # 1. Learning roadmaps, help, beginner guidance
    if any(k in query for k in ["how can you help", "learn", "start", "roadmap", "begin", "study", "plan", "where to start"]):
        return (
            f"Hello {user_name}! Welcome to CyberLearn Academy. I am Coach Jarvis, your AI Security Mentor.{prompt_tag}\n\n"
            "Here is how we can accelerate your cybersecurity learning journey:\n\n"
            "### 🎯 Step-by-Step Learning Framework:\n"
            "1. **Interactive Labs**: Practice in our live virtual labs to master web security, networking protocols, and SOC telemetry.\n"
            "2. **Concept Deconstruction**: Ask me any concept (e.g. *Same-Origin Policy*, *Buffer Overflow*, *Kerberos*) and I will break it down with simple real-world analogies.\n"
            "3. **Exam & Cert Drills**: Practice scenario-based quizzes for CompTIA Security+, CEH, and CyberLearn Certified Defender exams.\n"
            "4. **CTF Challenges**: Get Socratic hints on live challenges without spoiling the final flag.\n\n"
            "What cybersecurity area would you like to explore right now? (Web Security, Linux, Network Defense, or Cert Prep?)"
        )
    # 2. Same-Origin Policy / SOP
    elif "same-origin" in query or "sop" in query:
        return (
            f"Hello {user_name}!{prompt_tag}\n\n"
            "The Same-Origin Policy (SOP) is a foundational web browser security model. "
            "It restricts how scripts running on one origin (e.g. https://attacker.com) can access cookies, localStorage, "
            "or DOM content on a different origin (e.g. https://yourbank.com).\n\n"
            "An origin is strictly defined by three components:\n"
            "1. **Scheme** (e.g. `http`, `https`)\n"
            "2. **Host Domain** (e.g. `app.cyberlearn.io`)\n"
            "3. **Port** (e.g. `80`, `443`)\n\n"
            "If any of these three differ, browsers enforce isolation to protect user privacy!"
        )
    # 3. Cross-Site Scripting / XSS
    elif "xss" in query or "cross-site" in query:
        return (
            f"Great question on XSS, {user_name}!{prompt_tag}\n\n"
            "Cross-Site Scripting (XSS) occurs when untrusted user input is rendered in the DOM without proper sanitization.\n\n"
            "### Key Variations:\n"
            "• **Reflected XSS**: Payload is reflected immediately from HTTP request parameters (e.g. `?search=<script>...`).\n"
            "• **Stored XSS**: Payload is stored in a database (e.g. user comments) and executed whenever others view the page.\n"
            "• **DOM-based XSS**: Client-side JavaScript writes unvalidated input directly to dangerous sinks (`innerHTML`, `document.write`).\n\n"
            "### Defense:\n"
            "Always context-encode outputs (HTML entities) and enforce a strict **Content Security Policy (CSP)**!"
        )
    # 4. SQL Injection
    elif "sql" in query or "sqli" in query:
        return (
            f"SQL Injection (SQLi) is a critical database flaw, {user_name}!{prompt_tag}\n\n"
            "When input fields concatenate user strings directly into SQL queries, "
            "attackers can break out of string context using single quotes (`'`) and inject boolean conditions like `OR '1'='1` or `UNION SELECT` statements.\n\n"
            "### Defense:\n"
            "Always use **Prepared Statements** and Parameterized Queries (ORMs like SQLAlchemy or PDO). Never concatenate raw input into SQL strings!"
        )
    # 5. Linux Privilege Escalation
    elif any(k in query for k in ["privilege", "privesc", "sudo", "suid", "cron"]):
        return (
            f"Privilege Escalation in Linux involves elevating low-privilege shell access into root access, {user_name}.\n\n"
            "### Common Inspection Vectors:\n"
            "1. **SUID Executables**: `find / -perm -4000 -type f 2>/dev/null`\n"
            "2. **Sudo Privileges**: `sudo -l` to check binaries runnable without passwords.\n"
            "3. **Vulnerable Cron Jobs**: Inspect `/etc/crontab` and writeable script permissions.\n"
            "4. **Capabilities**: `getcap -r / 2>/dev/null`"
        )
    # 6. Network Recon / Nmap
    elif any(k in query for k in ["nmap", "scan", "recon", "port", "wireshark"]):
        return (
            f"Reconnaissance is step #1 in penetration testing, {user_name}!\n\n"
            "### Essential Nmap Cheat Sheet:\n"
            "• `nmap -sV -sC <IP>`: Detect service versions and run default NSE scripts.\n"
            "• `nmap -p- <IP>`: Scan all 65,535 TCP ports.\n"
            "• `nmap -O <IP>`: Perform OS fingerprinting.\n"
            "• `nmap -sU <IP>`: Scan common UDP ports."
        )
    # 7. Default Contextual Fallback
    else:
        return (
            f"Hello {user_name}! I am Coach Jarvis, your AI Security Mentor.{prompt_tag}\n\n"
            f"Regarding your query on **\"{query[:60]}\"**:\n\n"
            "In practical cybersecurity defense and offensive operations, we analyze this by:\n"
            "1. **Threat Modeling**: Identifying assets, threat actors, and potential attack vectors.\n"
            "2. **Hands-On Verification**: Testing behaviors inside our interactive practice labs.\n"
            "3. **Hardening**: Implementing least privilege, defense-in-depth, and automated monitoring.\n\n"
            "Feel free to ask me for a code example, lab walkthrough, or conceptual breakdown!"
        )


from datetime import datetime, timezone
from ..database import get_db
from ..auth.dependencies import get_current_user, get_optional_user
from ..config import settings
from .. import models, schemas

logger = logging.getLogger("cyberlearn.ai")

# Legacy Chat Route (Backward compatibility)
@router.post("/chat")
async def chat_with_coach(
    request: ChatRequest,
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    user_name = current_user.full_name.split()[0] if (current_user and current_user.full_name and current_user.full_name.strip()) else "Learner"
    query = request.message.lower()
    
    history_dicts = [{"role": ("user" if m.sender == "user" else "model"), "content": m.text} for m in request.history]
    llm_reply = await _query_external_llm(request.message, user_name, None, history_dicts)
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
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    if not current_user:
        # Return default guest starter session for unauthenticated visitors
        return [schemas.AiSessionResponse(
            id="guest-session",
            user_id="guest",
            title="General Cybersecurity Tutoring",
            system_prompt="You are Coach Jarvis, an expert and patient cybersecurity mentor specializing in practical hands-on labs and exam preparation.",
            model_type="gemini-3.5-flash-lite",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            message_count=0
        )]

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

    # Batch count messages across all sessions in a single SQL query (eliminates N+1)
    session_ids = [s.id for s in sessions]
    msg_counts = dict(
        db.query(
            models.AiChatMessage.session_id,
            func.count(models.AiChatMessage.id)
        ).filter(
            models.AiChatMessage.session_id.in_(session_ids)
        ).group_by(models.AiChatMessage.session_id).all()
    )

    result = []
    for s in sessions:
        msg_count = msg_counts.get(s.id, 0)
        result.append(schemas.AiSessionResponse(
            id=s.id,
            user_id=s.user_id,
            title=s.title,
            system_prompt=s.system_prompt,
            model_type=s.model_type or "gemini-3.5-flash-lite",
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=msg_count
        ))
    return result

@router.post("/sessions", response_model=schemas.AiSessionResponse, status_code=status.HTTP_201_CREATED)
def create_ai_session(
    session_in: schemas.AiSessionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    if not current_user:
        return schemas.AiSessionResponse(
            id="guest-session",
            user_id="guest",
            title=session_in.title or "General Cybersecurity Tutoring",
            system_prompt=session_in.system_prompt,
            model_type=session_in.model_type or "gemini-3.5-flash-lite",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            message_count=0
        )

    new_session = models.AiSession(
        user_id=current_user.id,
        title=session_in.title or "New AI Security Session",
        system_prompt=session_in.system_prompt,
        model_type=session_in.model_type or "gemini-3.5-flash-lite"
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
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    if not current_user or session_id == "guest-session":
        return {
            "session": schemas.AiSessionResponse(
                id="guest-session",
                user_id="guest",
                title="General Cybersecurity Tutoring",
                system_prompt="You are Coach Jarvis, an expert and patient cybersecurity mentor specializing in practical hands-on labs and exam preparation.",
                model_type="gemini-3.5-flash-lite",
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                message_count=0
            ),
            "messages": []
        }

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
async def chat_in_session(
    session_id: str,
    req: schemas.AiSessionChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user)
):
    if not current_user or session_id == "guest-session":
        # Instant Guest Mode without database dependencies
        user_name = current_user.full_name.split()[0] if (current_user and current_user.full_name and current_user.full_name.strip()) else "Learner"
        effective_prompt = req.override_system_prompt or "You are Coach Jarvis, an expert and patient cybersecurity mentor specializing in practical hands-on labs and exam preparation."
        llm_reply = await _query_external_llm(req.message, user_name, effective_prompt, [])
        if not llm_reply:
            llm_reply = _generate_fallback_response(req.message.lower(), user_name, effective_prompt)
        return {
            "reply": llm_reply,
            "coach_name": "Jarvis",
            "session_id": "guest-session",
            "system_prompt": effective_prompt
        }

    session = db.query(models.AiSession).filter(
        models.AiSession.id == session_id,
        models.AiSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Session not found."
        )

    # 1. Fetch prior conversation history BEFORE appending current message
    past_messages = db.query(models.AiChatMessage).filter(
        models.AiChatMessage.session_id == session.id
    ).order_by(models.AiChatMessage.created_at.asc()).all()

    history_dicts = [{"role": m.role, "content": m.content} for m in past_messages]

    # 2. Record Current User Message
    user_msg = models.AiChatMessage(
        session_id=session.id,
        role="user",
        content=req.message
    )
    db.add(user_msg)
    db.commit()

    user_name = current_user.full_name.split()[0] if (current_user.full_name and current_user.full_name.strip()) else "Agent"
    effective_prompt = req.override_system_prompt or session.system_prompt

    # 3. Query LLM asynchronously with clean history or fallback
    llm_reply = await _query_external_llm(req.message, user_name, effective_prompt, history_dicts)
    if not llm_reply:
        llm_reply = _generate_fallback_response(req.message.lower(), user_name, effective_prompt)

    # 4. Record Assistant Message
    assistant_msg = models.AiChatMessage(
        session_id=session.id,
        role="assistant",
        content=llm_reply
    )
    db.add(assistant_msg)
    
    # Touch session updated_at
    session.updated_at = func.now()
    db.commit()

    return {
        "reply": llm_reply,
        "coach_name": "Jarvis",
        "session_id": session.id,
        "system_prompt": effective_prompt
    }



