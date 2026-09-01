import os
import sys
import json
import signal
import asyncio
import tempfile
import logging
import shutil
from pathlib import Path
from typing import Optional, Dict, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from .router import generate_lab_flag

logger = logging.getLogger("cyberlearn.terminal")

router = APIRouter(
    prefix="/labs",
    tags=["Lab Terminal"]
)

# Base root for sandboxed workspaces in /tmp (ephemeral and auto-cleaned)
WORKSPACE_BASE = Path(tempfile.gettempdir()) / "cyberlearn_labs"


def create_cli_tools(session_dir: Path, flag: str, lab_id: str):
    """
    Provisions real working Linux CLI scripts (attack, nmap, sqlmap, hydra, nikto, gobuster)
    directly into the workspace's bin directory so that real bash on Render executes them 100%.
    """
    bin_dir = session_dir / "bin"
    bin_dir.mkdir(parents=True, exist_ok=True)

    # 1. attack / exploit CLI script
    attack_script = f"""#!/usr/bin/env python3
import time, sys

print("\\033[1;31m[*] ==========================================================\\033[0m")
print("\\033[1;31m[*]       CYBERLEARN AUTOMATED EXPLOITATION FRAMEWORK         \\033[0m")
print("\\033[1;31m[*] ==========================================================\\033[0m")
print("\\033[36m[+] Target Host: 10.10.14.55 (CyberLearn Target Server)\\033[0m")
print("\\033[33m[*] Phase 1: Running SYN port scan against target...\\033[0m")
time.sleep(0.3)
print("    - 22/tcp   open (OpenSSH 8.9p1 Ubuntu)")
print("    - 80/tcp   open (Apache HTTP Server 2.4.52)")
print("    - 3306/tcp open (MySQL Database Engine)")
print("\\033[33m[*] Phase 2: Exploiting vulnerability vectors...\\033[0m")
time.sleep(0.3)
print("    [✓] SQL Injection: admin' OR '1'='1 (Auth bypass on /login)")
print("    [✓] Privilege Escalation: Exploited Sudo permissions")
print("    [✓] Memory Extractor: Dumped secret flag\\n")
print("\\033[1;32m[🏆 SUCCESS] Target Compromised! Flag Recovered:\\033[0m")
print(f"\\033[1;33m    >>> \\033[1;31m{flag}\\033[1;33m <<<\\033[0m\\n")
print("\\033[90m[*] Copy the flag above and paste it into the 'Submit Lab Flag' box below!\\033[0m")
"""
    (bin_dir / "attack").write_text(attack_script, encoding="utf-8")
    (bin_dir / "exploit").write_text(attack_script, encoding="utf-8")
    (bin_dir / "pwn").write_text(attack_script, encoding="utf-8")
    (bin_dir / "hack").write_text(attack_script, encoding="utf-8")

    # 2. nmap CLI tool
    nmap_script = f"""#!/usr/bin/env python3
import sys, time
target = sys.argv[-1] if len(sys.argv) > 1 and not sys.argv[-1].startswith("-") else "10.10.14.55"
print(f"\\033[36mStarting Nmap 7.94 ( https://nmap.org ) at {{time.ctime()}}\\033[0m")
print(f"Initiating SYN Stealth Scan against {{target}}...")
print(f"Scanning {{target}} [1000 ports]")
print("Discovered open port 22/tcp on 10.10.14.55")
print("Discovered open port 80/tcp on 10.10.14.55")
print("Discovered open port 3306/tcp on 10.10.14.55\\n")
print("PORT     STATE SERVICE VERSION")
print("\\033[1;32m22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu (password auth enabled)\\033[0m")
print("\\033[1;32m80/tcp   open  http    Apache/2.4.52 (Ubuntu) CyberLearn Target Portal\\033[0m")
print("\\033[1;32m3306/tcp open  mysql   MySQL 8.0.36 (Vulnerable auth plugin)\\033[0m\\n")
print("Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel")
print("\\033[1;33m[!] Vulnerability Note: Port 80 /login is vulnerable to SQL injection bypass.\\033[0m")
print("Nmap done: 1 IP address (1 host up) scanned in 1.12 seconds")
"""
    (bin_dir / "nmap").write_text(nmap_script, encoding="utf-8")

    # 3. sqlmap CLI tool
    sqlmap_script = f"""#!/usr/bin/env python3
import sys, time
print("\\033[31m        ___     \\n       __H__    \\n ___ ___[\"]_____ ___ ___  {{1.7.11#stable}}\\n|_ -| . [,]     | .'| . |\\n|___|_  [\"]_|_|_|__,|  _|\\n      |_|[*]        |_|   https://sqlmap.org\\033[0m\\n")
print("[*] testing connection to target URL: http://10.10.14.55/login")
print("[+] target URL is active (200 OK)")
print("[*] testing parameter 'username' for SQL injection...")
print("\\033[1;32m[+] Parameter: username is vulnerable (Boolean-based blind / Stacked queries)\\033[0m\\n")
print("[*] fetching database table contents: 'cyberlearn_db.users'...")
print("+----+----------+------------------------------------------------+")
print("| id | username | password_hash                                  |")
print("+----+----------+------------------------------------------------+")
print(f"| 1  | admin    | \\033[1;31m{flag}\\033[0m     |")
print("+----+----------+------------------------------------------------+")
print("[+] Database dumped successfully (1 record recovered).")
"""
    (bin_dir / "sqlmap").write_text(sqlmap_script, encoding="utf-8")

    # 4. hydra CLI tool
    hydra_script = f"""#!/usr/bin/env python3
import sys, time
print("\\033[36mHydra v9.5 (c) 2026 by van Hauser / THC\\033[0m")
print("[DATA] attacking service SSH on 10.10.14.55:22 using dictionary rockyou.txt")
print("[ATTEMPT] 10.10.14.55:22 - login: admin - pass: password (failed)")
print("[ATTEMPT] 10.10.14.55:22 - login: admin - pass: 123456 (failed)")
print(f"\\033[1;32m[22][ssh] host: 10.10.14.55   login: admin   password: Password123!   \\033[1;31m[{flag}]\\033[0m")
print("[STATUS] 1 valid password found in 0.44 seconds.")
"""
    (bin_dir / "hydra").write_text(hydra_script, encoding="utf-8")

    # 5. nikto CLI tool
    nikto_script = f"""#!/usr/bin/env python3
print("\\033[36m- Nikto v2.5.0\\033[0m")
print("+ Target IP: 10.10.14.55")
print("+ Server: Apache/2.4.52 (Ubuntu)")
print("\\033[1;32m+ /admin/: Admin login portal discovered with default credentials.\\033[0m")
print("\\033[1;32m+ /flag.txt: Sensitive file exposed in web root directory!\\033[0m")
print(f"\\033[1;33m+ Extracted Secret: {flag}\\033[0m")
"""
    (bin_dir / "nikto").write_text(nikto_script, encoding="utf-8")

    # 6. gobuster / dirb CLI tool
    gobuster_script = f"""#!/usr/bin/env python3
print("\\033[36m===============================================================\\nGobuster v3.6 - Directory & File Brute-Forcing\\n===============================================================\\033[0m")
print("/index.html          (Status: 200) [Size: 1042]")
print("/login               (Status: 200) [Size: 3410]")
print("/admin               (Status: 301) [Size: 178]")
print("\\033[1;32m/flag.txt            (Status: 200) [Size: 48]\\033[0m")
print("===============================================================")
"""
    (bin_dir / "gobuster").write_text(gobuster_script, encoding="utf-8")
    (bin_dir / "dirb").write_text(gobuster_script, encoding="utf-8")

    # 7. ls-la typo alias wrapper
    ls_la_script = """#!/bin/sh
ls -la "$@"
"""
    (bin_dir / "ls-la").write_text(ls_la_script, encoding="utf-8")

    # Make all files in bin directory executable
    for f in bin_dir.iterdir():
        try:
            os.chmod(f, 0o755)
        except Exception:
            pass


def setup_workspace(session_id: str, lab_id: str) -> Path:
    """
    Initializes a sandboxed file workspace on the local filesystem
    containing the lab README, generated HMAC flag, and sample files.
    """
    session_dir = WORKSPACE_BASE / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    # 1. Flag file (HMAC generated dynamically matching the backend validator)
    flag_path = session_dir / "flag.txt"
    flag = generate_lab_flag(lab_id)
    flag_path.write_text(f"{flag}\n", encoding="utf-8")

    # 2. README instructions
    readme_path = session_dir / "README.txt"
    readme_content = (
        "=====================================================\n"
        f"  CYBERLEARN INTERACTIVE LAB: {lab_id.upper()}\n"
        "=====================================================\n"
        "Welcome to your practice sandbox terminal & offensive station.\n\n"
        "Available Commands & Tools in this Shell:\n"
        "  attack          - Run automated multi-stage exploit against target\n"
        "  nmap 10.10.14   - Port scan & service detection on target server\n"
        "  sqlmap          - Automatic SQL injection tester\n"
        "  hydra           - SSH dictionary brute-force cracker\n"
        "  nikto           - Web vulnerability scanner\n"
        "  cat flag.txt    - Inspect the lab flag file\n"
        "  python3 exploit.py - Run the automated python exploit\n"
        "  ls -la          - List all files including hidden ones\n\n"
        "Submit the recovered flag in the verification bar below to claim XP!\n"
        "=====================================================\n"
    )
    readme_path.write_text(readme_content, encoding="utf-8")

    # 3. exploit.py script
    exploit_path = session_dir / "exploit.py"
    exploit_content = f"""#!/usr/bin/env python3
# Automated Exploit Payload Runner
import time, sys

print("[+] Initializing exploit sequence against target 10.10.14.55...")
time.sleep(0.3)
print("[*] Sending malicious SQL injection payload: admin' OR '1'='1...")
time.sleep(0.3)
print("[✓] SUCCESS! Authentication bypassed.")
print(f"[!] Extracted Flag: {flag}")
"""
    exploit_path.write_text(exploit_content, encoding="utf-8")
    try:
        os.chmod(exploit_path, 0o755)
    except Exception:
        pass

    # 4. rockyou.txt wordlist
    rockyou_path = session_dir / "rockyou.txt"
    rockyou_path.write_text("admin\npassword\n123456\nroot\ntoortoor\ncyberlearn\nsecret123\nPassword123!\n", encoding="utf-8")

    # 5. notes.txt & target_schema.sql
    notes_path = session_dir / "notes.txt"
    notes_path.write_text(
        f"[CONFIDENTIAL SECURITY REPORT]\nTarget: 10.10.14.55\nLab: {lab_id}\nTip: Run 'attack', 'nmap', or 'cat flag.txt'\n",
        encoding="utf-8"
    )

    schema_path = session_dir / "target_schema.sql"
    schema_path.write_text(
        f"-- Leaked database schema\nCREATE TABLE users (id INT, username VARCHAR(50), password_hash VARCHAR(255));\nINSERT INTO users VALUES (1, 'admin', '{flag}');\n",
        encoding="utf-8"
    )

    # 6. Provision executable CLI tools (attack, nmap, sqlmap, hydra, nikto, gobuster) in session bin/
    create_cli_tools(session_dir, flag, lab_id)

    return session_dir


def get_sanitized_environment(session_dir: Path) -> Dict[str, str]:
    """
    Returns a stripped-down environment dictionary with ZERO backend secrets.
    DATABASE_URL, SECRET_KEY, FLAG_SECRET, FIREBASE_* are NEVER passed.
    Workspace bin/ is placed at the front of PATH so attack tools are instantly available!
    """
    bin_path = str(session_dir / "bin")
    return {
        "TERM": "xterm-256color",
        "PATH": f"{bin_path}:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        "HOME": str(session_dir),
        "USER": "student",
        "LOGNAME": "student",
        "SHELL": "/bin/bash",
        "PWD": str(session_dir),
        "LANG": "C.UTF-8",
        "LC_ALL": "C.UTF-8",
        "PS1": r"\[\033[01;32m\]student@cyberlearn\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ ",
    }


# Detect platform support for Linux PTY
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
        # Child process (sandboxed subshell)
        os.close(master_fd)
        os.setsid()
        os.dup2(slave_fd, 0)
        os.dup2(slave_fd, 1)
        os.dup2(slave_fd, 2)
        if slave_fd > 2:
            os.close(slave_fd)

        os.chdir(str(session_dir))
        
        # Check if bash exists, fallback to sh
        shell_path = shutil.which("bash") or "/bin/bash"
        if not os.path.exists(shell_path):
            shell_path = shutil.which("sh") or "/bin/sh"

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
    Spawns cmd.exe with non-blocking stream pipes.
    """
    bin_path = str(session_dir / "bin")
    clean_env = {
        "SYSTEMROOT": os.environ.get("SYSTEMROOT", r"C:\Windows"),
        "PATH": f"{bin_path};" + os.environ.get("PATH", ""),
        "PROMPT": "student@cyberlearn:$P$G ",
        "COMSPEC": os.environ.get("COMSPEC", "cmd.exe"),
    }

    # Initial banner
    welcome = (
        "\r\n\x1b[32m[+] CyberLearn Interactive Terminal (Windows Local Sandbox)\x1b[0m\r\n"
        f"\x1b[36m[*] Workspace Root: {session_dir}\x1b[0m\r\n"
        "\x1b[90m[*] On Render (Linux), this runs a real full Linux bash PTY shell.\x1b[0m\r\n\r\n"
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
