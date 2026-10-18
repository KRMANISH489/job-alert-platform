import base64
import hashlib
import hmac
import json
import time
from pathlib import Path


def load_secret() -> str:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("AUTH_SECRET="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return "jobalert-local-dev-secret"


SECRET = load_secret()


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def decode_token(token: str) -> str | None:
    body, separator, signature = token.partition(".")
    if not body or not separator or not signature:
        return None
    expected = _b64encode(hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(expected, signature):
        return None
    try:
        data = json.loads(_b64decode(body))
    except (ValueError, json.JSONDecodeError):
        return None
    user_id = data.get("userId")
    exp = data.get("exp")
    if not isinstance(user_id, str) or not isinstance(exp, (int, float)) or exp < time.time() * 1000:
        return None
    return user_id
