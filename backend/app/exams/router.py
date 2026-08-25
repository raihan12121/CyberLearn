import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth.dependencies import get_current_user

router = APIRouter(
    prefix="/exams",
    tags=["Exams & Assessments"]
)

def seed_default_exams_if_empty(db: Session):
    from ..courses.router import seed_database_if_empty
    seed_database_if_empty(db)

    # 1. Web Application Security Certified Specialist (WASCS) Exam
    exam1 = db.query(models.Exam).filter(models.Exam.id == "exam-web-security-cert").first()
    if not exam1:
        web_course = db.query(models.Course).filter(models.Course.id == "web-security-fundamentals").first()
        exam1 = models.Exam(
            id="exam-web-security-cert",
            course_id=web_course.id if web_course else "web-security-fundamentals",
            title="Web Application Security Certified Specialist (WASCS) Exam",
            description="Comprehensive qualification exam covering Same-Origin Policy, XSS vectors, SQL Injection mitigation, CSRF, SSRF, IDOR, and secure session architectures.",
            duration_minutes=45,
            passing_score_pct=70,
            total_marks=100,
            is_published=True
        )
        db.add(exam1)
        db.flush()

    if exam1 and db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam1.id).count() < 20:
        db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam1.id).delete()
        questions1 = [
            models.ExamQuestion(exam_id=exam1.id, question_text="Which combination of properties strictly defines an 'Origin' under the browser Same-Origin Policy (SOP)?", question_type="mcq", options=["Protocol (Scheme), Host Domain, and Port", "Top-level domain and IP Address only", "HTTP Method, Path, and Query String", "Cookie Domain and SSL Certificate fingerprint"], correct_answer="0", explanation="An origin is defined strictly by Scheme (e.g., https), Host (e.g., cyberlearn.io), and Port (e.g., 443).", points=5, sort_order=1),
            models.ExamQuestion(exam_id=exam1.id, question_text="What is the most secure defense mechanism against SQL Injection in modern web backends?", question_type="mcq", options=["Client-side regex validation in JavaScript", "Parameterized Queries / Prepared Statements (ORMs)", "Escaping double quotes only with backslashes", "Blacklisting keywords like SELECT and UNION"], correct_answer="1", explanation="Parameterized queries separate SQL instructions from untrusted data parameters, neutralizing code injection.", points=5, sort_order=2),
            models.ExamQuestion(exam_id=exam1.id, question_text="Which HTTP response header is specifically designed to restrict where scripts and resources can be loaded from, mitigating XSS?", question_type="mcq", options=["Access-Control-Allow-Origin", "Content-Security-Policy (CSP)", "X-Content-Type-Options", "Strict-Transport-Security (HSTS)"], correct_answer="1", explanation="Content-Security-Policy (CSP) restricts allowed script execution sources and disallows inline executable payloads.", points=5, sort_order=3),
            models.ExamQuestion(exam_id=exam1.id, question_text="An attacker tricks an authenticated user into clicking an invisible form that submits an unauthorized funds transfer. What vulnerability is this?", question_type="mcq", options=["Cross-Site Scripting (XSS)", "Cross-Site Request Forgery (CSRF)", "Server-Side Request Forgery (SSRF)", "Insecure Deserialization"], correct_answer="1", explanation="CSRF exploits ambient browser credentials (cookies) to execute unauthorized state-changing actions on behalf of the user.", points=5, sort_order=4),
            models.ExamQuestion(exam_id=exam1.id, question_text="Which flag must be set on a session cookie to prevent client-side JavaScript from accessing it via document.cookie?", question_type="mcq", options=["Secure", "HttpOnly", "SameSite=Lax", "Domain=.cyberlearn.io"], correct_answer="1", explanation="The HttpOnly flag blocks client JavaScript access, protecting the session token from XSS cookie-theft.", points=5, sort_order=5),
            models.ExamQuestion(exam_id=exam1.id, question_text="Which SameSite cookie attribute value provides the strictest protection by withholding the cookie on ALL cross-site requests?", question_type="mcq", options=["SameSite=Lax", "SameSite=Strict", "SameSite=None", "SameSite=Disabled"], correct_answer="1", explanation="SameSite=Strict prevents the browser from sending the cookie in any cross-site browsing context.", points=5, sort_order=6),
            models.ExamQuestion(exam_id=exam1.id, question_text="In Cross-Site Scripting (XSS), what characterizes Stored XSS compared to Reflected XSS?", question_type="mcq", options=["The payload is executed only once per user click", "The payload is permanently saved in the backend database and delivered to all viewers", "The payload only executes inside DOM innerHTML manipulation without server interaction", "The payload only affects administrator browsers"], correct_answer="1", explanation="Stored XSS is permanently stored in database records (e.g. comments, profiles) and executes whenever victims view the page.", points=5, sort_order=7),
            models.ExamQuestion(exam_id=exam1.id, question_text="Which vulnerable client-side JavaScript property execution path is a classic source of DOM-based XSS?", question_type="mcq", options=["document.body.innerText = input", "document.getElementById('display').innerHTML = location.hash.slice(1)", "console.log(window.name)", "sessionStorage.getItem('theme')"], correct_answer="1", explanation="Assigning untrusted URI fragments directly to innerHTML parses and executes any script tags contained therein.", points=5, sort_order=8),
            models.ExamQuestion(exam_id=exam1.id, question_text="What cloud metadata IP address is commonly targeted in Server-Side Request Forgery (SSRF) attacks on AWS and GCP?", question_type="mcq", options=["127.0.0.1", "169.254.169.254", "192.168.1.1", "10.0.0.1"], correct_answer="1", explanation="169.254.169.254 is the link-local metadata address providing instance IAM role credentials and security tokens.", points=5, sort_order=9),
            models.ExamQuestion(exam_id=exam1.id, question_text="A web application allows accessing invoices via /api/invoices/1042 without validating whether user 5 owns invoice 1042. What flaw is this?", question_type="mcq", options=["Insecure Direct Object Reference (IDOR / Broken Object Level Authorization)", "SQL Injection", "Cross-Site Scripting", "XML Entity Injection"], correct_answer="0", explanation="IDOR occurs when user-supplied input directly references database objects without server-side authorization checks.", points=5, sort_order=10),
            models.ExamQuestion(exam_id=exam1.id, question_text="In XML External Entity (XXE) injection, which DTD keyword allows referencing local server files or remote internal endpoints?", question_type="mcq", options=["<!ENTITY xxe SYSTEM 'file:///etc/passwd'>", "<!DOCTYPE root PUBLIC 'user'>", "<!ELEMENT note (#PCDATA)>", "<!ATTLIST item id ID>"], correct_answer="0", explanation="The SYSTEM entity identifier tells vulnerable XML parsers to load and parse external local files or URLs.", points=5, sort_order=11),
            models.ExamQuestion(exam_id=exam1.id, question_text="What critical vulnerability arises when a JWT header specifies 'alg': 'none' and the backend accepts it without verification?", question_type="mcq", options=["JWT Signature Verification Bypass", "Timing Attack on HMAC", "Token Expiry Replay", "RSA Key Confusion"], correct_answer="0", explanation="The 'none' algorithm flaw allows malicious actors to forge arbitrary admin claims without providing any signature.", points=5, sort_order=12),
            models.ExamQuestion(exam_id=exam1.id, question_text="Which CORS configuration creates a severe security risk by allowing any external site to read authenticated responses?", question_type="mcq", options=["Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true", "Access-Control-Allow-Methods: GET, POST", "Access-Control-Max-Age: 3600", "Access-Control-Allow-Headers: Content-Type"], correct_answer="0", explanation="Combining wildcard origin with credentials allows malicious origins to make credentialed requests and read response bodies.", points=5, sort_order=13),
            models.ExamQuestion(exam_id=exam1.id, question_text="Which character sequences are typically used to chain unauthorized commands in Command Injection attacks?", question_type="mcq", options=["; | && $(command)", "<!-- and -->", "/* and */", "[[ and ]]"], correct_answer="0", explanation="Shell command separators like semicolon (;), pipe (|), double ampersand (&&), and command substitution ($()) execute arbitrary commands.", points=5, sort_order=14),
            models.ExamQuestion(exam_id=exam1.id, question_text="What payload represents a classic directory traversal attempt to read server configuration files?", question_type="mcq", options=["../../../../etc/passwd", "<script>alert(1)</script>", "SELECT * FROM users WHERE 1=1", "DROP TABLE sessions;"], correct_answer="0", explanation="Dot-dot-slash sequence (../) navigates up the directory hierarchy out of the intended web root.", points=5, sort_order=15),
            models.ExamQuestion(exam_id=exam1.id, question_text="Which HTTP Header injection vulnerability occurs when unsanitized user input with CRLF (\\r\\n) is placed in headers?", question_type="mcq", options=["HTTP Response Splitting / Cache Poisoning", "Cross-Site Scripting only", "SQL Injection", "Path Traversal"], correct_answer="0", explanation="CRLF characters allow attackers to inject custom HTTP response headers, cookies, or split the response to serve arbitrary HTML.", points=5, sort_order=16),
            models.ExamQuestion(exam_id=exam1.id, question_text="In Server-Side Template Injection (SSTI) testing, what payload is commonly injected to confirm mathematical expression evaluation in Jinja2?", question_type="mcq", options=["{{7*7}} resulting in 49", "<%= 7*7 %>", "eval(7*7)", "{php}echo 7*7;{/php}"], correct_answer="0", explanation="{{7*7}} resolving to 49 confirms the template engine parses expressions server-side, paving the way for RCE.", points=5, sort_order=17),
            models.ExamQuestion(exam_id=exam1.id, question_text="Which HTTP header or CSP directive is the primary defense against Clickjacking (UI Redressing) attacks?", question_type="mcq", options=["X-Frame-Options: DENY (or CSP frame-ancestors 'none')", "X-Content-Type-Options: nosniff", "Strict-Transport-Security: max-age=31536000", "Access-Control-Allow-Origin: null"], correct_answer="0", explanation="X-Frame-Options: DENY and CSP frame-ancestors prevent malicious pages from loading the application in an invisible <iframe>.", points=5, sort_order=18),
            models.ExamQuestion(exam_id=exam1.id, question_text="What vulnerability allows attackers to hijack a domain when a DNS CNAME record points to an unclaimed third-party service?", question_type="mcq", options=["Subdomain Takeover", "DNS Amplification", "BGP Hijacking", "ARP Spoofing"], correct_answer="0", explanation="Dangling CNAME records pointing to decommissioned services (e.g. S3 bucket, GitHub Pages) can be registered by attackers.", points=5, sort_order=19),
            models.ExamQuestion(exam_id=exam1.id, question_text="Why is using Python 'pickle.loads()' or Java 'readObject()' on untrusted user data considered highly dangerous?", question_type="mcq", options=["Insecure Deserialization can lead to arbitrary remote code execution (RCE)", "It slows down database indexing", "It causes memory leaks without executing code", "It only affects client browser cookies"], correct_answer="0", explanation="Deserialization unmarshals object streams that can instantiate arbitrary gadget chains and execute operating system commands.", points=5, sort_order=20),
        ]
        for q in questions1:
            db.add(q)

    # 2. Linux Security & Systems Administration Exam
    exam2 = db.query(models.Exam).filter(models.Exam.id == "exam-linux-basics-cert").first()
    if not exam2:
        linux_course = db.query(models.Course).filter(models.Course.id == "linux-basics").first()
        exam2 = models.Exam(
            id="exam-linux-basics-cert",
            course_id=linux_course.id if linux_course else "linux-basics",
            title="Linux Security & Systems Administration Exam",
            description="Final qualification exam covering Linux permissions, SUID binaries, SSH hardening, process inspection, PAM, iptables, and kernel namespaces.",
            duration_minutes=45,
            passing_score_pct=70,
            total_marks=100,
            is_published=True
        )
        db.add(exam2)
        db.flush()

    if exam2 and db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam2.id).count() < 20:
        db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam2.id).delete()
        questions2 = [
            models.ExamQuestion(exam_id=exam2.id, question_text="Which command finds all executable files in the root filesystem with the SUID bit set?", question_type="mcq", options=["find / -perm -4000 -type f 2>/dev/null", "ls -la /etc/sudoers.d", "chmod +s /bin/bash", "grep -rn 'suid' /proc"], correct_answer="0", explanation="The permission octal 4000 identifies files where the SUID special bit is enabled.", points=5, sort_order=1),
            models.ExamQuestion(exam_id=exam2.id, question_text="What octal permissions represent read and write for owner, read-only for group, and no permissions for others?", question_type="mcq", options=["755", "640", "644", "700"], correct_answer="1", explanation="Owner (rw- = 4+2=6), Group (r-- = 4), Others (--- = 0) -> 640.", points=5, sort_order=2),
            models.ExamQuestion(exam_id=exam2.id, question_text="Which SSH configuration option in /etc/ssh/sshd_config completely prevents password brute-forcing?", question_type="mcq", options=["PasswordAuthentication no", "PermitRootLogin yes", "X11Forwarding yes", "Port 2222"], correct_answer="0", explanation="Disabling PasswordAuthentication enforces Public Key Authentication only.", points=5, sort_order=3),
            models.ExamQuestion(exam_id=exam2.id, question_text="Which virtual filesystem in Linux provides real-time information about running processes and kernel parameters?", question_type="mcq", options=["/dev", "/proc", "/sys/kernel", "/var/log"], correct_answer="1", explanation="/proc is a pseudo-filesystem generated on-the-fly containing process and kernel metrics.", points=5, sort_order=4),
            models.ExamQuestion(exam_id=exam2.id, question_text="In /etc/shadow, what does a password field starting with '$6$' signify?", question_type="mcq", options=["MD5 hashing", "SHA-512 hashing with salt", "DES encryption", "Blowfish / bcrypt"], correct_answer="1", explanation="$6$ indicates the modern SHA-512 cryptographic hashing algorithm with unique per-user salt.", points=5, sort_order=5),
            models.ExamQuestion(exam_id=exam2.id, question_text="What is the primary security effect of setting the Sticky Bit (octal 1000) on a shared directory like /tmp?", question_type="mcq", options=["Only the file owner or root can delete or rename files within the directory", "All files become readable by everyone", "Files inherit the group ownership of the directory", "Executable files run with root permissions"], correct_answer="0", explanation="The sticky bit prevents unprivileged users from deleting or renaming files owned by others in world-writable directories.", points=5, sort_order=6),
            models.ExamQuestion(exam_id=exam2.id, question_text="When the SGID bit (octal 2000) is applied to a directory, what happens to new files created inside it?", question_type="mcq", options=["New files inherit the group ownership of the directory", "New files are encrypted automatically", "New files can only be executed by root", "New files inherit the owner's primary group"], correct_answer="0", explanation="SGID on a directory ensures all newly created child files inherit the parent directory's group ID.", points=5, sort_order=7),
            models.ExamQuestion(exam_id=exam2.id, question_text="Which command lists all active listening TCP and UDP sockets along with their process names and PIDs?", question_type="mcq", options=["ss -tulpn (or netstat -tulpn)", "ps aux | grep listen", "lsof -i :80", "ip route show"], correct_answer="0", explanation="ss -tulpn provides a comprehensive report of TCP (-t), UDP (-u), listening (-l), numeric (-n) ports and processes (-p).", points=5, sort_order=8),
            models.ExamQuestion(exam_id=exam2.id, question_text="Which subsystem in Linux provides modular authentication, account, session, and password management?", question_type="mcq", options=["PAM (Pluggable Authentication Modules)", "SELinux", "systemd", "AppArmor"], correct_answer="0", explanation="PAM (/etc/pam.d/) allows administrators to customize authentication policies across all services.", points=5, sort_order=9),
            models.ExamQuestion(exam_id=exam2.id, question_text="What dangerous entry in /etc/sudoers allows a user to execute any command as root without a password?", question_type="mcq", options=["username ALL=(ALL:ALL) NOPASSWD: ALL", "username ALL=(root) /bin/ls", "%admin ALL=(ALL) ALL", "Defaults env_reset"], correct_answer="0", explanation="NOPASSWD: ALL grants unrestricted root privilege escalation without requiring password validation.", points=5, sort_order=10),
            models.ExamQuestion(exam_id=exam2.id, question_text="Which log file on Debian/Ubuntu systems records SSH login attempts, sudo executions, and authentication failures?", question_type="mcq", options=["/var/log/auth.log", "/var/log/syslog", "/var/log/dmesg", "/var/log/kern.log"], correct_answer="0", explanation="/var/log/auth.log (or /var/log/secure on RHEL) logs all security and authentication events.", points=5, sort_order=11),
            models.ExamQuestion(exam_id=exam2.id, question_text="Which command inspects Linux file capabilities attached to binaries?", question_type="mcq", options=["getcap -r / 2>/dev/null", "setcap cap_sys_admin+ep /bin/ping", "ls -l /etc/cap", "capsh --print"], correct_answer="0", explanation="getcap recursively scans and displays POSIX capabilities assigned to executable files.", points=5, sort_order=12),
            models.ExamQuestion(exam_id=exam2.id, question_text="Which iptables command appends a rule to accept incoming TCP traffic on port 443?", question_type="mcq", options=["iptables -A INPUT -p tcp --dport 443 -j ACCEPT", "iptables -D INPUT -p tcp --dport 443", "iptables -P INPUT DROP", "iptables -F FORWARD"], correct_answer="0", explanation="iptables -A INPUT -p tcp --dport 443 -j ACCEPT appends an allow rule for HTTPS traffic.", points=5, sort_order=13),
            models.ExamQuestion(exam_id=exam2.id, question_text="Where are system-wide cron jobs configured on a Linux server?", question_type="mcq", options=["/etc/crontab and /etc/cron.d/", "/var/spool/mail", "/usr/bin/cron", "/tmp/cron.tab"], correct_answer="0", explanation="/etc/crontab and /etc/cron.d/ contain system-level scheduled task definitions.", points=5, sort_order=14),
            models.ExamQuestion(exam_id=exam2.id, question_text="What Linux kernel feature isolates processes into separate mount, PID, network, and IPC trees for containerization?", question_type="mcq", options=["Linux Namespaces", "Kernel Modules", "Swap Partitions", "Btrfs Snapshots"], correct_answer="0", explanation="Namespaces provide process isolation across IPC, Network, Mount, PID, User, and UTS domains.", points=5, sort_order=15),
            models.ExamQuestion(exam_id=exam2.id, question_text="What kernel feature enforces resource limits (CPU, memory, disk I/O) on process groups?", question_type="mcq", options=["Control Groups (cgroups)", "SELinux", "Capabilities", "Seccomp"], correct_answer="0", explanation="cgroups meter and limit resource consumption across process trees.", points=5, sort_order=16),
            models.ExamQuestion(exam_id=exam2.id, question_text="Which tool is used to monitor filesystem integrity against unauthorized modifications using cryptographic hashes?", question_type="mcq", options=["AIDE (Advanced Intrusion Detection Environment)", "rsync", "tar", "gzip"], correct_answer="0", explanation="AIDE builds an integrity database of file hashes and alerts on unauthorized system file changes.", points=5, sort_order=17),
            models.ExamQuestion(exam_id=exam2.id, question_text="How can administrators prevent core dumps from leaking sensitive in-memory credentials to disk?", question_type="mcq", options=["Setting 'ulimit -c 0' and configuring /etc/security/limits.conf", "Disabling swap memory only", "Deleting /var/log", "Enabling core_pattern in sysctl"], correct_answer="0", explanation="Setting the core dump limit to 0 stops the kernel from writing process memory dumps upon crashes.", points=5, sort_order=18),
            models.ExamQuestion(exam_id=exam2.id, question_text="Which Linux security mechanism restricts the specific system calls (syscalls) a process can execute?", question_type="mcq", options=["Seccomp (Secure Computing Mode)", "Chroot", "Umask", "PAM"], correct_answer="0", explanation="Seccomp filters and blocks dangerous system calls (e.g., ptrace, execve) executed by confined applications.", points=5, sort_order=19),
            models.ExamQuestion(exam_id=exam2.id, question_text="Which command checks the security status and policy mode of SELinux?", question_type="mcq", options=["sestatus (or getenforce)", "selinux --verify", "cat /proc/selinux", "systemctl status selinux"], correct_answer="0", explanation="sestatus displays the current SELinux status (Enforcing, Permissive, or Disabled) and loaded policy.", points=5, sort_order=20),
        ]
        for q in questions2:
            db.add(q)

    # 3. Cisco Certified Network Associate (CCNA) Security Exam
    exam3 = db.query(models.Exam).filter(models.Exam.id == "exam-ccna-security").first()
    if not exam3:
        net_course = db.query(models.Course).filter(models.Course.id == "network-security-essentials").first()
        exam3 = models.Exam(
            id="exam-ccna-security",
            course_id=net_course.id if net_course else "network-security-essentials",
            title="Cisco CCNA Security & Network Defense Exam",
            description="Official qualification exam testing IPv4/IPv6 subnetting, TCP/IP handshakes, Access Control Lists (ACLs), VLAN trunking, Dynamic ARP Inspection, DHCP snooping, and IPSec VPNs.",
            duration_minutes=45,
            passing_score_pct=70,
            total_marks=100,
            is_published=True
        )
        db.add(exam3)
        db.flush()

    if exam3 and db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam3.id).count() < 20:
        db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam3.id).delete()
        questions3 = [
            models.ExamQuestion(exam_id=exam3.id, question_text="How many usable host IP addresses are available in a standard /28 IPv4 subnet?", question_type="mcq", options=["14 usable hosts", "16 usable hosts", "30 usable hosts", "6 usable hosts"], correct_answer="0", explanation="A /28 subnet has 32 - 28 = 4 host bits (2^4 = 16 total addresses). Subtracting Network and Broadcast gives 14 usable hosts.", points=5, sort_order=1),
            models.ExamQuestion(exam_id=exam3.id, question_text="What is the precise 3-step TCP connection establishment sequence?", question_type="mcq", options=["SYN -> SYN-ACK -> ACK", "ACK -> SYN -> DATA", "SYN -> ACK -> RST", "PING -> ECHO -> ACK"], correct_answer="0", explanation="The classic 3-way handshake begins with client SYN, server replies with SYN-ACK, and client acknowledges with ACK.", points=5, sort_order=2),
            models.ExamQuestion(exam_id=exam3.id, question_text="What type of Cisco ACL filters traffic based on source IP, destination IP, protocols (TCP/UDP), and destination port numbers?", question_type="mcq", options=["Extended ACL (Numbered 100-199 / Named)", "Standard ACL (Numbered 1-99)", "Reflexive ACL only", "Dynamic Time-based ACL"], correct_answer="0", explanation="Extended ACLs provide granular filtering by inspecting source, destination, protocol, and layer 4 port numbers.", points=5, sort_order=3),
            models.ExamQuestion(exam_id=exam3.id, question_text="Which Cisco switch security feature defends against ARP Spoofing / Man-In-The-Middle attacks by validating ARP packets against a DHCP snooping binding database?", question_type="mcq", options=["Dynamic ARP Inspection (DAI)", "Port Security", "BPDU Guard", "IP Source Guard"], correct_answer="0", explanation="DAI intercepts and validates all ARP requests and responses against the snooping binding database to drop invalid bindings.", points=5, sort_order=4),
            models.ExamQuestion(exam_id=exam3.id, question_text="What switch security feature designates switch ports as trusted or untrusted to block rogue DHCP servers?", question_type="mcq", options=["DHCP Snooping", "Port Security", "802.1X Authentication", "Storm Control"], correct_answer="0", explanation="DHCP Snooping filters DHCP offer messages from untrusted access ports, neutralizing rogue DHCP servers.", points=5, sort_order=5),
            models.ExamQuestion(exam_id=exam3.id, question_text="What standard 802.1Q attack occurs when an attacker crafts frames with double tags to jump into a different VLAN?", question_type="mcq", options=["VLAN Double Tagging / VLAN Hopping", "MAC Flooding", "STP Manipulation", "CAM Overflow"], correct_answer="0", explanation="Double tagging exploits native VLAN processing on trunk links to strip the outer tag and deliver the frame to a victim VLAN.", points=5, sort_order=6),
            models.ExamQuestion(exam_id=exam3.id, question_text="Which Port Security violation mode drops rogue traffic, logs a syslog message, increments violation counter, AND shuts down the port?", question_type="mcq", options=["Shutdown", "Restrict", "Protect", "Warning"], correct_answer="0", explanation="The 'shutdown' violation mode disables the interface (err-disable), stops traffic, and generates SNMP/syslog alerts.", points=5, sort_order=7),
            models.ExamQuestion(exam_id=exam3.id, question_text="In IPSec VPN architecture, what is the crucial difference between Authentication Header (AH) and Encapsulating Security Payload (ESP)?", question_type="mcq", options=["ESP provides confidentiality (encryption) and integrity, while AH provides integrity and authentication WITHOUT encryption", "AH encrypts the payload while ESP does not", "AH works over UDP while ESP works over TCP only", "ESP is only used in transport mode"], correct_answer="0", explanation="ESP (IP Protocol 50) encrypts and authenticates packet payloads; AH (IP Protocol 51) provides integrity but no encryption.", points=5, sort_order=8),
            models.ExamQuestion(exam_id=exam3.id, question_text="What is established during IKE Phase 1 in an IPSec tunnel negotiation?", question_type="mcq", options=["An authenticated, secure ISAKMP Management SA to negotiate Phase 2", "The data encryption keys for user traffic", "The static routing table", "The DHCP binding pool"], correct_answer="0", explanation="IKE Phase 1 establishes a bi-directional ISAKMP Security Association (SA) that protects subsequent Phase 2 negotiations.", points=5, sort_order=9),
            models.ExamQuestion(exam_id=exam3.id, question_text="Which Spanning Tree Protocol (STP) feature immediately err-disables an access port if an unexpected BPDU frame is received?", question_type="mcq", options=["BPDU Guard", "Root Guard", "Loop Guard", "PortFast"], correct_answer="0", explanation="BPDU Guard prevents rogue switches from connecting to PortFast access ports and hijacking the STP root bridge.", points=5, sort_order=10),
            models.ExamQuestion(exam_id=exam3.id, question_text="In the AAA security framework, what is a key architectural difference between TACACS+ and RADIUS?", question_type="mcq", options=["TACACS+ encrypts the entire packet payload over TCP 49, whereas RADIUS only encrypts the password over UDP", "RADIUS encrypts the entire packet while TACACS+ uses plaintext", "TACACS+ is only supported on wireless APs", "RADIUS separates authentication and authorization"], correct_answer="0", explanation="TACACS+ (Cisco proprietary/standard) uses TCP port 49 and encrypts entire packets; RADIUS uses UDP and encrypts only password fields.", points=5, sort_order=11),
            models.ExamQuestion(exam_id=exam3.id, question_text="What type of firewall maintains a state table to track active TCP sessions and dynamic connection states?", question_type="mcq", options=["Stateful Packet Inspection (SPI) Firewall", "Stateless Packet Filter", "Application Proxy only", "Circuit-Level Gateway without state"], correct_answer="0", explanation="Stateful firewalls inspect connection flags (SYN, ACK, FIN) and automatically permit returning reply packets for established flows.", points=5, sort_order=12),
            models.ExamQuestion(exam_id=exam3.id, question_text="Which Cisco security mechanism protects router CPUs from exhaustion by rate-limiting management and control traffic?", question_type="mcq", options=["Control Plane Policing (CoPP)", "Port Security", "VLAN Access Control List (VACL)", "Unicast Reverse Path Forwarding (uRPF)"], correct_answer="0", explanation="CoPP applies QoS filtering policies to traffic heading to the router's Route Processor/Control Plane.", points=5, sort_order=13),
            models.ExamQuestion(exam_id=exam3.id, question_text="Which routing protocol authentication method is most secure against routing table poisoning?", question_type="mcq", options=["Cryptographic HMAC-SHA Keychains (OSPF/BGP)", "Plaintext password", "SNMPv1 Community Strings", "Static default routes only"], correct_answer="0", explanation="Cryptographic HMAC-SHA key authentication ensures routing updates originate from verified adjacent peers.", points=5, sort_order=14),
            models.ExamQuestion(exam_id=exam3.id, question_text="What security framework uses cryptographic signatures to prevent BGP Route Hijacking across the Internet?", question_type="mcq", options=["RPKI (Resource Public Key Infrastructure) / Route Origin Authorization (ROA)", "DNSSEC", "IPSec Tunnel", "802.1AE MACsec"], correct_answer="0", explanation="RPKI validates that an autonomous system (AS) is mathematically authorized to originate specific IP prefix announcements.", points=5, sort_order=15),
            models.ExamQuestion(exam_id=exam3.id, question_text="What form of NAT maps multiple private IP addresses to a single public IP using unique source port numbers?", question_type="mcq", options=["Port Address Translation (PAT) / NAT Overload", "Static NAT", "Dynamic NAT Pool without overload", "Identity NAT"], correct_answer="0", explanation="PAT (NAT Overload) multiplexes thousands of internal connections across a single public IP via unique ephemeral source ports.", points=5, sort_order=16),
            models.ExamQuestion(exam_id=exam3.id, question_text="Which SNMP version provides both cryptographic authentication and DES/AES payload encryption?", question_type="mcq", options=["SNMPv3 with authPriv security level", "SNMPv1", "SNMPv2c", "SNMPv3 with noAuthNoPriv"], correct_answer="0", explanation="SNMPv3 authPriv enforces SHA/MD5 authentication and AES/DES encryption for network management packets.", points=5, sort_order=17),
            models.ExamQuestion(exam_id=exam3.id, question_text="In the standard Syslog severity level scale (0 to 7), what does level 0 indicate?", question_type="mcq", options=["Emergency (System unusable)", "Debugging", "Informational", "Warning"], correct_answer="0", explanation="Syslog severity 0 is Emergency (system panic/unusable), while severity 7 is Debugging.", points=5, sort_order=18),
            models.ExamQuestion(exam_id=exam3.id, question_text="In Cisco Zone-Based Policy Firewall (ZFW), what is the default traffic policy between different security zones?", question_type="mcq", options=["Drop all traffic unless explicitly permitted in a zone pair service policy", "Allow all traffic by default", "Permit TCP only", "Inspect ICMP only"], correct_answer="0", explanation="ZFW implements a default-deny policy: traffic between different zones is dropped unless explicitly permitted by policy maps.", points=5, sort_order=19),
            models.ExamQuestion(exam_id=exam3.id, question_text="Why is NTP (Network Time Protocol) authentication essential in an enterprise security infrastructure?", question_type="mcq", options=["It prevents attackers from tampering with timestamps in SIEM forensics and replay attack detection", "It speeds up packet routing", "It encrypts payload data across routers", "It manages DHCP lease times"], correct_answer="0", explanation="Accurate, synchronized, and authenticated time is critical for digital forensics, certificate validation, and event correlation.", points=5, sort_order=20),
        ]
        for q in questions3:
            db.add(q)

    # 4. CompTIA Security+ SY0-701 Exam
    exam4 = db.query(models.Exam).filter(models.Exam.id == "exam-comptia-secplus").first()
    if not exam4:
        exam4 = models.Exam(
            id="exam-comptia-secplus",
            course_id=None,
            title="CompTIA Security+ (SY0-701) Certification Exam",
            description="Industry-standard certification exam covering Threat Landscape, Cryptography & PKI, Identity & Access Management, Zero Trust Architecture, and Incident Response.",
            duration_minutes=45,
            passing_score_pct=70,
            total_marks=100,
            is_published=True
        )
        db.add(exam4)
        db.flush()

    if exam4 and db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam4.id).count() < 20:
        db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam4.id).delete()
        questions4 = [
            models.ExamQuestion(exam_id=exam4.id, question_text="Which core security principle states that data must be protected against unauthorized modification or deletion?", question_type="mcq", options=["Integrity", "Confidentiality", "Availability", "Non-repudiation"], correct_answer="0", explanation="Integrity ensures data remains accurate and untampered with throughout its lifecycle.", points=5, sort_order=1),
            models.ExamQuestion(exam_id=exam4.id, question_text="What is the foundational philosophy of Zero Trust Architecture (ZTA)?", question_type="mcq", options=["'Never trust, always verify' regardless of whether traffic originates inside or outside the network", "Trust all internal network devices behind the perimeter firewall", "Authenticate users once per 24 hours", "Rely entirely on signature-based antivirus"], correct_answer="0", explanation="Zero Trust eliminates implicit trust based on network location, verifying every request explicitly.", points=5, sort_order=2),
            models.ExamQuestion(exam_id=exam4.id, question_text="In asymmetric cryptography, which key must the sender use to ensure ONLY the recipient can decrypt the message?", question_type="mcq", options=["Recipient's Public Key", "Sender's Private Key", "Recipient's Private Key", "Sender's Public Key"], correct_answer="0", explanation="Encrypting with the recipient's public key guarantees that only the recipient's corresponding private key can decrypt it.", points=5, sort_order=3),
            models.ExamQuestion(exam_id=exam4.id, question_text="What mathematical property ensures that no two distinct inputs produce the exact same hash output?", question_type="mcq", options=["Collision Resistance", "High Entropy", "Key Stretching", "Diffusion"], correct_answer="0", explanation="Collision resistance guarantees that finding two distinct inputs with identical hash outputs is computationally infeasible.", points=5, sort_order=4),
            models.ExamQuestion(exam_id=exam4.id, question_text="What is a targeted phishing attack aimed specifically at high-profile executives or senior leadership called?", question_type="mcq", options=["Whaling", "Vishing", "Smishing", "Watering Hole"], correct_answer="0", explanation="Whaling specifically targets C-level executives and high-net-worth individuals.", points=5, sort_order=5),
            models.ExamQuestion(exam_id=exam4.id, question_text="In CVSS v3.1 vulnerability scoring, what severity rating is assigned to a score of 9.0 to 10.0?", question_type="mcq", options=["Critical", "High", "Medium", "Low"], correct_answer="0", explanation="CVSS 9.0 - 10.0 represents a Critical vulnerability requiring urgent remediation.", points=5, sort_order=6),
            models.ExamQuestion(exam_id=exam4.id, question_text="What is the correct chronological sequence of Incident Response phases according to NIST SP 800-61?", question_type="mcq", options=["Preparation -> Detection & Analysis -> Containment, Eradication & Recovery -> Post-Incident Activity", "Detection -> Recovery -> Containment -> Preparation", "Containment -> Eradication -> Identification -> Lessons Learned", "Lessons Learned -> Preparation -> Identification -> Eradication"], correct_answer="0", explanation="NIST defines Preparation -> Detection & Analysis -> Containment, Eradication & Recovery -> Post-Incident Activity (Lessons Learned).", points=5, sort_order=7),
            models.ExamQuestion(exam_id=exam4.id, question_text="Which security tool automates incident response workflows and integrates multi-tool playbooks?", question_type="mcq", options=["SOAR (Security Orchestration, Automation, and Response)", "SIEM", "IDS", "WAF"], correct_answer="0", explanation="SOAR platforms execute automated playbooks across firewalls, EDRs, and ticketing systems.", points=5, sort_order=8),
            models.ExamQuestion(exam_id=exam4.id, question_text="What metric defines the maximum acceptable duration of system downtime during an outage?", question_type="mcq", options=["Recovery Time Objective (RTO)", "Recovery Point Objective (RPO)", "Mean Time Between Failures (MTBF)", "Service Level Agreement (SLA)"], correct_answer="0", explanation="RTO specifies the maximum targeted time elapsed before business operations must be restored.", points=5, sort_order=9),
            models.ExamQuestion(exam_id=exam4.id, question_text="What metric defines the maximum acceptable amount of data loss measured in time (e.g., maximum 1 hour of lost transactions)?", question_type="mcq", options=["Recovery Point Objective (RPO)", "Recovery Time Objective (RTO)", "Mean Time to Repair (MTTR)", "Business Impact Analysis (BIA)"], correct_answer="0", explanation="RPO measures the age of files that must be recovered from backup storage for normal operations to resume.", points=5, sort_order=10),
            models.ExamQuestion(exam_id=exam4.id, question_text="Which defense strategy employs multiple layers of protective mechanisms throughout an IT infrastructure?", question_type="mcq", options=["Defense-in-Depth (Layered Security)", "Single Point of Failure", "Perimeter-Only Security", "Security through Obscurity"], correct_answer="0", explanation="Defense-in-Depth ensures that if one protective layer fails, subsequent layers prevent total compromise.", points=5, sort_order=11),
            models.ExamQuestion(exam_id=exam4.id, question_text="What real-time protocol allows client browsers to query the revocation status of an X.509 digital certificate?", question_type="mcq", options=["OCSP (Online Certificate Status Protocol)", "CRL", "DNSSEC", "LDAP"], correct_answer="0", explanation="OCSP provides real-time, low-bandwidth certificate validity checks without downloading large CRL files.", points=5, sort_order=12),
            models.ExamQuestion(exam_id=exam4.id, question_text="What physical security control utilizes a dual-door interlocking vestibule to prevent tailgating/piggybacking?", question_type="mcq", options=["Mantrap (Access Control Vestibule)", "Turnstile", "Bollard", "Faraday Cage"], correct_answer="0", explanation="A mantrap requires the first door to fully close and lock before authentication allows opening the second door.", points=5, sort_order=13),
            models.ExamQuestion(exam_id=exam4.id, question_text="What type of sophisticated, well-funded threat actor conducts prolonged cyber campaigns against critical infrastructure?", question_type="mcq", options=["Advanced Persistent Threat (APT) / Nation-State Actor", "Script Kiddie", "Hacktivist", "Opportunistic Spammer"], correct_answer="0", explanation="APTs are highly organized state-sponsored groups focused on long-term espionage and persistence.", points=5, sort_order=14),
            models.ExamQuestion(exam_id=exam4.id, question_text="What document provides an exhaustive inventory of all software dependencies and open-source packages in an application?", question_type="mcq", options=["SBOM (Software Bill of Materials)", "EULA", "SOC 2 Report", "NDA"], correct_answer="0", explanation="An SBOM catalogs all nested third-party libraries to enable rapid supply chain vulnerability identification.", points=5, sort_order=15),
            models.ExamQuestion(exam_id=exam4.id, question_text="Which symmetric encryption mode provides both high-speed confidentiality and authenticated data integrity checking?", question_type="mcq", options=["AES-GCM (Galois/Counter Mode)", "AES-ECB", "AES-CBC without HMAC", "DES-OFB"], correct_answer="0", explanation="AES-GCM is an Authenticated Encryption with Associated Data (AEAD) mode providing confidentiality and integrity.", points=5, sort_order=16),
            models.ExamQuestion(exam_id=exam4.id, question_text="Which cryptographic feature ensures that past session communications cannot be decrypted even if the server's private key is compromised in the future?", question_type="mcq", options=["Perfect Forward Secrecy (PFS via ECDHE)", "Static RSA Key Exchange", "Certificate Pinning", "Key Escrow"], correct_answer="0", explanation="PFS uses ephemeral Diffie-Hellman keys generated per session, isolating compromise to individual sessions.", points=5, sort_order=17),
            models.ExamQuestion(exam_id=exam4.id, question_text="What security principle mandates dividing critical financial authorization tasks between multiple employees to prevent fraud?", question_type="mcq", options=["Separation of Duties", "Job Rotation", "Least Privilege", "Need to Know"], correct_answer="0", explanation="Separation of Duties ensures no single individual has absolute control over a high-risk business process.", points=5, sort_order=18),
            models.ExamQuestion(exam_id=exam4.id, question_text="Which data sanitization method renders hard drives unreadable by exposing magnetic platters to powerful magnetic fields?", question_type="mcq", options=["Degaussing", "Overwriting with zeros once", "Formatting", "Flipping partitions"], correct_answer="0", explanation="Degaussing disrupts magnetic domains on platters, irreversibly sanitizing all data.", points=5, sort_order=19),
            models.ExamQuestion(exam_id=exam4.id, question_text="What data classification level is reserved for data whose unauthorized disclosure would cause severe, catastrophic harm to an organization?", question_type="mcq", options=["Restricted / Top Secret", "Confidential", "Internal Use Only", "Public"], correct_answer="0", explanation="Restricted / Top Secret is the highest classification tier reserved for mission-critical sensitive assets.", points=5, sort_order=20),
        ]
        for q in questions4:
            db.add(q)

    # 5. Certified Ethical Hacker (CEH) Associate Exam
    exam5 = db.query(models.Exam).filter(models.Exam.id == "exam-ceh-associate").first()
    if not exam5:
        exam5 = models.Exam(
            id="exam-ceh-associate",
            course_id=None,
            title="Certified Ethical Hacker (CEH) Associate Exam",
            description="Comprehensive penetration testing exam evaluating Reconnaissance, Port Scanning, Metasploit Exploitation, Buffer Overflows, Privilege Escalation, and Pivoting.",
            duration_minutes=45,
            passing_score_pct=70,
            total_marks=100,
            is_published=True
        )
        db.add(exam5)
        db.flush()

    if exam5 and db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam5.id).count() < 20:
        db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam5.id).delete()
        questions5 = [
            models.ExamQuestion(exam_id=exam5.id, question_text="Which Nmap scan flag initiates a TCP SYN 'Half-Open' stealth scan that avoids completing the 3-way handshake?", question_type="mcq", options=["nmap -sS", "nmap -sT", "nmap -sU", "nmap -sn"], correct_answer="0", explanation="nmap -sS sends SYN packets and tears down connections with RST upon receiving SYN-ACK, minimizing logging.", points=5, sort_order=1),
            models.ExamQuestion(exam_id=exam5.id, question_text="In binary exploitation, what occurs when an attacker writes more data into a fixed stack buffer than allocated, overwriting the Instruction Pointer (EIP/RIP)?", question_type="mcq", options=["Stack Buffer Overflow leading to arbitrary code execution", "Integer Underflow", "Race Condition (TOCTOU)", "Denial of Service without memory corruption"], correct_answer="0", explanation="Buffer overflows overwrite adjacent memory on the call stack, enabling attackers to hijack the saved instruction pointer.", points=5, sort_order=2),
            models.ExamQuestion(exam_id=exam5.id, question_text="Which Metasploit payload runs entirely in memory as a dynamically injected DLL, providing extensive post-exploitation pivoting?", question_type="mcq", options=["Meterpreter", "Shell Reverse TCP", "Generic Single Payload", "Netcat Listener"], correct_answer="0", explanation="Meterpreter is an advanced, memory-resident staged payload that avoids touching disk and provides stealthy pivoting features.", points=5, sort_order=3),
            models.ExamQuestion(exam_id=exam5.id, question_text="Which command performs a complete DNS Zone Transfer query against a misconfigured nameserver?", question_type="mcq", options=["dig axfr @ns1.target.com target.com", "nslookup target.com", "host -t A target.com", "whois target.com"], correct_answer="0", explanation="dig axfr requests a full zone transfer, leaking all internal subdomains and IP mappings if unprotected.", points=5, sort_order=4),
            models.ExamQuestion(exam_id=exam5.id, question_text="What technique connects to network ports using Netcat/Telnet to determine exact application versions and daemon versions?", question_type="mcq", options=["Banner Grabbing", "Fuzzing", "OS Fingerprinting via TCP TTL", "ARP Spoofing"], correct_answer="0", explanation="Banner grabbing captures server header responses upon connection to identify software names and versions.", points=5, sort_order=5),
            models.ExamQuestion(exam_id=exam5.id, question_text="Which automated vulnerability scanning tool is widely used for network and host infrastructure assessments?", question_type="mcq", options=["Nessus / OpenVAS", "Wireshark", "John the Ripper", "Hydra"], correct_answer="0", explanation="Nessus and OpenVAS audit network assets against extensive databases of known CVEs and misconfigurations.", points=5, sort_order=6),
            models.ExamQuestion(exam_id=exam5.id, question_text="In Metasploit, which generic handler module is used to catch inbound reverse TCP shells from compromised targets?", question_type="mcq", options=["exploit/multi/handler", "auxiliary/scanner/portscan", "post/windows/gather", "payload/generic/shell_bind_tcp"], correct_answer="0", explanation="exploit/multi/handler is configured with payload and LHOST/LPORT parameters to listen for staging connections.", points=5, sort_order=7),
            models.ExamQuestion(exam_id=exam5.id, question_text="How can a penetration tester check available sudo privileges for the current unprivileged Linux user?", question_type="mcq", options=["sudo -l", "whoami /priv", "cat /etc/passwd", "id -g"], correct_answer="0", explanation="sudo -l lists all allowed and forbidden commands for the invoking user as specified in /etc/sudoers.", points=5, sort_order=8),
            models.ExamQuestion(exam_id=exam5.id, question_text="In Windows privilege escalation, what flaw occurs when service binary paths with spaces lack surrounding quotation marks (e.g. C:\\Program Files\\My Service\\run.exe)?", question_type="mcq", options=["Unquoted Service Path Vulnerability", "AlwaysInstallElevated", "Token Impersonation", "DLL Hijacking"], correct_answer="0", explanation="Windows searches ambiguous paths like C:\\Program.exe before C:\\Program Files\\..., allowing privilege escalation if writeable.", points=5, sort_order=9),
            models.ExamQuestion(exam_id=exam5.id, question_text="What password cracking approach uses precomputed lookup tables of cryptographic hash chains to crack hashes in seconds?", question_type="mcq", options=["Rainbow Tables Attack", "Brute Force Attack", "Dictionary Attack with Rules", "Hybrid Attack"], correct_answer="0", explanation="Rainbow tables trade memory storage for rapid cracking speed using precomputed reduction functions and hash chains.", points=5, sort_order=10),
            models.ExamQuestion(exam_id=exam5.id, question_text="Which tool is used in network assessments to perform live ARP poisoning and Man-in-the-Middle credential interception?", question_type="mcq", options=["Bettercap / Ettercap", "Burp Suite", "Hashcat", "Aircrack-ng"], correct_answer="0", explanation="Bettercap and Ettercap send gratuitous ARP replies to associate the attacker's MAC address with default gateways.", points=5, sort_order=11),
            models.ExamQuestion(exam_id=exam5.id, question_text="What specific 4-way authentication exchange must be captured during wireless auditing to crack WPA2-PSK passphrases offline?", question_type="mcq", options=["EAPOL 4-Way Handshake", "Beacon Frame sequence", "WPS PIN exchange", "Diffie-Hellman Key Exchange"], correct_answer="0", explanation="Capturing the EAPOL 4-way handshake provides the Anonce, Snonce, and MIC required for offline dictionary cracking.", points=5, sort_order=12),
            models.ExamQuestion(exam_id=exam5.id, question_text="Which attack sends deauthentication 802.11 frames to disconnect wireless clients and capture reconnect handshakes?", question_type="mcq", options=["Wi-Fi Deauthentication Attack (aireplay-ng -0)", "Evil Twin without deauth", "Karma Attack", "WPS Brute Force"], correct_answer="0", explanation="aireplay-ng -0 floods spoofed deauth management frames, forcing stations to re-authenticate.", points=5, sort_order=13),
            models.ExamQuestion(exam_id=exam5.id, question_text="What is a lightweight server-side script uploaded to a compromised web server that accepts shell commands via HTTP parameters called?", question_type="mcq", options=["Web Shell (e.g. PHP/ASPX backdoor)", "Rootkit", "Trojan Dropper", "Worm"], correct_answer="0", explanation="Web shells (e.g. <?php system($_GET['cmd']); ?>) provide persistent web-based administrative and command access.", points=5, sort_order=14),
            models.ExamQuestion(exam_id=exam5.id, question_text="Which SSH command creates a local SOCKS5 proxy on port 1080 to route penetration testing tools into an internal network?", question_type="mcq", options=["ssh -D 1080 user@pivot-host", "ssh -L 80:localhost:80 user@pivot-host", "ssh -R 4444:localhost:4444 user@pivot-host", "ssh -N user@pivot-host"], correct_answer="0", explanation="ssh -D binds a dynamic application-level SOCKS proxy to route traffic through the compromised jump host.", points=5, sort_order=15),
            models.ExamQuestion(exam_id=exam5.id, question_text="Which tool allows Unix tools (like Nmap, Curl, SQLmap) to tunnel their TCP connections through SOCKS and HTTP proxies?", question_type="mcq", options=["Proxychains", "Netcat", "Socat", "Iptables"], correct_answer="0", explanation="Proxychains hooks socket functions in dynamically linked programs to redirect all connections through configured proxies.", points=5, sort_order=16),
            models.ExamQuestion(exam_id=exam5.id, question_text="In SQLmap, which command-line switch directly spawns an interactive operating system command shell on vulnerable database servers?", question_type="mcq", options=["--os-shell", "--dbs", "--dump-all", "--batch"], correct_answer="0", explanation="--os-shell exploits database capabilities (xp_cmdshell, UDF injection, or web file upload) to spawn a system terminal.", points=5, sort_order=17),
            models.ExamQuestion(exam_id=exam5.id, question_text="What technique alters binary code structure using polymorphic engines to evade static antivirus signature detection?", question_type="mcq", options=["Polymorphism and Shellcode Encoders (e.g. shikata_ga_nai)", "Static Linking", "UPX Compression only", "Stripping debug symbols"], correct_answer="0", explanation="Polymorphic encryption engines change decryptor stubs on every iteration to defeat static hash and signature matches.", points=5, sort_order=18),
            models.ExamQuestion(exam_id=exam5.id, question_text="What Windows command clears the Security event log to cover tracks during unauthorized post-exploitation?", question_type="mcq", options=["wevtutil cl Security", "del /f C:\\Windows\\System32\\winevt\\Logs\\Security.evtx", "sc stop eventlog", "net stop audit"], correct_answer="0", explanation="wevtutil cl Security clears the Windows Security event log via administrative APIs.", points=5, sort_order=19),
            models.ExamQuestion(exam_id=exam5.id, question_text="What is a 'living-off-the-land' binary (LOLBin)?", question_type="mcq", options=["A legitimate, pre-installed operating system binary (e.g. certutil, powershell, bitsadmin) used for malicious execution or download", "A custom compiled C++ rootkit", "An open-source exploit compiler", "A vulnerable third-party browser plugin"], correct_answer="0", explanation="LOLBins are trusted, signed system binaries leveraged by attackers to evade detection without dropping custom malware.", points=5, sort_order=20),
        ]
        for q in questions5:
            db.add(q)

    db.commit()

@router.get("", response_model=List[schemas.ExamResponse])
def list_all_exams(db: Session = Depends(get_db)):
    seed_default_exams_if_empty(db)
    exams = db.query(models.Exam).filter(models.Exam.is_published == True).all()
    result = []
    for ex in exams:
        q_count = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == ex.id).count()
        result.append(schemas.ExamResponse(
            id=ex.id,
            course_id=ex.course_id,
            title=ex.title,
            description=ex.description,
            duration_minutes=ex.duration_minutes,
            passing_score_pct=ex.passing_score_pct,
            total_marks=ex.total_marks,
            is_published=ex.is_published,
            question_count=q_count,
            created_at=ex.created_at
        ))
    return result

@router.get("/course/{course_id}", response_model=Optional[schemas.ExamDetailResponse])
def get_course_exam(course_id: str, db: Session = Depends(get_db)):
    seed_default_exams_if_empty(db)
    exam = db.query(models.Exam).filter(
        models.Exam.course_id == course_id,
        models.Exam.is_published == True
    ).order_by(models.Exam.created_at.desc()).first()

    if not exam:
        return None

    questions = db.query(models.ExamQuestion).filter(
        models.ExamQuestion.exam_id == exam.id
    ).order_by(models.ExamQuestion.sort_order.asc()).all()

    return schemas.ExamDetailResponse(
        id=exam.id,
        course_id=exam.course_id,
        title=exam.title,
        description=exam.description,
        duration_minutes=exam.duration_minutes,
        passing_score_pct=exam.passing_score_pct,
        total_marks=exam.total_marks,
        is_published=exam.is_published,
        question_count=len(questions),
        created_at=exam.created_at,
        questions=[
            schemas.ExamQuestionPublicResponse(
                id=q.id,
                exam_id=q.exam_id,
                question_text=q.question_text,
                question_type=q.question_type,
                options=q.options or [],
                points=q.points,
                sort_order=q.sort_order
            )
            for q in questions
        ]
    )

@router.get("/{exam_id}", response_model=schemas.ExamDetailResponse)
def get_exam_details(exam_id: str, db: Session = Depends(get_db)):
    seed_default_exams_if_empty(db)
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found."
        )

    questions = db.query(models.ExamQuestion).filter(
        models.ExamQuestion.exam_id == exam.id
    ).order_by(models.ExamQuestion.sort_order.asc()).all()

    return schemas.ExamDetailResponse(
        id=exam.id,
        course_id=exam.course_id,
        title=exam.title,
        description=exam.description,
        duration_minutes=exam.duration_minutes,
        passing_score_pct=exam.passing_score_pct,
        total_marks=exam.total_marks,
        is_published=exam.is_published,
        question_count=len(questions),
        created_at=exam.created_at,
        questions=[
            schemas.ExamQuestionPublicResponse(
                id=q.id,
                exam_id=q.exam_id,
                question_text=q.question_text,
                question_type=q.question_type,
                options=q.options or [],
                points=q.points,
                sort_order=q.sort_order
            )
            for q in questions
        ]
    )

@router.post("/{exam_id}/submit", response_model=schemas.ExamSubmissionResponse)
def submit_exam(
    exam_id: str,
    submission: schemas.ExamSubmitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    exam = db.query(models.Exam).filter(models.Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exam not found."
        )

    questions = db.query(models.ExamQuestion).filter(models.ExamQuestion.exam_id == exam.id).all()
    total_possible_score = sum(q.points for q in questions) or 100
    user_score = 0
    breakdown = []

    submitted_map = {a.question_id: a.selected_answer for a in submission.answers}

    for q in questions:
        selected = str(submitted_map.get(q.id, "")).strip()
        correct_ans = str(q.correct_answer).strip()
        is_correct = (selected == correct_ans)

        points_earned = q.points if is_correct else 0
        user_score += points_earned

        breakdown.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "selected": selected,
            "correct_answer": correct_ans,
            "is_correct": is_correct,
            "points_earned": points_earned,
            "points_possible": q.points,
            "explanation": q.explanation
        })

    score_pct = round((user_score / total_possible_score) * 100, 2)
    passed = score_pct >= exam.passing_score_pct

    cert_token = None
    is_verified = (current_user.verification_status == "verified")

    if passed:
        # Mandatory Rule: Certificate is only minted if ID verification is completed!
        if is_verified:
            existing_cert = db.query(models.Certificate).filter(
                models.Certificate.user_id == current_user.id,
                models.Certificate.exam_id == exam.id
            ).first()

            if not existing_cert:
                code_prefix = "".join([w[0] for w in exam.title.split() if w.isalpha()]).upper()[:6]
                cert_token = f"CERT-{code_prefix}-{uuid.uuid4().hex[:8].upper()}"
                
                # Award Exam Passing XP
                current_user.xp += 800

                new_cert = models.Certificate(
                    user_id=current_user.id,
                    course_id=exam.course_id,
                    exam_id=exam.id,
                    score_pct=score_pct,
                    certificate_type="exam_certified",
                    verification_token=cert_token,
                    issued_at=datetime.now(timezone.utc)
                )
                db.add(new_cert)
            else:
                cert_token = existing_cert.verification_token
                existing_cert.score_pct = max(float(existing_cert.score_pct or 0), score_pct)

    # Save Exam Submission Record
    db_submission = models.ExamSubmission(
        exam_id=exam.id,
        user_id=current_user.id,
        score=user_score,
        total_score=total_possible_score,
        score_pct=score_pct,
        passed=passed,
        answers=submitted_map,
        certificate_token=cert_token,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)

    return schemas.ExamSubmissionResponse(
        id=db_submission.id,
        exam_id=exam.id,
        user_id=current_user.id,
        score=float(user_score),
        total_score=float(total_possible_score),
        score_pct=float(score_pct),
        passed=passed,
        certificate_token=cert_token,
        submitted_at=db_submission.submitted_at,
        breakdown=breakdown
    )

@router.get("/submissions/my")
def get_my_exam_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    submissions = db.query(models.ExamSubmission).filter(
        models.ExamSubmission.user_id == current_user.id
    ).order_by(models.ExamSubmission.submitted_at.desc()).all()

    result = []
    for s in submissions:
        result.append({
            "id": s.id,
            "exam_id": s.exam_id,
            "exam_title": s.exam.title if s.exam else "Exam",
            "score": float(s.score),
            "total_score": float(s.total_score),
            "score_pct": float(s.score_pct),
            "passed": s.passed,
            "certificate_token": s.certificate_token,
            "submitted_at": s.submitted_at.strftime("%B %d, %Y %I:%M %p")
        })
    return result
