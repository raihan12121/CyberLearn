import os
import json
import urllib.request
import urllib.error
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional
from ..auth.dependencies import get_current_user
from .. import models

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

def _query_external_llm(user_message: str, user_name: str) -> Optional[str]:
    """
    Attempt to query Gemini API or OpenAI API if keys are set in environment.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            prompt = (
                f"You are Coach Jarvis, an expert, encouraging ethical cybersecurity tutor at CyberLearn Academy. "
                f"Answer the student's question clearly, concisely, and accurately. Student Name: {user_name}.\n"
                f"Student Question: {user_message}"
            )
            payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode("utf-8")
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
            payload = json.dumps({
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": f"You are Coach Jarvis, an expert ethical cybersecurity tutor for student {user_name} at CyberLearn."},
                    {"role": "user", "content": user_message}
                ]
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

@router.post("/chat")
def chat_with_coach(request: ChatRequest, current_user: models.User = Depends(get_current_user)):
    user_name = current_user.full_name.split()[0] if (current_user.full_name and current_user.full_name.strip()) else "Agent"
    query = request.message.lower()
    
    # 1. Check for live LLM response
    llm_reply = _query_external_llm(request.message, user_name)
    if llm_reply:
        return {"reply": llm_reply, "coach_name": "Jarvis (AI LLM Active)"}

    # 2. Contextual Security Engine fallback
    reply = ""
    if "same-origin" in query or "sop" in query:
        reply = (
            f"Hello {user_name}! The Same-Origin Policy (SOP) is a foundational web browser security model. "
            "It restricts how scripts running on one origin (e.g. https://attacker.com) can access cookies, localStorage, "
            "or DOM content on a different origin (e.g. https://yourbank.com).\n\n"
            "An origin is strictly defined by three components:\n"
            "1. Scheme (e.g. http, https)\n"
            "2. Host Domain (e.g. app.cyberlearn.io)\n"
            "3. Port (e.g. 80, 443)\n\n"
            "If any of these three differ, browsers enforce isolation to protect user privacy!"
        )
    elif "xss" in query or "cross-site" in query:
        reply = (
            f"Great question on XSS, {user_name}! Cross-Site Scripting occurs when untrusted user input is rendered in the DOM without sanitization.\n\n"
            "Key XSS Variations:\n"
            "• Reflected XSS: Payload comes from the immediate HTTP request (e.g. search query URL).\n"
            "• Stored XSS: Payload is saved in a database (e.g. user profile, forum comment) and served to subsequent visitors.\n"
            "• DOM XSS: Client-side JavaScript reads input (e.g. location.hash) and writes it directly to innerHTML.\n\n"
            "Mitigation: Always use context-aware HTML entity encoding and strict Content Security Policies (CSP)!"
        )
    elif "sql" in query or "sqli" in query:
        reply = (
            f"SQL Injection (SQLi) is a critical database flaw, {user_name}! When input fields concatenate user strings directly into SQL queries, "
            "attackers can break out of string context using single quotes (') and inject boolean conditions like `OR '1'='1` or UNION SELECT statements.\n\n"
            "Defense: Use Prepared Statements and Parameterized Queries (ORMs like SQLAlchemy or PDO)!"
        )
    elif "privilege" in query or "privesc" in query or "sudo" in query:
        reply = (
            f"Privilege Escalation in Linux involves turning lower-level shell access into root access.\n\n"
            "Common Vectors to inspect:\n"
            "1. SUID Executables: `find / -perm -4000 -type f 2>/dev/null`\n"
            "2. Sudo Privileges: `sudo -l` to see binaries runnable without a password.\n"
            "3. Vulnerable Cron Jobs: Inspect `/etc/crontab` and writeable cron script permissions."
        )
    elif "nmap" in query or "scan" in query or "recon" in query:
        reply = (
            f"Reconnaissance is step #1 in ethical penetration testing, {user_name}!\n\n"
            "Essential Nmap Cheat Sheet:\n"
            "• `nmap -sV -sC <IP>`: Detect service versions and run default NSE scripts.\n"
            "• `nmap -p- <IP>`: Scan all 65,535 TCP ports.\n"
            "• `nmap -O <IP>`: Perform OS fingerprinting."
        )
    else:
        reply = (
            f"Hello {user_name}! I am Coach Jarvis, your 24/7 AI Security Mentor.\n\n"
            f"Regarding '{request.message}': In penetration testing and SOC defense, we systematically trace input vectors, inspect HTTP headers, "
            "audit network logs, and verify least-privilege configurations. Ask me about SQLi, XSS, Nmap, SOP, or Linux PrivEsc for a deep dive!"
        )

    return {
        "reply": reply,
        "coach_name": "Jarvis"
    }
