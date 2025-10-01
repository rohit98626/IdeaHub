"""
Users API endpoints
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId

from app.models.user import User, UserCreate, UserUpdate, Token, TokenData
from app.core.database import get_collection
from app.core.config import settings

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(security)) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    users_collection = get_collection("users")
    user = await users_collection.find_one({"username": token_data.username})
    if user is None:
        raise credentials_exception
    
    # Convert ObjectId to string for Pydantic validation
    if "_id" in user:
        user["_id"] = str(user["_id"])
    
    return User(**user)


@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        users_collection = get_collection("users")
        
        # Check if user already exists
        existing_user = await users_collection.find_one({
            "$or": [
                {"email": user_data.email},
                {"username": user_data.username}
            ]
        })
        
        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="User with this email or username already exists"
            )
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user document
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "hashed_password": hashed_password,
            "is_active": True,
            "is_verified": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert user
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = str(result.inserted_id)
        del user_doc["hashed_password"]  # Don't return password hash
        
        return User(**user_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to register user")


@router.post("/login", response_model=Token)
async def login_user(email: str = Query(...), password: str = Query(...)):
    """Login user and return access token"""
    try:
        users_collection = get_collection("users")
        
        # Find user by email
        user = await users_collection.find_one({"email": email})
        
        # Debug logging
        print(f"Login attempt for email: {email}")
        print(f"User found: {user is not None}")
        if user:
            print(f"User active: {user.get('is_active', False)}")
            print(f"User verified: {user.get('is_verified', False)}")
        
        if not user:
            print("User not found in database")
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password"
            )
        
        # Verify password
        password_valid = verify_password(password, user["hashed_password"])
        print(f"Password valid: {password_valid}")
        
        if not password_valid:
            print("Password verification failed")
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password"
            )
        
        if not user["is_active"]:
            print("User is inactive")
            raise HTTPException(
                status_code=400,
                detail="Inactive user"
            )
        
        print("Login successful, creating token")
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["username"]}, expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to login")


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.put("/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user information"""
    try:
        users_collection = get_collection("users")
        
        # Prepare update data
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        
        # Hash password if provided
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        update_data["updated_at"] = datetime.utcnow()
        
        # Update user
        await users_collection.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": update_data}
        )
        
        # Fetch updated user
        updated_user = await users_collection.find_one({"_id": ObjectId(current_user.id)})
        del updated_user["hashed_password"]  # Don't return password hash
        
        # Convert ObjectId to string for Pydantic validation
        if "_id" in updated_user:
            updated_user["_id"] = str(updated_user["_id"])
        
        return User(**updated_user)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update user")


@router.get("/stats")
async def get_user_stats(current_user: User = Depends(get_current_user)):
    """Get user statistics"""
    try:
        ideas_collection = get_collection("ideas")
        clusters_collection = get_collection("clusters")
        
        # Count ideas
        idea_count = await ideas_collection.count_documents({"user_id": current_user.id})
        
        # Count clusters
        cluster_count = await clusters_collection.count_documents({"user_id": current_user.id})
        
        # Get average novelty score
        pipeline = [
            {"$match": {"user_id": current_user.id, "novelty_score": {"$exists": True}}},
            {"$group": {"_id": None, "avg_novelty": {"$avg": "$novelty_score"}}}
        ]
        novelty_result = await ideas_collection.aggregate(pipeline).to_list(1)
        avg_novelty = novelty_result[0]["avg_novelty"] if novelty_result else 0.0
        
        return {
            "total_ideas": idea_count,
            "total_clusters": cluster_count,
            "average_novelty_score": round(avg_novelty, 3),
            "user_since": current_user.created_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get user stats")
