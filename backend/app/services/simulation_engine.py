"""
CITYSYNC - Background Simulation & Crisis Demonstration Engine
Generates live, physically-grounded municipal telemetry streams, runs anomaly checks,
triggers cross-system dependency analysis, and powers the 10-step Hackathon Crisis Simulation.
"""
import asyncio
import random
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logger import logger
from app.database.session import SessionLocal
from app.models.models import (
    InfrastructureNode,
    TrafficReading,
    ElectricityReading,
    WaterReading,
    Anomaly,
    Incident,
    Recommendation,
    SystemEvent
)
from app.analytics.anomaly_detection import anomaly_detector
from app.services.cross_system_engine import cross_system_engine
from app.services.recommendation_service import recommendation_service
from app.websocket.connection_manager import manager

class SimulationEngine:
    def __init__(self):
        self.is_running: bool = False
        self.interval_seconds: int = settings.SIMULATION_INTERVAL_SECONDS
        self.total_cycles_run: int = 0
        self.crisis_mode: bool = False
        self.crisis_step: int = 0
        self.crisis_task: Optional[asyncio.Task] = None
        self._bg_task: Optional[asyncio.Task] = None

    async def start(self):
        if not self.is_running:
            self.is_running = True
            self._bg_task = asyncio.create_task(self._simulation_loop())
            logger.info("Simulation background telemetry loop started.")

    async def stop(self):
        self.is_running = False
        if self._bg_task:
            self._bg_task.cancel()
            self._bg_task = None
        logger.info("Simulation background loop stopped.")

    async def _simulation_loop(self):
        while self.is_running:
            try:
                await self.generate_telemetry_cycle()
                self.total_cycles_run += 1
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error during simulation cycle: {e}")
            await asyncio.sleep(self.interval_seconds)

    async def generate_telemetry_cycle(self) -> Dict[str, Any]:
        """Generate one cycle of readings for all infrastructure nodes."""
        db: Session = SessionLocal()
        new_anomalies = []
        cycle_payload = {
            "type": "TELEMETRY_UPDATE",
            "cycle": self.total_cycles_run,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "traffic": [],
            "electricity": [],
            "water": [],
            "anomalies": [],
            "cross_impacts": []
        }

        try:
            nodes = db.query(InfrastructureNode).all()
            if not nodes:
                return cycle_payload

            hour = datetime.datetime.now(datetime.timezone.utc).hour
            is_peak = (7 <= hour <= 9 or 17 <= hour <= 19)

            for node in nodes:
                if node.category == "traffic":
                    # Generate traffic telemetry
                    if self.crisis_mode and self.crisis_step >= 1 and ("Silk Board" in node.name or "Downtown" in node.name or "Central" in node.name):
                        congestion = round(random.uniform(88.0, 96.0), 1)
                        speed = round(random.uniform(10.0, 16.0), 1)
                        flow = int(random.uniform(1400, 1800))
                    else:
                        base = 65.0 if is_peak else 38.0
                        congestion = round(max(5.0, min(80.0, base + random.uniform(-8.0, 8.0))), 1)
                        speed = round(max(20.0, 68.0 - (congestion * 0.55) + random.uniform(-3, 3)), 1)
                        flow = int(800 + (congestion * 11) + random.uniform(-40, 40))
                        
                    road_occ = round(congestion * 0.9, 1)

                    reading = TrafficReading(
                        node_id=node.id,
                        congestion_level=congestion,
                        vehicle_flow=flow,
                        avg_speed_kmh=speed,
                        road_occupancy_pct=road_occ,
                        is_peak_hour=is_peak,
                        timestamp=datetime.datetime.now(datetime.timezone.utc),
                        simulated=True
                    )
                    db.add(reading)
                    
                    # Anomaly check
                    anom = anomaly_detector.check_traffic_anomaly(
                        node.id, node.name, node.sector, congestion, speed, is_peak
                    )
                    if anom:
                        db_anom = Anomaly(
                            event_type=anom["event_type"],
                            category="traffic",
                            node_id=node.id,
                            location_name=anom["location_name"],
                            sector=anom["sector"],
                            severity=anom["severity"],
                            current_value=anom["current_value"],
                            baseline_value=anom["baseline_value"],
                            deviation_pct=anom["deviation_pct"],
                            explanation=anom["explanation"],
                            recommended_action=anom["recommended_action"],
                            timestamp=datetime.datetime.now(datetime.timezone.utc)
                        )
                        db.add(db_anom)
                        new_anomalies.append(anom)
                        node.status = "critical" if anom["severity"] == "critical" else "warning"

                    cycle_payload["traffic"].append({
                        "node_id": node.id,
                        "name": node.name,
                        "sector": node.sector,
                        "congestion": congestion,
                        "speed": speed,
                        "flow": flow,
                        "status": node.status
                    })

                elif node.category == "electricity":
                    capacity = node.capacity or 100.0
                    if self.crisis_mode and self.crisis_step >= 4 and ("Electronic City" in node.name or "Peenya" in node.name or "Industrial" in node.name):
                        demand = round(capacity * random.uniform(0.94, 0.99), 1)
                        grid_load = round((demand / capacity) * 100, 1)
                        temp = round(random.uniform(82.0, 88.0), 1)
                    elif self.crisis_mode and self.crisis_step >= 5 and ("Electronic City" in node.name or "Peenya" in node.name or "Industrial" in node.name):
                        demand = 4.2  # Feeder trip
                        grid_load = 4.2
                        temp = 62.0
                    else:
                        demand = round(capacity * random.uniform(0.55, 0.78), 1)
                        grid_load = round((demand / capacity) * 100, 1)
                        temp = round(48.0 + (demand * 0.2) + random.uniform(-1, 1), 1)

                    is_overload = grid_load >= 90.0
                    reading = ElectricityReading(
                        node_id=node.id,
                        power_demand_mw=demand,
                        grid_load_pct=grid_load,
                        voltage_kv=11.0,
                        frequency_hz=round(50.0 + random.uniform(-0.05, 0.05), 2),
                        transformer_temp_c=temp,
                        is_overloaded=is_overload,
                        timestamp=datetime.datetime.now(datetime.timezone.utc),
                        simulated=True
                    )
                    db.add(reading)

                    anom = anomaly_detector.check_electricity_anomaly(
                        node.id, node.name, node.sector, demand, grid_load, temp, capacity
                    )
                    if anom:
                        db_anom = Anomaly(
                            event_type=anom["event_type"],
                            category="electricity",
                            node_id=node.id,
                            location_name=anom["location_name"],
                            sector=anom["sector"],
                            severity=anom["severity"],
                            current_value=anom["current_value"],
                            baseline_value=anom["baseline_value"],
                            deviation_pct=anom["deviation_pct"],
                            explanation=anom["explanation"],
                            recommended_action=anom["recommended_action"],
                            timestamp=datetime.datetime.now(datetime.timezone.utc)
                        )
                        db.add(db_anom)
                        new_anomalies.append(anom)
                        node.status = "critical" if anom["severity"] == "critical" else "warning"

                    cycle_payload["electricity"].append({
                        "node_id": node.id,
                        "name": node.name,
                        "sector": node.sector,
                        "demand_mw": demand,
                        "grid_load_pct": grid_load,
                        "temp_c": temp,
                        "status": node.status
                    })

                elif node.category == "water":
                    if self.crisis_mode and self.crisis_step >= 6 and ("Cauvery" in node.name or "Industrial" in node.name or "TG Halli" in node.name):
                        flow = 18.0  # collapsed flow
                        pressure = round(random.uniform(16.0, 21.0), 1)  # critical pressure drop
                    else:
                        flow = round(random.uniform(280.0, 380.0), 1)
                        pressure = round(random.uniform(52.0, 62.0), 1)

                    reading = WaterReading(
                        node_id=node.id,
                        water_flow_lps=flow,
                        pressure_psi=pressure,
                        reservoir_level_pct=78.0,
                        water_quality_index=94.5,
                        leak_suspected=(pressure < 32.0),
                        timestamp=datetime.datetime.now(datetime.timezone.utc),
                        simulated=True
                    )
                    db.add(reading)

                    anom = anomaly_detector.check_water_anomaly(
                        node.id, node.name, node.sector, pressure, flow, 78.0
                    )
                    if anom:
                        db_anom = Anomaly(
                            event_type=anom["event_type"],
                            category="water",
                            node_id=node.id,
                            location_name=anom["location_name"],
                            sector=anom["sector"],
                            severity=anom["severity"],
                            current_value=anom["current_value"],
                            baseline_value=anom["baseline_value"],
                            deviation_pct=anom["deviation_pct"],
                            explanation=anom["explanation"],
                            recommended_action=anom["recommended_action"],
                            timestamp=datetime.datetime.now(datetime.timezone.utc)
                        )
                        db.add(db_anom)
                        new_anomalies.append(anom)
                        node.status = "critical" if anom["severity"] == "critical" else "warning"

                    cycle_payload["water"].append({
                        "node_id": node.id,
                        "name": node.name,
                        "sector": node.sector,
                        "flow_lps": flow,
                        "pressure_psi": pressure,
                        "status": node.status
                    })

            db.commit()

            # Cross-System Dependency Evaluation
            active_incidents = db.query(Incident).filter(Incident.status != "resolved").all()
            inc_dicts = [{"title": inc.title, "category": inc.category, "sector": inc.sector} for inc in active_incidents]
            cross_impacts = cross_system_engine.analyze_cross_system_impacts(
                new_anomalies, inc_dicts, {}
            )
            cycle_payload["cross_impacts"] = cross_impacts

            # Generate Smart Recommendations
            recommendation_service.generate_recommendations_from_events(db, cross_impacts, new_anomalies)

            cycle_payload["anomalies"] = new_anomalies

            # Broadcast over WebSocket to all open dashboards
            await manager.broadcast(cycle_payload)

        except Exception as e:
            db.rollback()
            logger.error(f"Simulation cycle error: {e}")
        finally:
            db.close()

        return cycle_payload

    # ==========================================
    # HACKATHON CRISIS SIMULATION DEMONSTRATION
    # 10-Step Deterministic Sequence
    # ==========================================

    async def trigger_full_crisis_simulation(self):
        """Runs the complete 10-step hackathon crisis sequence sequentially."""
        if self.crisis_task and not self.crisis_task.done():
            return {"status": "already_running", "step": self.crisis_step}
            
        self.crisis_mode = True
        self.crisis_step = 0
        self.crisis_task = asyncio.create_task(self._run_crisis_sequence())
        return {"status": "started", "message": "Crisis demonstration sequence initiated."}

    async def _run_crisis_sequence(self):
        crisis_steps_data = [
            {
                "step": 1,
                "title": "Silk Board Traffic Congestion Spikes",
                "system": "Traffic Network",
                "description": "Traffic congestion surges to 94% on Central Silk Board Junction & Hosur Road corridor due to peak IT commuter convergence.",
                "duration_seconds": 3
            },
            {
                "step": 2,
                "title": "Silk Board Collision Incident Opened",
                "system": "Traffic Intelligence",
                "description": "Multi-vehicle collision confirmed near Silk Board BTM ramp. Inbound flyover lanes blocked. Incident INC-CRISIS-001 opened.",
                "duration_seconds": 3
            },
            {
                "step": 3,
                "title": "Emergency Vehicle Delay Identified",
                "system": "Cross-System Intelligence",
                "description": "Silk Board gridlock traps BESCOM Emergency line crews & Fire units. Estimated response delay calculated: +28 minutes.",
                "duration_seconds": 3
            },
            {
                "step": 4,
                "title": "Electronic City Substation Surge",
                "system": "Electricity Grid",
                "description": "Electronic City 220kV Master Substation load surges to 97% capacity (155 MW). Transformer core temperature reaches 86°C.",
                "duration_seconds": 3
            },
            {
                "step": 5,
                "title": "Substation Feeder Breaker Trips",
                "system": "Electricity Grid",
                "description": "Overcurrent protection trips 66kV feeder breaker. Power cut to BWSSB Cauvery Stage IV High-Lift Pumping Station.",
                "duration_seconds": 3
            },
            {
                "step": 6,
                "title": "Cauvery Water Transmission Collapses",
                "system": "Water & Utilities",
                "description": "Cauvery high-lift pumping flow collapses from 420 MLD to 35 MLD. Distribution pressure drops to dangerous 18 PSI.",
                "duration_seconds": 3
            },
            {
                "step": 7,
                "title": "Cascading Dependency Correlated",
                "system": "Cross-System Innovation",
                "description": "CITYSYNC links: BESCOM Feeder Trip -> BWSSB Pump Halt -> Fire Hydrant Pressure Drop -> Silk Board Traffic traps BESCOM Fleet.",
                "duration_seconds": 3
            },
            {
                "step": 8,
                "title": "Multi-System Anomalies Raised",
                "system": "Anomaly Engine",
                "description": "Correlated critical anomalies triggered across BESCOM Power Grid, BWSSB Water SCADA, and BTP Traffic layers simultaneously.",
                "duration_seconds": 3
            },
            {
                "step": 9,
                "title": "Smart Decision Recommendations Generated",
                "system": "Decision Support",
                "description": "BTP green wave corridor opened for BESCOM fleet, auxiliary pump generators started at Torekadanahalli, traffic diverted to Ring Road.",
                "duration_seconds": 4
            },
            {
                "step": 10,
                "title": "Chief Administrator Resolves Crisis",
                "system": "Command Center Resolution",
                "description": "Auxiliary generators online, BESCOM breaker re-energized, Silk Board traffic cleared, Cauvery pressure restored to 56 PSI.",
                "duration_seconds": 2
            }
        ]

        db = SessionLocal()
        try:
            for item in crisis_steps_data:
                self.crisis_step = item["step"]
                logger.info(f"DEMO CRISIS STEP {self.crisis_step}: {item['title']}")

                # DB Actions per step
                if self.crisis_step == 2:
                    inc = db.query(Incident).filter(Incident.incident_number == "INC-CRISIS-001").first()
                    if not inc:
                        inc = Incident(
                            incident_number="INC-CRISIS-001",
                            title="Multi-Vehicle Collision on Central Silk Board Flyover",
                            category="traffic",
                            severity="critical",
                            status="open",
                            description="Heavy container freight truck and 2 passenger cars blocked lanes on Central Silk Board ramp. Heavy congestion spreading across Hosur Road.",
                            location_name="Central Silk Board Junction (BTP Chokepoint)",
                            sector="Zone 2 - South & Silk Board Chokepoint",
                            assigned_department="traffic",
                            reported_by="BTP AI Automated Vision"
                        )
                        db.add(inc)
                        db.commit()

                elif self.crisis_step == 10:
                    # Resolve incident
                    inc = db.query(Incident).filter(Incident.incident_number == "INC-CRISIS-001").first()
                    if inc:
                        inc.status = "resolved"
                        inc.resolved_by = "Chief Administrator"
                        inc.resolution_notes = "Traffic cleared, auxiliary generators started, pressure restored."
                        inc.resolved_at = datetime.datetime.now(datetime.timezone.utc)
                        db.commit()

                # Broadcast crisis timeline step to frontend
                await manager.broadcast({
                    "type": "CRISIS_STEP_UPDATE",
                    "step": item["step"],
                    "total_steps": 10,
                    "title": item["title"],
                    "system": item["system"],
                    "description": item["description"],
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
                })

                # Run a simulated telemetry cycle to reflect the new state in charts and maps
                await self.generate_telemetry_cycle()
                await asyncio.sleep(item["duration_seconds"])

        except Exception as e:
            logger.error(f"Crisis sequence error: {e}")
        finally:
            db.close()

    async def reset_simulation(self) -> Dict[str, Any]:
        """Reset demo state, clear crisis flags, normalize nodes."""
        self.crisis_mode = False
        self.crisis_step = 0
        if self.crisis_task and not self.crisis_task.done():
            self.crisis_task.cancel()
            self.crisis_task = None

        db = SessionLocal()
        try:
            # Set all nodes to normal
            db.query(InfrastructureNode).update({InfrastructureNode.status: "normal"})
            # Resolve demo incidents
            db.query(Incident).filter(Incident.incident_number == "INC-CRISIS-001").update({
                Incident.status: "resolved",
                Incident.resolved_at: datetime.datetime.now(datetime.timezone.utc)
            })
            # Dismiss pending crisis recommendations
            db.query(Recommendation).filter(Recommendation.category == "cross_system").update({
                Recommendation.status: "applied",
                Recommendation.applied_at: datetime.datetime.now(datetime.timezone.utc)
            })
            db.commit()
            logger.info("Demo reset complete: All infrastructure returned to baseline normal state.")
        finally:
            db.close()

        # Run one normal cycle
        await self.generate_telemetry_cycle()

        await manager.broadcast({
            "type": "CRISIS_RESET",
            "message": "Demo reset: Infrastructure nodes restored to normal baseline operating state.",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        })

        return {"status": "success", "message": "Simulation reset successfully."}

simulation_engine = SimulationEngine()
