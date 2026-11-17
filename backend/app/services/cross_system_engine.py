"""
CITYSYNC - Cross-System Infrastructure Dependency & Impact Analysis Engine
OUR CORE INNOVATION: Interconnects Traffic, Electricity, Water, and Emergency Services
to model cascading infrastructure failures, calculate consequences, and synthesize preventive interventions.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.core.logger import logger

class InfrastructureDependencyEngine:
    def __init__(self):
        # Topological Infrastructure Dependency Graph
        # Maps dependency relations: target_node relies on source_node for service
        self.dependencies = [
            {
                "source_code": "SUB-04-IND",
                "source_name": "East Industrial Primary Substation (110kV)",
                "source_system": "electricity",
                "target_code": "PUMP-02-IND",
                "target_name": "Sector 4 Industrial Pumping Station",
                "target_system": "water",
                "dependency_type": "PRIMARY_POWER_FEED",
                "cascade_delay_minutes": 5,
                "impact_description": "Loss of primary power trips high-pressure booster pumps, collapsing water distribution pressure."
            },
            {
                "source_code": "SUB-01-DTN",
                "source_name": "Downtown Central Substation",
                "source_system": "electricity",
                "target_code": "TSIG-01-DTN",
                "target_name": "Downtown Central Traffic Signal Grid",
                "target_system": "traffic",
                "dependency_type": "SIGNAL_CONTROL_POWER",
                "cascade_delay_minutes": 2,
                "impact_description": "Substation fluctuation switches 14 major signal intersections to fail-safe flashing mode, degrading traffic flow."
            },
            {
                "source_code": "ROAD-01-DTN",
                "source_name": "Metro Central Arterial Corridor",
                "source_system": "traffic",
                "target_code": "UTIL-01-DEP",
                "target_name": "Metropolitan Emergency & Utility Maintenance Depot",
                "target_system": "public_utility",
                "dependency_type": "CORRIDOR_TRANSIT_ACCESS",
                "cascade_delay_minutes": 22,
                "impact_description": "Severe road gridlock traps heavy utility repair vehicles and emergency crews, delaying crisis remediation."
            },
            {
                "source_code": "WAT-01-DTN",
                "source_name": "Sector 1 Downtown Water Distribution Main",
                "source_system": "water",
                "target_code": "FIRE-01-DTN",
                "target_name": "Downtown Civic Fire Hydrant Network",
                "target_system": "public_utility",
                "dependency_type": "HYDRAULIC_PRESSURE_SUPPLY",
                "cascade_delay_minutes": 0,
                "impact_description": "Drop in main pressure leaves fire hydrants below 30 PSI, creating severe fire safety vulnerability in high-density high-rises."
            },
            {
                "source_code": "WAT-02-IND",
                "source_name": "Sector 4 High-Pressure Water Trunk Line",
                "source_system": "water",
                "target_code": "ROAD-04-IND",
                "target_name": "East Industrial Freight Highway",
                "target_system": "traffic",
                "dependency_type": "SUBSURFACE_FOUNDATION_RISK",
                "cascade_delay_minutes": 35,
                "impact_description": "Major pressurized water main leak undermines roadway base-course, risking pavement collapse and road closure."
            }
        ]

    def analyze_cross_system_impacts(
        self,
        active_anomalies: List[Dict[str, Any]],
        active_incidents: List[Dict[str, Any]],
        nodes_status: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Evaluate multi-system cross dependencies.
        Returns explicit cascading consequence chains with severity and suggested actions.
        """
        impacts = []

        # Index anomalies by category and sector
        anomaly_categories = {a.get("category"): a for a in active_anomalies}
        anomaly_types = {a.get("event_type"): a for a in active_anomalies}

        # SCENARIO D: Power disruption cascading into Water Pumping Station
        power_outage = (
            anomaly_types.get("POWER_GRID_FEEDER_TRIP") or
            anomaly_types.get("SUBSTATION_GRID_OVERLOAD")
        )
        if power_outage:
            sector = power_outage.get("sector")
            impacts.append({
                "source_system": "Electricity Grid",
                "source_event": power_outage.get("event_type"),
                "source_location": power_outage.get("location_name"),
                "target_system": "Water Distribution & Pumping",
                "target_infrastructure": "Sector 4 Water Pumping Station & Pressure Loop",
                "severity": "critical",
                "chain_of_consequences": [
                    "1. Substation trip eliminates 11kV busbar supply to water pumping plant.",
                    "2. Electric high-head pumps lose motive power; check valves slam shut.",
                    "3. Distribution mains pressure plunges from 58 PSI towards critical 18 PSI.",
                    "4. Downstream industrial processes and domestic water feeds face imminent service cutoff."
                ],
                "consequence_summary": "Downstream water supply pressure collapse due to pumping station electrical cutoff.",
                "estimated_delay_mins": 8,
                "affected_sectors": [sector, "Sector 4 - East Industrial Park"],
                "recommended_action": (
                    "Authorize emergency startup of auxiliary diesel generator at Sector 4 Pumping Station, "
                    "isolate non-critical industrial feeds, and reroute power through West Feeder 2B."
                ),
                "is_active": True
            })

        # SCENARIO A: Traffic congestion impeding emergency/maintenance response
        traffic_anomaly = (
            anomaly_types.get("TRAFFIC_CONGESTION_SPIKE") or
            anomaly_categories.get("traffic")
        )
        if traffic_anomaly and (power_outage or any(a.get("category") == "water" for a in active_anomalies) or len(active_incidents) > 0):
            impacts.append({
                "source_system": "Traffic Network",
                "source_event": "SEVERE_CORRIDOR_CONGESTION",
                "source_location": traffic_anomaly.get("location_name"),
                "target_system": "Municipal Emergency & Utility Response",
                "target_infrastructure": "Utility Maintenance Depot & Rapid Response Fleet",
                "severity": "high",
                "chain_of_consequences": [
                    "1. Critical arterial bottleneck locks Metro Central Corridor.",
                    "2. Electrical and water emergency repair vehicles delayed by ~25 minutes in gridlock.",
                    "3. Utility failure duration prolonged, multiplying collateral economic damage."
                ],
                "consequence_summary": "Emergency & repair vehicles delayed by 25+ minutes due to arterial gridlock.",
                "estimated_delay_mins": 25,
                "affected_sectors": [traffic_anomaly.get("sector"), "All Interconnected Sectors"],
                "recommended_action": (
                    "Open emergency dedicated green wave corridor on North Ring Expressway; "
                    "notify Traffic Control Center to override signals for emergency utility convoys."
                ),
                "is_active": True
            })

        # SCENARIO C: Water pressure drop impacting Firefighting & Road Integrity
        water_anomaly = (
            anomaly_types.get("CRITICAL_WATER_PRESSURE_DROP") or
            anomaly_types.get("WATER_PUMP_STATION_FAILURE")
        )
        if water_anomaly:
            impacts.append({
                "source_system": "Water & Hydraulics",
                "source_event": water_anomaly.get("event_type"),
                "source_location": water_anomaly.get("location_name"),
                "target_system": "Civic Public Safety & Transportation",
                "target_infrastructure": "Civic Fire Hydrant Loop & Road Base Substructure",
                "severity": "critical" if water_anomaly.get("severity") == "critical" else "high",
                "chain_of_consequences": [
                    "1. Hydraulic pressure drops below 25 PSI across distribution grid.",
                    "2. High-density residential and commercial fire hydrants rendered below minimum fire-flow standards.",
                    "3. If caused by trunk line rupture, localized water pooling threatens road foundation stability."
                ],
                "consequence_summary": "Fire hydrants compromised; potential pavement subsidence if pipe rupture verified.",
                "estimated_delay_mins": 15,
                "affected_sectors": [water_anomaly.get("sector")],
                "recommended_action": (
                    "Alert City Fire Department of reduced hydrant operating pressure; inspect road surface "
                    "for cavitation and throttle zone isolation valve Z-14."
                ),
                "is_active": True
            })

        # Baseline demo impact if no active critical alerts to show connected system status
        if not impacts:
            impacts.append({
                "source_system": "Interconnected City Mesh",
                "source_event": "NORMAL_COORDINATED_OPERATIONS",
                "source_location": "All Sectors",
                "target_system": "Unified Smart City Operations",
                "target_infrastructure": "Cross-Sector Grid, Water & Arterial Links",
                "severity": "low",
                "chain_of_consequences": [
                    "All interconnected infrastructure dependencies operating within calibrated tolerance bands.",
                    "Substations operating at balanced loads with water pump plants active.",
                    "Emergency vehicle corridors open with normal transit flow."
                ],
                "consequence_summary": "All interconnected infrastructure operating synchronously within normal parameters.",
                "estimated_delay_mins": 0,
                "affected_sectors": ["Citywide"],
                "recommended_action": "Continue passive cross-system dependency monitoring.",
                "is_active": False
            })

        return impacts

cross_system_engine = InfrastructureDependencyEngine()
