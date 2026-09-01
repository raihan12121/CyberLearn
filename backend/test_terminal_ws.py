import pytest
from pathlib import Path
from app.labs.terminal import setup_workspace, get_sanitized_environment, WORKSPACE_BASE
from app.labs.router import generate_lab_flag

def test_setup_workspace_and_flags():
    session_id = "test-terminal-session-101"
    lab_id = "linux-navigation"
    
    workspace = setup_workspace(session_id, lab_id)
    assert workspace.exists()
    
    flag_file = workspace / "flag.txt"
    assert flag_file.exists()
    
    expected_flag = generate_lab_flag(lab_id)
    assert expected_flag in flag_file.read_text(encoding="utf-8")
    
    readme_file = workspace / "README.txt"
    assert readme_file.exists()
    assert "CYBERLEARN INTERACTIVE LAB" in readme_file.read_text(encoding="utf-8")

def test_sanitized_environment():
    dummy_dir = Path("/tmp/dummy_session")
    env = get_sanitized_environment(dummy_dir)
    
    # Must contain essential terminal vars
    assert "TERM" in env
    assert "PATH" in env
    assert "USER" in env
    assert env["USER"] == "student"
    
    # Critical security assertions: MUST NOT leak backend secrets
    assert "DATABASE_URL" not in env
    assert "SECRET_KEY" not in env
    assert "FLAG_SECRET" not in env
    assert "POSTGRES_PASSWORD" not in env

def test_terminal_websocket_route_registered():
    from app.labs.terminal import router as terminal_router
    routes = [r.path for r in terminal_router.routes]
    assert "/labs/{session_id}/terminal/ws" in routes

def test_cli_attack_tools_provisioned():
    session_id = "test-attack-tools-102"
    lab_id = "linux-navigation"
    workspace = setup_workspace(session_id, lab_id)
    
    bin_dir = workspace / "bin"
    assert bin_dir.exists()
    assert (bin_dir / "attack").exists()
    assert (bin_dir / "nmap").exists()
    assert (bin_dir / "sqlmap").exists()
    assert (bin_dir / "hydra").exists()
    assert (bin_dir / "nikto").exists()
    assert (bin_dir / "gobuster").exists()
    assert (workspace / "exploit.py").exists()
    assert (workspace / "rockyou.txt").exists()
