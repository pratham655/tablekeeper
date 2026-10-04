from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api.availability import router as availability_router
from app.api.reservations import router as reservations_router
from app.api.restaurants import router as restaurants_router
from app.api.tables import router as tables_router
from app.api.users import router as users_router
from app.core.database import Base, SessionLocal, engine
import app.models  # Import all models to register with Base
from app.models.restaurant import Restaurant
from scripts.seed_database import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup if not already created
    try:
        Base.metadata.create_all(bind=engine)
        # Check if database needs seeding
        with SessionLocal() as db:
            existing = db.scalars(select(Restaurant)).first()
            if not existing:
                print("Database tables created. Seeding initial data...")
                seed_database()
            else:
                print("Database connected. Existing data present.")
    except Exception as e:
        print(f"Startup database check warning: {e}")
    yield


app = FastAPI(
    title="Tablekeeper API",
    description="Restaurant reservation backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration
allowed_origins_raw = os.getenv("ALLOWED_ORIGINS") or os.getenv("CORS_ORIGINS") or "*"
if allowed_origins_raw == "*" or allowed_origins_raw == "":
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex="https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(restaurants_router)
app.include_router(users_router)
app.include_router(tables_router)
app.include_router(availability_router)
app.include_router(reservations_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Tablekeeper API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "tablekeeper-api",
    }