import bcrypt
import hashlib
import hmac
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any
from app.core.config import settings

def hash_password(password: str) -> str:
    """Hash password using bcrypt or pbkdf2 fallback."""
    try:
        salt = bcrypt.gensalt(rounds=12)
        pwd_bytes = password.encode('utf-8')[:72]
        return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    except Exception:
        # Fallback to PBKDF2-HMAC-SHA256
        salt = b"citysync_secure_salt_2026"
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return "pbkdf2$" + key.hex()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    try:
        if hashed_password.startswith("pbkdf2$"):
            stored_hex = hashed_password.split("$", 1)[1]
            salt = b"citysync_secure_salt_2026"
            key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
            return hmac.compare_digest(key.hex(), stored_hex)
        
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None
