from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import datetime

from app.database.session import get_db
from app.models.models import User
from app.schemas.schemas import UserLogin, UserCreate, Token, UserOut
from app.core.security import verify_password, hash_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account with role validation."""
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )

    valid_roles = ["super_admin", "admin", "traffic", "electricity", "water"]
    role = user_in.role if user_in.role in valid_roles else "admin"

    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=role,
        department=user_in.department or "Municipal Administration"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.username, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with username/email and password."""
    user = db.query(User).filter(
        (User.username == credentials.username_or_email) |
        (User.email == credentials.username_or_email)
    ).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive"
        )

    access_token = create_access_token(subject=user.username, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    """Get current authenticated user profile."""
    return current_user

@router.post("/logout")
def logout():
    """Client session termination acknowledgement."""
    return {"status": "success", "message": "Logged out successfully"}

@router.get("/switch-role/{role}", response_model=Token)
def switch_demo_role(role: str, db: Session = Depends(get_db)):
    """Quick evaluator role switcher for hackathon judges (super_admin, admin, traffic, electricity, water)."""
    valid_roles = ["super_admin", "admin", "traffic", "electricity", "water"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of {valid_roles}"
        )

    user = db.query(User).filter(User.role == role).first()
    if not user:
        # Fallback to admin if specific seed user isn't found
        user = db.query(User).filter(User.role == "admin").first()

    access_token = create_access_token(subject=user.username, role=user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
