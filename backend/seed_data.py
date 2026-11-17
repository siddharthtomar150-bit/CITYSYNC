"""
CITYSYNC - Bengaluru (Bangalore) Real Municipal Infrastructure Seed Script
Initializes database with 5 role-based accounts (including Super Administrator),
16 physical Bengaluru assets across 5 municipal zones, 24h baseline telemetry,
incidents, anomalies, and model registries.
"""
import datetime
import json
from sqlalchemy.orm import Session

from app.database.session import SessionLocal, engine, Base
from app.models.models import (
    User,
    InfrastructureNode,
    TrafficReading,
    ElectricityReading,
    WaterReading,
    Incident,
    Anomaly,
    Recommendation,
    MaintenanceRecord,
    ModelInformation
)
from app.core.security import hash_password
from app.core.logger import logger

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

def seed_database(force_reseed=False):
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded with Bengaluru nodes
        existing_node = db.query(InfrastructureNode).filter(InfrastructureNode.code == "ROAD-BLR-CSB").first()
        if existing_node and not force_reseed:
            logger.info("Database already seeded with Bengaluru infrastructure. Skipping initial seed.")
            return

        logger.info("Seeding/Updating CITYSYNC database with Bengaluru real infrastructure...")

        # If force_reseed, clear existing infrastructure telemetry to re-align
        if force_reseed or not existing_node:
            db.query(TrafficReading).delete()
            db.query(ElectricityReading).delete()
            db.query(WaterReading).delete()
            db.query(Incident).delete()
            db.query(Anomaly).delete()
            db.query(Recommendation).delete()
            db.query(InfrastructureNode).delete()
            db.commit()

        # 1. Seed Users (5 roles)
        existing_emails = {u.email for u in db.query(User).all()}
        users_to_add = []

        if "superadmin@citysync.gov" not in existing_emails:
            users_to_add.append(
                User(
                    email="superadmin@citysync.gov",
                    username="superadmin",
                    hashed_password=hash_password("superadmin123"),
                    full_name="Alexander Cross (Super Administrator)",
                    role="super_admin",
                    department="Bengaluru City Oversight & Administration"
                )
            )

        if "admin@citysync.gov" not in existing_emails:
            users_to_add.append(
                User(
                    email="admin@citysync.gov",
                    username="admin",
                    hashed_password=hash_password("admin123"),
                    full_name="Elena Rostova (Chief Administrator)",
                    role="admin",
                    department="BBMP Municipal Operations"
                )
            )

        if "traffic@citysync.gov" not in existing_emails:
            users_to_add.append(
                User(
                    email="traffic@citysync.gov",
                    username="traffic",
                    hashed_password=hash_password("traffic123"),
                    full_name="Marcus Vance (Traffic Operations Lead)",
                    role="traffic",
                    department="Bengaluru Traffic Police (BTP) & BMTC"
                )
            )

        if "electricity@citysync.gov" not in existing_emails:
            users_to_add.append(
                User(
                    email="electricity@citysync.gov",
                    username="electricity",
                    hashed_password=hash_password("power123"),
                    full_name="Priya Sharma (Grid Dispatch Director)",
                    role="electricity",
                    department="BESCOM / KPTCL Grid Operations"
                )
            )

        if "water@citysync.gov" not in existing_emails:
            users_to_add.append(
                User(
                    email="water@citysync.gov",
                    username="water",
                    hashed_password=hash_password("water123"),
                    full_name="Kenji Sato (Hydraulics Chief Engineer)",
                    role="water",
                    department="BWSSB Cauvery Water Supply Authority"
                )
            )

        if users_to_add:
            db.add_all(users_to_add)
            db.commit()

        # 2. Seed 16 Real Bengaluru Physical Infrastructure Nodes
        nodes = [
            # Zone 1 - Central CBD & Administrative Heart
            InfrastructureNode(
                name="MG Road & Trinity Circle Corridor",
                code="ROAD-BLR-MGR",
                category="traffic",
                sector="Zone 1 - Central CBD & Administrative Heart",
                latitude=12.9756,
                longitude=77.6094,
                status="normal",
                capacity=2200,
                capacity_unit="vehicles/hr",
                description="Central business district arterial avenue intersecting Namma Metro Purple Line corridor."
            ),
            InfrastructureNode(
                name="High Grounds BWSSB Central Ground Level Reservoir",
                code="WATR-BLR-HGR",
                category="water",
                sector="Zone 1 - Central CBD & Administrative Heart",
                latitude=12.9880,
                longitude=77.5840,
                status="normal",
                capacity=85.0,
                capacity_unit="MLD",
                description="Central distribution reservoir supplying Vidhana Soudha, Cantonment, and CBD zones."
            ),
            InfrastructureNode(
                name="Anand Rao Circle 66kV City Substation",
                code="ELEC-BLR-ARC",
                category="electricity",
                sector="Zone 1 - Central CBD & Administrative Heart",
                latitude=12.9810,
                longitude=77.5750,
                status="normal",
                capacity=75.0,
                capacity_unit="MW",
                description="Substation feeding Majestic railway hub, bus terminals, and government secretariats."
            ),
            InfrastructureNode(
                name="Bengaluru Municipal Emergency & Utility Fleet Depot",
                code="UTIL-BLR-DEP",
                category="utility",
                sector="Zone 1 - Central CBD & Administrative Heart",
                latitude=12.9720,
                longitude=77.5890,
                status="normal",
                capacity=120.0,
                capacity_unit="fleet vehicles",
                description="Central dispatch base for BESCOM emergency line crews and BWSSB heavy suction jetting trucks."
            ),

            # Zone 2 - South & Silk Board Chokepoint
            InfrastructureNode(
                name="Central Silk Board Junction (BTP Chokepoint)",
                code="ROAD-BLR-CSB",
                category="traffic",
                sector="Zone 2 - South & Silk Board Chokepoint",
                latitude=12.9176,
                longitude=77.6238,
                status="normal",
                capacity=3200,
                capacity_unit="vehicles/hr",
                description="Crucial junction connecting Hosur Road, BTM Layout, and Outer Ring Road; key transit choke point."
            ),
            InfrastructureNode(
                name="Electronic City Elevated Expressway",
                code="ROAD-BLR-ECX",
                category="traffic",
                sector="Zone 2 - South & Silk Board Chokepoint",
                latitude=12.8452,
                longitude=77.6602,
                status="normal",
                capacity=2800,
                capacity_unit="vehicles/hr",
                description="Access-controlled 9.9 km elevated highway serving Infosys, Wipro, and southern IT hubs."
            ),
            InfrastructureNode(
                name="Electronic City 220kV Master Substation (BESCOM)",
                code="ELEC-BLR-ECY",
                category="electricity",
                sector="Zone 2 - South & Silk Board Chokepoint",
                latitude=12.8410,
                longitude=77.6740,
                status="normal",
                capacity=160.0,
                capacity_unit="MW",
                description="BESCOM high-voltage substation powering electronic hardware tech campuses and water booster pumps."
            ),
            InfrastructureNode(
                name="Koramangala 66kV Primary Substation",
                code="ELEC-BLR-KRM",
                category="electricity",
                sector="Zone 2 - South & Silk Board Chokepoint",
                latitude=12.9250,
                longitude=77.6180,
                status="normal",
                capacity=85.0,
                capacity_unit="MW",
                description="66kV urban distribution transformer bank serving Koramangala startup and residential blocks."
            ),
            InfrastructureNode(
                name="BWSSB Cauvery Stage IV Torekadanahalli Trunk Feed",
                code="WATR-BLR-CWV",
                category="water",
                sector="Zone 2 - South & Silk Board Chokepoint",
                latitude=12.8950,
                longitude=77.5850,
                status="normal",
                capacity=450.0,
                capacity_unit="MLD",
                description="Primary high-lift treated water transmission main pumped from TK Halli / Cauvery River."
            ),

            # Zone 3 - East Outer Ring Road & IT Corridor
            InfrastructureNode(
                name="Bellandur - Marathahalli Outer Ring Road Corridor",
                code="ROAD-BLR-ORR",
                category="traffic",
                sector="Zone 3 - East Outer Ring Road & IT Corridor",
                latitude=12.9366,
                longitude=77.6908,
                status="normal",
                capacity=3400,
                capacity_unit="vehicles/hr",
                description="High-density IT corridor connecting major tech campuses (Ecospace, Cessna Business Park)."
            ),
            InfrastructureNode(
                name="Whitefield ITPL Main Road Corridor",
                code="ROAD-BLR-ITP",
                category="traffic",
                sector="Zone 3 - East Outer Ring Road & IT Corridor",
                latitude=12.9863,
                longitude=77.7338,
                status="normal",
                capacity=2400,
                capacity_unit="vehicles/hr",
                description="Primary commercial road serving International Tech Park Bangalore (ITPL) and Kadugodi."
            ),
            InfrastructureNode(
                name="Whitefield 220kV Receiving Station (BESCOM)",
                code="ELEC-BLR-WFD",
                category="electricity",
                sector="Zone 3 - East Outer Ring Road & IT Corridor",
                latitude=12.9719,
                longitude=77.7289,
                status="normal",
                capacity=150.0,
                capacity_unit="MW",
                description="Dedicated transmission substation for ITPL and high-density enterprise server clusters."
            ),
            InfrastructureNode(
                name="Bellandur Inflow Water Monitoring & Secondary Treatment Facility",
                code="WATR-BLR-BLR",
                category="water",
                sector="Zone 3 - East Outer Ring Road & IT Corridor",
                latitude=12.9350,
                longitude=77.6680,
                status="normal",
                capacity=90.0,
                capacity_unit="MLD",
                description="SCADA telemetry station monitoring Bellandur lake basin inflows and pipeline pressures."
            ),

            # Zone 4 - West Peenya Industrial Hub
            InfrastructureNode(
                name="Peenya 220kV Master Receiving Substation (KPTCL)",
                code="ELEC-BLR-PNY",
                category="electricity",
                sector="Zone 4 - West Peenya Industrial Hub",
                latitude=13.0315,
                longitude=77.5186,
                status="normal",
                capacity=180.0,
                capacity_unit="MW",
                description="Heavy industrial 220/66kV high-voltage substation powering Peenya Industrial Estate factories."
            ),
            InfrastructureNode(
                name="Goraguntepalya / Tumkur Road Junction",
                code="ROAD-BLR-TUM",
                category="traffic",
                sector="Zone 4 - West Peenya Industrial Hub",
                latitude=13.0285,
                longitude=77.5408,
                status="normal",
                capacity=2600,
                capacity_unit="vehicles/hr",
                description="Primary northwest logistics freight gateway connecting NH48 and Peenya industrial zone."
            ),
            InfrastructureNode(
                name="Thippagondanahalli (TG Halli) Reservoir & Pump Station",
                code="WATR-BLR-TGH",
                category="water",
                sector="Zone 4 - West Peenya Industrial Hub",
                latitude=12.9654,
                longitude=77.3412,
                status="normal",
                capacity=120.0,
                capacity_unit="MLD",
                description="Arkavathi river basin municipal reservoir feeding western Bengaluru water distribution grids."
            ),

            # Zone 5 - North Hebbal & Airport Corridor
            InfrastructureNode(
                name="Hebbal Flyover & Airport Corridor",
                code="ROAD-BLR-HBL",
                category="traffic",
                sector="Zone 5 - North Hebbal & Airport Corridor",
                latitude=13.0358,
                longitude=77.5970,
                status="normal",
                capacity=3500,
                capacity_unit="vehicles/hr",
                description="Strategic northern arterial interchange connecting Bellary Road and Kempegowda Airport expressway."
            ),
            InfrastructureNode(
                name="Hebbal 220kV Transmission Substation",
                code="ELEC-BLR-HBL",
                category="electricity",
                sector="Zone 5 - North Hebbal & Airport Corridor",
                latitude=13.0410,
                longitude=77.5910,
                status="normal",
                capacity=140.0,
                capacity_unit="MW",
                description="KPTCL northern grid transmission substation feeding Sahakar Nagar and Yelahanka sectors."
            )
        ]

        db.add_all(nodes)
        db.commit()

        # 3. Seed Realistic 24h Baseline Telemetry for Bengaluru Assets
        now = utcnow()
        for node in db.query(InfrastructureNode).all():
            for h in range(24, 0, -1):
                ts = now - datetime.timedelta(hours=h)
                hour_of_day = ts.hour

                if node.category == "traffic":
                    # Evening & morning rush hours at Silk Board / Hebbal
                    is_rush = 1 if (8 <= hour_of_day <= 11 or 17 <= hour_of_day <= 20) else 0
                    base_cong = 78.0 if is_rush and "Silk Board" in node.name else (65.0 if is_rush else 38.0)
                    flow = int(node.capacity * (0.85 if is_rush else 0.45))
                    speed = max(12.0, 55.0 - (base_cong * 0.45))

                    db.add(TrafficReading(
                        node_id=node.id,
                        congestion_level=round(base_cong, 1),
                        vehicle_flow=flow,
                        avg_speed_kmh=round(speed, 1),
                        road_occupancy_pct=round(base_cong * 0.88, 1),
                        is_peak_hour=bool(is_rush),
                        timestamp=ts
                    ))

                elif node.category == "electricity":
                    # Bengaluru BESCOM peak 13:00 - 16:30
                    is_peak = 1 if (11 <= hour_of_day <= 17) else 0
                    mw = round(node.capacity * (0.75 if is_peak else 0.52), 1)
                    load_pct = round((mw / node.capacity) * 100, 1)

                    db.add(ElectricityReading(
                        node_id=node.id,
                        power_demand_mw=mw,
                        grid_load_pct=load_pct,
                        transformer_temp_c=round(52.0 + (load_pct * 0.22), 1),
                        voltage_kv=220.0 if "220kV" in node.name else 66.0,
                        frequency_hz=50.01,
                        is_overloaded=False,
                        timestamp=ts
                    ))

                elif node.category == "water":
                    # BWSSB pumping cycles
                    base_flow = round(node.capacity * 0.72, 1)
                    psi = 55.0 if hour_of_day > 6 else 62.0

                    db.add(WaterReading(
                        node_id=node.id,
                        water_flow_lps=base_flow,
                        pressure_psi=round(psi, 1),
                        reservoir_level_pct=78.5,
                        water_quality_index=94.0,
                        leak_suspected=False,
                        timestamp=ts
                    ))

        db.commit()

        # 4. Seed Initial Bengaluru Incidents
        inc1 = Incident(
            incident_number="INC-BLR-2026-001",
            title="Silk Board Junction Inbound Traffic Signal Sync Disruption",
            category="traffic",
            severity="high",
            status="investigating",
            description="Adaptive traffic signal controller at Silk Board BTM ramp lost GPS synchronization, resulting in vehicle queue extending 2.4 km along Hosur Road.",
            location_name="Central Silk Board Junction (BTP Chokepoint)",
            sector="Zone 2 - South & Silk Board Chokepoint",
            node_id=db.query(InfrastructureNode).filter(InfrastructureNode.code == "ROAD-BLR-CSB").first().id,
            assigned_department="traffic",
            reported_by="Bengaluru Traffic Police (BTP) AI Vision",
            investigation_notes="BTP control center switched junction to manual override; technician dispatched to reboot optical fiber relay.",
            created_at=now - datetime.timedelta(minutes=35),
            updated_at=now - datetime.timedelta(minutes=10)
        )

        inc2 = Incident(
            incident_number="INC-BLR-2026-002",
            title="Peenya 220kV Substation Transformer #3 Winding Thermal Alert",
            category="electricity",
            severity="medium",
            status="open",
            description="Transformer winding temperature sensor T-302 logged 78°C under heavy Peenya industrial manufacturing induction furnace loads.",
            location_name="Peenya 220kV Master Receiving Substation (KPTCL)",
            sector="Zone 4 - West Peenya Industrial Hub",
            node_id=db.query(InfrastructureNode).filter(InfrastructureNode.code == "ELEC-BLR-PNY").first().id,
            assigned_department="electricity",
            reported_by="KPTCL SCADA Automation",
            created_at=now - datetime.timedelta(minutes=50),
            updated_at=now - datetime.timedelta(minutes=50)
        )

        db.add_all([inc1, inc2])
        db.commit()

        logger.info("Successfully seeded Bengaluru real infrastructure database!")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force_reseed=True)
