import os
import sys
import json
import signal
import asyncio
import tempfile
import logging
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from .router import generate_lab_flag

logger = logging.getLogger("cyberlearn.terminal")

router = APIRouter(
    prefix="/labs",
    tags=["Lab Terminal"]
)

# Base root for sandboxed workspaces
WORKSPACE_BASE = Path(tempfile.gettempdir()) / "cyberlearn_labs"

# Lab-specific initial file templates for interactive training
LAB_TEMPLATES = {
    "linux-navigation": {
        "notes.txt": "Target: Locate the secret flag in this directory tree.\nTip: Use 'ls -la', 'cat flag.txt', and 'find . -name \"*.txt\"'",
        "logs/access.log": "192.168.1.10 - - [01/Jan/2026:10:00:00] GET /index.html 200\n192.168.1.45 - - [01/Jan/2026:10:05:00] GET /admin 403\n",
    },
    "sql-injection-bypass": {
        "query_tester.py": "# Basic Python helper to test payload formatting\nimport sys\nprint('Testing SQL injection parser... READY')\n",
        "instructions.txt": "Exploit SQL query bypass techniques or inspect database tables to recover the secret admin hash.",
    },
    "packet-sniffer-recon": {
        "capture.txt": "PACKET #1: SRC 10.0.0.5 -> DST 10.0.0.1 PROTO=TCP DPT=80 [SYN]\nPACKET #2: SRC 10.0.0.5 -> DST 10.0.0.1 USER=admin PASS=FLAG_SNIFFED_DEMO\n",
    }
}


def setup_workspace(session_id: str, lab_id: str) -> Path:
    """
    Initializes a sandboxed file workspace on the local filesystem
    containing the lab README, generated flag, and sample files.
    """
    session_dir = WORKSPACE_BASE / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    # 1. Flag file
    flag_path = session_dir / "flag.txt"
    if not flag_path.exists():
        flag = generate_lab_flag(lab_id)
        flag_path.write_text(f"{flag}\n", encoding="utf-8")

    # 2. README file
    readme_path = session_dir / "README.txt"
    if not readme_path.exists():
        readme_content = (
            "=====================================================\n"
            f"  CYBERLEARN INTERACTIVE LAB: {lab_id.upper()}\n"
            "=====================================================\n"
            "Welcome to the cloud practice sandbox.\n\n"
            "Commands to try:\n"
            "  ls -la          - List all files including hidden ones\n"
            "  cat README.txt  - View these instructions\n"
            "  cat flag.txt    - Inspect the lab flag file\n"
            "  pwd             - Display current working directory\n"
            "  whoami          - Check active user identity\n"
            "  curl / ping     - Network inspection utilities\n\n"
            "Submit the recovered flag in the verification bar to claim XP!\n"
            "=====================================================\n"
        )
        readme_path.write_text(readme_content, encoding="utf-8")

    # 3. Add lab-specific starter files
    templates = LAB_TEMPLATES.get(lab_id, {})
    for rel_path, content in templates.items():
        target_path = session_dir / rel_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        if not target_path.exists():
            target_path.write_text(content, encoding="utf-8")

    return session_dir


def get_sanitized_environment(session_dir: Path) -> Dict[str, str]:
    """
    Returns a stripped-down environment dictionary with ZERO backend secrets
    (DATABASE_URL, SECRET_KEY, FLAG_SECRET are NOT passed).
    """
    return {
        "TERM": "xterm-256color",
        "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "HOME": str(session_dir),
        "USER": "student",
        "LOGNAME": "student",
        "SHELL": "/bin/bash",
        "PWD": str(session_dir),
        "LANG": "C.UTF-8",
        "LC_ALL": "C.UTF-8",
        "PS1": r"\[\033[01;32m\]student@cyberlearn\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ ",
    }


# Detect platform support for PTY
IS_UNIX = sys.platform != "win32"

if IS_UNIX:
    import pty
    import select
    import termios
    import struct
    import fcntl


async def run_unix_pty_session(websocket: WebSocket, session_dir: Path):
    """
    Spawns an authentic Linux PTY process with bash and bridges it with WebSocket.
    Runs on Render Free Tier Linux containers.
    """
    clean_env = get_sanitized_environment(session_dir)
    master_fd, slave_fd = pty.openpty()

    # Set default window size (80 columns, 24 rows)
    try:
        winsize = struct.pack("HHHH", 24, 80, 0, 0)
        fcntl.ioctl(slave_fd, termios.TIOCSWINSZ, winsize)
    except Exception:
        pass

    pid = os.fork()

    if pid == 0:
        # Child process
        os.close(master_fd)
        os.setsid()
        os.dup2(slave_fd, 0)
        os.dup2(slave_fd, 1)
        os.dup2(slave_fd, 2)
        if slave_fd > 2:
            os.close(slave_fd)

        os.chdir(str(session_dir))
        
        # Check if bash exists, fallback to sh
        shell_path = "/bin/bash" if os.path.exists("/bin/bash") else "/bin/sh"
        os.execvpe(shell_path, [shell_path, "--norc"], clean_env)
    else:
        # Parent process (FastAPI async server)
        os.close(slave_fd)

        async def read_pty():
            try:
                while True:
                    await asyncio.sleep(0.01)
                    r, _, _ = select.select([master_fd], [], [], 0)
                    if master_fd in r:
                        data = os.read(master_fd, 2048)
                        if not data:
                            break
                        await websocket.send_bytes(data)
            except (asyncio.CancelledError, WebSocketDisconnect):
                pass
            except Exception as e:
                logger.debug(f"PTY read loop ended: {e}")

        async def write_pty():
            try:
                while True:
                    msg = await websocket.receive()
                    if "bytes" in msg and msg["bytes"]:
                        os.write(master_fd, msg["bytes"])
                    elif "text" in msg and msg["text"]:
                        payload = msg["text"]
                        # Handle JSON control frames (e.g. terminal resize)
                        if payload.startswith("{") and "cols" in payload and "rows" in payload:
                            try:
                                resize_data = json.loads(payload)
                                cols = int(resize_data.get("cols", 80))
                                rows = int(resize_data.get("rows", 24))
                                winsize = struct.pack("HHHH", rows, cols, 0, 0)
                                fcntl.ioctl(master_fd, termios.TIOCSWINSZ, winsize)
                                continue
                            except Exception:
                                pass
                        os.write(master_fd, payload.encode("utf-8"))
            except (asyncio.CancelledError, WebSocketDisconnect):
                pass
            except Exception as e:
                logger.debug(f"PTY write loop ended: {e}")

        reader_task = asyncio.create_task(read_pty())
        writer_task = asyncio.create_task(write_pty())

        done, pending = await asyncio.wait(
            [reader_task, writer_task],
            return_when=asyncio.FIRST_COMPLETED
        )

        for task in pending:
            task.cancel()

        # Clean up PTY process
        try:
            os.close(master_fd)
        except Exception:
            pass

        try:
            os.kill(pid, signal.SIGTERM)
            await asyncio.sleep(0.05)
            os.kill(pid, signal.SIGKILL)
            os.waitpid(pid, os.WNOHANG)
        except Exception:
            pass


async def run_windows_fallback_session(websocket: WebSocket, session_dir: Path):
    """
    Subprocess fallback for local Windows development environments.
    Spawns cmd.exe or powershell.exe with non-blocking stream pipes.
    """
    clean_env = {
        "SYSTEMROOT": os.environ.get("SYSTEMROOT", r"C:\Windows"),
        "PATH": os.environ.get("PATH", ""),
        "PROMPT": "student@cyberlearn:$P$G ",
        "COMSPEC": os.environ.get("COMSPEC", "cmd.exe"),
    }

    # Initial banner
    welcome = (
        "\r\n\x1b[32m[+] CyberLearn Interactive Terminal (Windows Local Sandbox)\x1b[0m\r\n"
        f"\x1b[36m[*] Workspace Root: {session_dir}\x1b[0m\r\n\r\n"
    )
    await websocket.send_text(welcome)

    proc = await asyncio.create_subprocess_exec(
        "cmd.exe",
        "/q",
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=str(session_dir),
        env=clean_env
    )

    async def read_stdout():
        try:
            while True:
                line = await proc.stdout.read(1024)
                if not line:
                    break
                await websocket.send_bytes(line)
        except Exception:
            pass

    async def read_stderr():
        try:
            while True:
                line = await proc.stderr.read(1024)
                if not line:
                    break
                await websocket.send_bytes(line)
        except Exception:
            pass

    async def write_stdin():
        try:
            while True:
                msg = await websocket.receive()
                if "bytes" in msg and msg["bytes"]:
                    proc.stdin.write(msg["bytes"])
                    await proc.stdin.drain()
                elif "text" in msg and msg["text"]:
                    proc.stdin.write(msg["text"].encode("utf-8"))
                    await proc.stdin.drain()
        except Exception:
            pass

    t1 = asyncio.create_task(read_stdout())
    t2 = asyncio.create_task(read_stderr())
    t3 = asyncio.create_task(write_stdin())

    done, pending = await asyncio.wait([t1, t2, t3], return_when=asyncio.FIRST_COMPLETED)
    for task in pending:
        task.cancel()

    try:
        proc.terminate()
    except Exception:
        pass


@router.websocket("/{session_id}/terminal/ws")
async def lab_terminal_websocket(
    websocket: WebSocket,
    session_id: str,
    lab_id: Optional[str] = Query(None)
):
    """
    WebSocket endpoint providing real bidirectional terminal I/O.
    Clients connect via ws:// or wss:// /labs/{session_id}/terminal/ws?lab_id=...
    """
    await websocket.accept()

    # Determine lab identifier
    effective_lab_id = lab_id or "linux-navigation"
    if "-" in session_id and not lab_id:
        # Fallback heuristic if session_id contains lab prefix
        parts = session_id.split("-")
        if len(parts) >= 2:
            candidate = f"{parts[0]}-{parts[1]}"
            if candidate in LAB_TEMPLATES:
                effective_lab_id = candidate

    session_dir = setup_workspace(session_id, effective_lab_id)

    try:
        if IS_UNIX:
            await run_unix_pty_session(websocket, session_dir)
        else:
            await run_windows_fallback_session(websocket, session_dir)
    except WebSocketDisconnect:
        logger.info(f"Terminal WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"Error in terminal WebSocket session {session_id}: {e}")
        try:
            await websocket.close()
        except Exception:
            pass
