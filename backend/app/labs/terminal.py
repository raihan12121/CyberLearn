import asyncio
import json
import logging
from typing import Optional
from fastapi import WebSocket, WebSocketDisconnect
from jose import jwt, JWTError
from sqlalchemy.orm import Session as DBSession

logger = logging.getLogger("cyberlearn.terminal")


def _authenticate_ws_token(token: str):
    """
    Validate a JWT token from a WebSocket query param and return the
    user email, or None if invalid.
    """
    # Import here to avoid circular imports at module load time
    from ..config import settings
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        return email
    except JWTError:
        return None


def _validate_session_ownership(session_id: str, user_email: str) -> bool:
    """
    Check that `session_id` is a running lab session owned by the user
    identified by `user_email`.
    """
    from ..database import SessionLocal
    from .. import models

    db: DBSession = SessionLocal()
    try:
        session = db.query(models.LabSession).filter(
            models.LabSession.id == session_id,
            models.LabSession.status == "running",
        ).first()
        if not session:
            return False
        user = db.query(models.User).filter(
            models.User.id == session.user_id,
            models.User.email == user_email,
        ).first()
        return user is not None
    finally:
        db.close()


class TerminalSession:
    """
    Manages an interactive terminal session.

    IMPORTANT — Security architecture:
    In production, this MUST attach to an isolated Docker container
    (e.g. via `docker exec -it <container_id> /bin/bash`).  It must
    NEVER spawn a process directly on the host.

    The current implementation operates in *simulation mode*: it does not
    spawn any OS process and instead sends a notice to the client
    explaining that the sandbox backend is not connected.  The frontend
    already has a rich fallback shell that handles this gracefully.
    """

    def __init__(self, session_id: str, container_id: Optional[str] = None):
        self.session_id = session_id
        self.container_id = container_id
        self.process: Optional[asyncio.subprocess.Process] = None
        self._read_task: Optional[asyncio.Task] = None

    async def start(self):
        """
        In a production deployment this method would attach to the
        Docker container identified by `self.container_id`.

        For now it intentionally does NOT start any process, avoiding
        the critical RCE risk of spawning an unconfined host shell.
        """
        logger.warning(
            "Terminal session %s: No Docker container backend configured. "
            "Operating in simulation mode (no host shell spawned).",
            self.session_id,
        )
        # self.process remains None — the frontend will fall back to its
        # interactive client-side sandbox shell.

    async def write_input(self, data: str):
        if self.process and self.process.stdin:
            try:
                self.process.stdin.write(data.encode("utf-8"))
                await self.process.stdin.drain()
            except Exception as e:
                logger.error(f"Error writing to terminal stdin: {e}")

    async def read_output_loop(self, websocket: WebSocket):
        if not self.process or not self.process.stdout:
            return

        while True:
            try:
                chunk = await self.process.stdout.read(1024)
                if not chunk:
                    break
                text = chunk.decode("utf-8", errors="replace")
                await websocket.send_json({"type": "output", "data": text})
            except Exception as e:
                logger.debug(f"Terminal process stdout stream ended for session {self.session_id}: {e}")
                break

    def stop(self):
        if self.process:
            try:
                self.process.terminate()
            except Exception:
                pass
            self.process = None


class TerminalManager:
    def __init__(self):
        self.active_sessions: dict[str, TerminalSession] = {}

    async def handle_websocket(self, websocket: WebSocket, session_id: str):
        # --- Authentication: extract JWT from query param ---
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=4001, reason="Missing authentication token")
            return

        user_email = _authenticate_ws_token(token)
        if not user_email:
            await websocket.close(code=4001, reason="Invalid authentication token")
            return

        # --- Authorization: verify session belongs to this user ---
        if not _validate_session_ownership(session_id, user_email):
            await websocket.close(code=4003, reason="Session not found or access denied")
            return

        await websocket.accept()

        session = TerminalSession(session_id=session_id)
        read_task: Optional[asyncio.Task] = None
        try:
            await session.start()
            self.active_sessions[session_id] = session

            # Send welcome connection banner
            await websocket.send_json({
                "type": "sys",
                "data": f"\r\n\x1b[1;32m[CyberLearn Live Sandbox Connected]\x1b[0m Session ID: {session_id}\r\nType 'help' or execute bash commands directly.\r\n\r\n"
            })

            # Start background task reading stdout from process to websocket
            read_task = asyncio.create_task(session.read_output_loop(websocket))

            while True:
                raw_msg = await websocket.receive_text()
                try:
                    msg = json.loads(raw_msg)
                    msg_type = msg.get("type")

                    if msg_type == "input":
                        input_data = msg.get("data", "")
                        await session.write_input(input_data)
                    elif msg_type == "resize":
                        # Reserved for PTY window size adjustment
                        pass
                except json.JSONDecodeError:
                    # Direct raw string payload
                    await session.write_input(raw_msg)

        except WebSocketDisconnect:
            logger.info(f"WebSocket client disconnected for session {session_id}")
        except Exception as e:
            logger.error(f"WebSocket terminal error for session {session_id}: {e}")
        finally:
            # Cancel the read task to prevent writes to a closed socket
            if read_task is not None:
                read_task.cancel()
                try:
                    await read_task
                except (asyncio.CancelledError, Exception):
                    pass
            if session_id in self.active_sessions:
                self.active_sessions[session_id].stop()
                del self.active_sessions[session_id]

terminal_manager = TerminalManager()
