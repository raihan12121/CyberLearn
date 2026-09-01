import httpx
import logging
from typing import Dict, Any, Optional
from ..config import settings

logger = logging.getLogger(__name__)

def get_oauth_authorize_url(provider: str, redirect_uri: Optional[str] = None) -> str:
    cb_uri = redirect_uri or f"{settings.FRONTEND_URL}/auth/callback"
    provider = provider.lower()

    if provider == "google":
        if not settings.GOOGLE_CLIENT_ID:
            # Fallback to direct client demo callback
            return f"{cb_uri}?provider=google&code=demo_google_code_123"
        return (
            "https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={settings.GOOGLE_CLIENT_ID}&"
            f"redirect_uri={cb_uri}&"
            "response_type=code&"
            "scope=openid%20email%20profile&"
            "prompt=select_account"
        )
    elif provider == "github":
        if not settings.GITHUB_CLIENT_ID:
            # Fallback to direct client demo callback
            return f"{cb_uri}?provider=github&code=demo_github_code_123"
        return (
            "https://github.com/login/oauth/authorize?"
            f"client_id={settings.GITHUB_CLIENT_ID}&"
            f"redirect_uri={cb_uri}&"
            "scope=user:email"
        )
    else:
        raise ValueError(f"Unsupported OAuth provider: {provider}")

async def exchange_code_for_user_info(provider: str, code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
    cb_uri = redirect_uri or f"{settings.FRONTEND_URL}/auth/callback"
    provider = provider.lower()

    # Support local development demo OAuth callback only for explicit demo tokens
    if code in ["demo_google_code_123", "demo_github_code_123"]:
        logger.info(f"Using local development demo OAuth flow for provider: {provider}")
        return {
            "email": f"{provider}_user@cyberlearn.io",
            "full_name": f"{provider.capitalize()} Student",
            "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={provider}",
            "provider": provider
        }

    if (provider == "google" and not settings.GOOGLE_CLIENT_SECRET) or (provider == "github" and not settings.GITHUB_CLIENT_SECRET):
        raise ValueError(f"OAuth credentials for {provider} are not configured on this server.")

    async with httpx.AsyncClient() as client:
        if provider == "google":
            # Exchange code for token with Google
            token_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": cb_uri,
                    "grant_type": "authorization_code",
                }
            )
            token_json = token_res.json()
            access_token = token_json.get("access_token")
            if not access_token:
                raise ValueError("Failed to retrieve access token from Google.")

            # Fetch Google user profile
            user_res = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            user_json = user_res.json()
            return {
                "email": user_json.get("email"),
                "full_name": user_json.get("name") or user_json.get("given_name"),
                "avatar_url": user_json.get("picture"),
                "provider": "google"
            }

        elif provider == "github":
            # Exchange code for token with GitHub
            token_res = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": cb_uri,
                },
                headers={"Accept": "application/json"}
            )
            token_json = token_res.json()
            access_token = token_json.get("access_token")
            if not access_token:
                raise ValueError("Failed to retrieve access token from GitHub.")

            # Fetch GitHub user profile
            user_res = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )
            user_json = user_res.json()
            email = user_json.get("email")

            # If GitHub user email is private, fetch from /user/emails endpoint
            if not email:
                emails_res = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                emails_json = emails_res.json()
                primary_email = next((e["email"] for e in emails_json if e.get("primary")), None)
                email = primary_email or (emails_json[0]["email"] if emails_json else f"{user_json.get('login')}@users.noreply.github.com")

            return {
                "email": email,
                "full_name": user_json.get("name") or user_json.get("login"),
                "avatar_url": user_json.get("avatar_url"),
                "provider": "github"
            }
        else:
            raise ValueError(f"Unsupported provider: {provider}")
