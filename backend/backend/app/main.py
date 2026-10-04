from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.availability import router as availability_router
from app.api.reservations import router as reservations_router
from app.api.restaurants import router as restaurants_router
from app.api.tables import router as tables_router
from app.api.users import router as users_router

app = FastAPI(
    title="Tablekeeper API",
    description="Restaurant reservation backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "tablekeeper-api",
    }