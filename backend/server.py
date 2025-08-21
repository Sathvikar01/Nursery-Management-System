from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Shree Krishna Nursery Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Utility Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"username": username})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: "User" = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    full_name: str
    role: str  # admin, manager, cashier
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    password: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class Plant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    variants: List[str] = []
    current_stock: int
    min_stock_threshold: int = 10
    cost_price: float
    selling_price: float
    investment: float
    location: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PlantCreate(BaseModel):
    name: str
    category: str
    variants: List[str] = []
    current_stock: int
    min_stock_threshold: int = 10
    cost_price: float
    selling_price: float
    investment: float
    location: str
    description: Optional[str] = None

class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None

class BillItem(BaseModel):
    plant_id: str
    plant_name: str
    variant: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float

class Bill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bill_number: str
    customer_id: str
    customer_name: str
    items: List[BillItem]
    subtotal: float
    tax: float = 0
    discount: float = 0
    total_amount: float
    payment_method: str  # cash, online, both
    status: str = "pending"  # pending, approved, completed
    created_by: str  # user_id
    approved_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BillCreate(BaseModel):
    customer_id: str
    items: List[BillItem]
    tax: float = 0
    discount: float = 0
    payment_method: str

class Quotation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quotation_number: str
    customer_id: str
    customer_name: str
    items: List[BillItem]
    subtotal: float
    tax: float = 0
    discount: float = 0
    total_amount: float
    valid_until: datetime
    status: str = "active"  # active, expired, converted
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuotationCreate(BaseModel):
    customer_id: str
    items: List[BillItem]
    tax: float = 0
    discount: float = 0
    valid_days: int = 30

# Authentication Routes
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate, current_user: User = Depends(require_role(["admin"]))):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"username": user_data.username}, {"email": user_data.email}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict['password']
    user_obj = User(**user_dict)
    
    user_doc = user_obj.dict()
    user_doc['hashed_password'] = hashed_password
    
    await db.users.insert_one(user_doc)
    return user_obj

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"username": user_credentials.username})
    if not user or not verify_password(user_credentials.password, user.get('hashed_password')):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['username']}, expires_delta=access_token_expires
    )
    
    user_obj = User(**user)
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Plant Management Routes
@api_router.post("/plants", response_model=Plant)
async def create_plant(plant_data: PlantCreate, current_user: User = Depends(require_role(["admin", "manager"]))):
    plant_obj = Plant(**plant_data.dict())
    await db.plants.insert_one(plant_obj.dict())
    return plant_obj

@api_router.get("/plants", response_model=List[Plant])
async def get_plants(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user)):
    plants = await db.plants.find().skip(skip).limit(limit).to_list(limit)
    return [Plant(**plant) for plant in plants]

@api_router.get("/plants/low-stock", response_model=List[Plant])
async def get_low_stock_plants(current_user: User = Depends(get_current_user)):
    plants = await db.plants.find({"$expr": {"$lte": ["$current_stock", "$min_stock_threshold"]}}).to_list(1000)
    return [Plant(**plant) for plant in plants]

@api_router.get("/plants/{plant_id}", response_model=Plant)
async def get_plant(plant_id: str, current_user: User = Depends(get_current_user)):
    plant = await db.plants.find_one({"id": plant_id})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return Plant(**plant)

# Customer Management Routes
@api_router.post("/customers", response_model=Customer)
async def create_customer(customer_data: CustomerCreate, current_user: User = Depends(get_current_user)):
    customer_obj = Customer(**customer_data.dict())
    await db.customers.insert_one(customer_obj.dict())
    return customer_obj

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user)):
    customers = await db.customers.find().skip(skip).limit(limit).to_list(limit)
    return [Customer(**customer) for customer in customers]

@api_router.get("/customers/search")
async def search_customers(q: str, current_user: User = Depends(get_current_user)):
    customers = await db.customers.find({
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]
    }).limit(10).to_list(10)
    return [Customer(**customer) for customer in customers]

# Bill Management Routes
@api_router.post("/bills", response_model=Bill)
async def create_bill(bill_data: BillCreate, current_user: User = Depends(get_current_user)):
    # Get customer details
    customer = await db.customers.find_one({"id": bill_data.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Calculate totals
    subtotal = sum(item.total_price for item in bill_data.items)
    total_amount = subtotal + bill_data.tax - bill_data.discount
    
    # Generate bill number
    bill_count = await db.bills.count_documents({}) + 1
    bill_number = f"SKN-{bill_count:06d}"
    
    bill_obj = Bill(
        bill_number=bill_number,
        customer_id=bill_data.customer_id,
        customer_name=customer['name'],
        items=bill_data.items,
        subtotal=subtotal,
        tax=bill_data.tax,
        discount=bill_data.discount,
        total_amount=total_amount,
        payment_method=bill_data.payment_method,
        created_by=current_user.id,
        status="pending" if current_user.role == "cashier" else "approved"
    )
    
    await db.bills.insert_one(bill_obj.dict())
    return bill_obj

@api_router.get("/bills", response_model=List[Bill])
async def get_bills(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user)):
    bills = await db.bills.find().skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    return [Bill(**bill) for bill in bills]

@api_router.get("/bills/pending", response_model=List[Bill])
async def get_pending_bills(current_user: User = Depends(require_role(["admin"]))):
    bills = await db.bills.find({"status": "pending"}).sort("created_at", -1).to_list(100)
    return [Bill(**bill) for bill in bills]

@api_router.put("/bills/{bill_id}/approve")
async def approve_bill(bill_id: str, current_user: User = Depends(require_role(["admin"]))):
    result = await db.bills.update_one(
        {"id": bill_id},
        {"$set": {"status": "approved", "approved_by": current_user.id}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
    return {"message": "Bill approved successfully"}

# Quotation Management Routes
@api_router.post("/quotations", response_model=Quotation)
async def create_quotation(quotation_data: QuotationCreate, current_user: User = Depends(get_current_user)):
    customer = await db.customers.find_one({"id": quotation_data.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    subtotal = sum(item.total_price for item in quotation_data.items)
    total_amount = subtotal + quotation_data.tax - quotation_data.discount
    
    quotation_count = await db.quotations.count_documents({}) + 1
    quotation_number = f"SKN-Q-{quotation_count:06d}"
    
    valid_until = datetime.now(timezone.utc) + timedelta(days=quotation_data.valid_days)
    
    quotation_obj = Quotation(
        quotation_number=quotation_number,
        customer_id=quotation_data.customer_id,
        customer_name=customer['name'],
        items=quotation_data.items,
        subtotal=subtotal,
        tax=quotation_data.tax,
        discount=quotation_data.discount,
        total_amount=total_amount,
        valid_until=valid_until,
        created_by=current_user.id
    )
    
    await db.quotations.insert_one(quotation_obj.dict())
    return quotation_obj

@api_router.get("/quotations", response_model=List[Quotation])
async def get_quotations(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user)):
    quotations = await db.quotations.find().skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    return [Quotation(**quotation) for quotation in quotations]

# Dashboard Analytics Routes
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user)):
    # Total sales
    total_sales_pipeline = [
        {"$match": {"status": {"$ne": "pending"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    total_sales_result = await db.bills.aggregate(total_sales_pipeline).to_list(1)
    total_sales = total_sales_result[0]['total'] if total_sales_result else 0
    
    # Total plants
    total_plants = await db.plants.count_documents({})
    
    # Low stock alerts
    low_stock_count = await db.plants.count_documents({"$expr": {"$lte": ["$current_stock", "$min_stock_threshold"]}})
    
    # Recent bills
    recent_bills = await db.bills.find().sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "total_sales": total_sales,
        "total_plants": total_plants,
        "low_stock_alerts": low_stock_count,
        "recent_bills": [Bill(**bill) for bill in recent_bills]
    }

# Initialize admin user
@api_router.post("/init-admin")
async def initialize_admin():
    admin_exists = await db.users.find_one({"role": "admin"})
    if admin_exists:
        return {"message": "Admin already exists"}
    
    admin_user = User(
        username="admin",
        email="admin@shreekrishnanursery.com",
        full_name="System Administrator",
        role="admin"
    )
    
    admin_doc = admin_user.dict()
    admin_doc['hashed_password'] = get_password_hash("admin123")
    
    await db.users.insert_one(admin_doc)
    return {"message": "Admin user created successfully", "username": "admin", "password": "admin123"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()