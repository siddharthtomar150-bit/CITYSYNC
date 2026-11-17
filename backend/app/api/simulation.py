from fastapi import APIRouter, Body
from typing import Dict, Any

from app.services.simulation_engine import simulation_engine

router = APIRouter(prefix="/simulation", tags=["Simulation Engine"])

@router.get("/status")
def get_simulation_status():
    """Get current status of background telemetry generator and crisis mode."""
    return {
        "is_running": simulation_engine.is_running,
        "interval_seconds": simulation_engine.interval_seconds,
        "total_cycles_run": simulation_engine.total_cycles_run,
        "crisis_mode_active": simulation_engine.crisis_mode,
        "crisis_step": simulation_engine.crisis_step
    }

@router.post("/start")
async def start_simulation():
    """Start background periodic telemetry generation."""
    await simulation_engine.start()
    return {"status": "started", "interval_seconds": simulation_engine.interval_seconds}

@router.post("/stop")
async def stop_simulation():
    """Pause background periodic telemetry generation."""
    await simulation_engine.stop()
    return {"status": "stopped"}

@router.post("/crisis")
async def trigger_crisis_demonstration():
    """Trigger the dedicated 10-step Hackathon Crisis Simulation sequence."""
    res = await simulation_engine.trigger_full_crisis_simulation()
    return res

@router.post("/reset")
async def reset_demo_state():
    """Reset simulation, normalize infrastructure nodes, and resolve demo alerts."""
    res = await simulation_engine.reset_simulation()
    return res
