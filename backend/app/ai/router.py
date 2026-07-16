from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
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

@router.post("/chat")
def chat_with_coach(request: ChatRequest, current_user: models.User = Depends(get_current_user)):
    query = request.message.lower()
    reply = ""
    
    if "same-origin" in query or "sop" in query:
        reply = "The Same-Origin Policy (SOP) is a browser security mechanism. It prevents scripts on one site from accessing sensitive data on another site unless protocol, host, and port match exactly."
    elif "xss" in query or "cross-site" in query:
        reply = "Cross-Site Scripting (XSS) permits executing custom JavaScript code in the visitor's browser. Try tags like <img src=x onerror=alert(1)> if standard script tags are filtered!"
    elif "injection" in query and "prompt" in query:
        reply = "Prompt Injection overrides LLM system instructions. Secure it by isolating user prompts from system directives, sanitizing queries, and validating responses."
    else:
        reply = f"Hello {current_user.full_name or 'Learner'}! That is an interesting security topic. I suggest tracing the network flow or inspecting target source files to see how inputs are validated. Let me know if you need hints!"

    return {
        "reply": reply,
        "coach_name": "Jarvis"
    }
