import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.logger import logger
from app.database.session import engine, Base
from app.models.models import * # Ensure all models are registered
from app.websocket.connection_manager import manager
from app.services.simulation_engine import simulation_engine
from ml.service import ml_service

# Routers
from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.map import router as map_router
from app.api.traffic import router as traffic_router
from app.api.electricity import router as electricity_router
from app.api.water import router as water_router
from app.api.incidents import router as incidents_router
from app.api.anomalies import router as anomalies_router
from app.api.recommendations import router as recommendations_router
from app.api.ml_routes import router as ml_router
from app.api.simulation import router as simulation_router
from app.api.reports import router as reports_router
from app.api.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    logger.info("Initializing CITYSYNC Smart City Intelligence Platform...")
    # 1. Create database schema
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created.")

    # 2. Seed data if needed
    try:
        from seed_data import seed_database
        seed_database()
    except Exception as e:
        logger.warning(f"Database seed note: {e}")

    # 3. Load Machine Learning Models
    try:
        ml_service.load_models()
        logger.info("Machine Learning service initialized.")
    except Exception as e:
        logger.error(f"ML Service init error: {e}")

    # 4. Start background simulation loop
    if settings.SIMULATION_AUTO_START:
        await simulation_engine.start()

    yield

    # --- SHUTDOWN ---
    logger.info("Shutting down CITYSYNC...")
    await simulation_engine.stop()

app = FastAPI(
    title="CITYSYNC – Smart City Intelligence, Monitoring & Predictive Decision Platform",
    description="Full-stack hackathon command center integrating Traffic, Grid, Water, Cross-System Cascading Intelligence, and Machine Learning.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_V1_PREFIX)
app.include_router(map_router, prefix=settings.API_V1_PREFIX)
app.include_router(traffic_router, prefix=settings.API_V1_PREFIX)
app.include_router(electricity_router, prefix=settings.API_V1_PREFIX)
app.include_router(water_router, prefix=settings.API_V1_PREFIX)
app.include_router(incidents_router, prefix=settings.API_V1_PREFIX)
app.include_router(anomalies_router, prefix=settings.API_V1_PREFIX)
app.include_router(recommendations_router, prefix=settings.API_V1_PREFIX)
app.include_router(ml_router, prefix=settings.API_V1_PREFIX)
app.include_router(simulation_router, prefix=settings.API_V1_PREFIX)
app.include_router(reports_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)

# WebSocket Endpoint for Live Telemetry & Crisis Events
@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open and receive optional client heartbeats / commands
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)

# Mount Frontend static files
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

    @app.get("/")
    def serve_frontend():
        index_file = frontend_dir / "index.html"
        if index_file.exists():
            return FileResponse(
                str(index_file),
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            )
        return {"message": "CITYSYNC API Online. Frontend index.html not found."}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "platform": "CITYSYNC Smart City Intelligence Platform",
        "version": "1.0.0",
        "simulation_running": simulation_engine.is_running,
        "active_clients": len(manager.active_connections)
    }
