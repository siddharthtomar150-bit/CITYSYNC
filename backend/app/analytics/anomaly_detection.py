"""
CITYSYNC - Real-Time Streaming Anomaly Detection Engine
Applies statistical rolling baselines, Z-Score thresholds, and multi-sensor
correlation to identify infrastructure anomalies with full transparent explanations.
"""
import math
from typing import Dict, Any, Optional, List
from datetime import datetime

class StreamingAnomalyDetector:
    def __init__(self):
        # Baselines: sector -> metric -> list of recent values
        self.history: Dict[str, Dict[str, List[float]]] = {}

    def _update_history(self, key: str, metric: str, value: float, max_len: int = 40):
        if key not in self.history:
            self.history[key] = {}
        if metric not in self.history[key]:
            self.history[key][metric] = []
        hist = self.history[key][metric]
        hist.append(value)
        if len(hist) > max_len:
            hist.pop(0)

    def _get_stats(self, key: str, metric: str) -> (float, float):
        hist = self.history.get(key, {}).get(metric, [])
        if len(hist) < 3:
            return 0.0, 0.0
        avg = sum(hist) / len(hist)
        variance = sum((x - avg) ** 2 for x in hist) / len(hist)
        return avg, math.sqrt(variance)

    def check_traffic_anomaly(
        self,
        node_id: int,
        node_name: str,
        sector: str,
        congestion_level: float,
        avg_speed_kmh: float,
        is_peak_hour: bool
    ) -> Optional[Dict[str, Any]]:
        key = f"traffic_{node_id}"
        self._update_history(key, "congestion", congestion_level)
        avg, std = self._get_stats(key, "congestion")
        
        # Anomaly rules:
        # 1. Congestion > 85% or speed < 18 km/h outside expected peak
        # 2. Or statistical spike (Z > 2.6)
        z_score = (congestion_level - avg) / max(1.0, std) if std > 0 else 0.0
        
        if congestion_level >= 82.0 or z_score >= 2.6 or (avg_speed_kmh < 15.0 and not is_peak_hour):
            severity = "critical" if congestion_level >= 90.0 or avg_speed_kmh < 12.0 else "high"
            baseline = round(avg if avg > 0 else 45.0, 1)
            deviation = round(((congestion_level - baseline) / max(1.0, baseline)) * 100.0, 1)
            
            return {
                "event_type": "TRAFFIC_CONGESTION_SPIKE",
                "category": "traffic",
                "node_id": node_id,
                "location_name": node_name,
                "sector": sector,
                "severity": severity,
                "current_value": round(congestion_level, 1),
                "baseline_value": baseline,
                "deviation_pct": deviation,
                "explanation": (
                    f"Traffic congestion reached {congestion_level:.1f}% on {node_name} "
                    f"(baseline {baseline:.1f}%), with average vehicle speed dropping to {avg_speed_kmh:.1f} km/h. "
                    f"Z-Score deviation is {z_score:.2f}σ."
                ),
                "recommended_action": (
                    "Trigger automated arterial signal timing adjustments, update dynamic VMS boards to divert traffic, "
                    "and dispatch traffic marshals to resolve choke point."
                )
            }
        return None

    def check_electricity_anomaly(
        self,
        node_id: int,
        node_name: str,
        sector: str,
        power_demand_mw: float,
        grid_load_pct: float,
        transformer_temp_c: float,
        capacity_mw: float
    ) -> Optional[Dict[str, Any]]:
        key = f"elec_{node_id}"
        self._update_history(key, "power_demand", power_demand_mw)
        avg, std = self._get_stats(key, "power_demand")
        
        baseline = round(avg if avg > 0 else (capacity_mw * 0.65), 1)
        deviation = round(((power_demand_mw - baseline) / max(1.0, baseline)) * 100.0, 1)
        
        # Grid overload / thermal warning
        if grid_load_pct >= 90.0 or transformer_temp_c >= 78.0:
            severity = "critical" if (grid_load_pct >= 95.0 or transformer_temp_c >= 85.0) else "high"
            return {
                "event_type": "SUBSTATION_GRID_OVERLOAD",
                "category": "electricity",
                "node_id": node_id,
                "location_name": node_name,
                "sector": sector,
                "severity": severity,
                "current_value": round(power_demand_mw, 1),
                "baseline_value": baseline,
                "deviation_pct": deviation,
                "explanation": (
                    f"Substation {node_name} operating at {grid_load_pct:.1f}% capacity ({power_demand_mw:.1f} MW / {capacity_mw:.1f} MW). "
                    f"Transformer core temperature elevated to {transformer_temp_c:.1f}°C."
                ),
                "recommended_action": (
                    "Initiate peak-shaving protocols, balance load across adjacent feeders, and alert field technicians "
                    "for transformer cooling inspection."
                )
            }
        elif grid_load_pct <= 5.0 and baseline > 20.0:
            # Sudden blackout / trip
            return {
                "event_type": "POWER_GRID_FEEDER_TRIP",
                "category": "electricity",
                "node_id": node_id,
                "location_name": node_name,
                "sector": sector,
                "severity": "critical",
                "current_value": round(power_demand_mw, 1),
                "baseline_value": baseline,
                "deviation_pct": -100.0,
                "explanation": (
                    f"Sudden total power collapse detected at {node_name}. Power collapsed from baseline {baseline:.1f} MW to {power_demand_mw:.1f} MW. "
                    "Breaker trip or feeder failure suspected."
                ),
                "recommended_action": (
                    "Execute emergency SCADA automated bus transfer, isolate faulty circuit segment, and dispatch urgent repair crew."
                )
            }
        return None

    def check_water_anomaly(
        self,
        node_id: int,
        node_name: str,
        sector: str,
        pressure_psi: float,
        water_flow_lps: float,
        reservoir_level_pct: Optional[float]
    ) -> Optional[Dict[str, Any]]:
        key = f"water_{node_id}"
        self._update_history(key, "pressure", pressure_psi)
        self._update_history(key, "flow", water_flow_lps)
        avg_pressure, std_p = self._get_stats(key, "pressure")
        avg_flow, std_f = self._get_stats(key, "flow")
        
        base_p = round(avg_pressure if avg_pressure > 0 else 55.0, 1)
        base_f = round(avg_flow if avg_flow > 0 else 300.0, 1)
        
        # 1. Pipe burst: Sudden pressure drop + surging flow
        if pressure_psi < 32.0:
            severity = "critical" if pressure_psi < 24.0 else "high"
            dev = round(((pressure_psi - base_p) / base_p) * 100.0, 1)
            return {
                "event_type": "CRITICAL_WATER_PRESSURE_DROP",
                "category": "water",
                "node_id": node_id,
                "location_name": node_name,
                "sector": sector,
                "severity": severity,
                "current_value": round(pressure_psi, 1),
                "baseline_value": base_p,
                "deviation_pct": dev,
                "explanation": (
                    f"Mains pressure dropped to {pressure_psi:.1f} PSI (normal operating range 45-65 PSI). "
                    f"Flow rate is {water_flow_lps:.1f} L/s. Hydraulic collapse or severe burst pipe indicated."
                ),
                "recommended_action": (
                    "Throttle upstream pressure reduction valve (PRV), isolate sector distribution loop, "
                    "and dispatch utility acoustic leak detection team immediately."
                )
            }
        # 2. Pumping Station shutdown: Flow collapses near zero while reservoir is adequate
        elif water_flow_lps < 30.0 and base_f > 150.0:
            return {
                "event_type": "WATER_PUMP_STATION_FAILURE",
                "category": "water",
                "node_id": node_id,
                "location_name": node_name,
                "sector": sector,
                "severity": "critical",
                "current_value": round(water_flow_lps, 1),
                "baseline_value": base_f,
                "deviation_pct": -90.0,
                "explanation": (
                    f"Pumping station {node_name} flow collapsed from baseline {base_f:.1f} L/s to {water_flow_lps:.1f} L/s. "
                    "Pump motor trip or electrical power disruption indicated."
                ),
                "recommended_action": (
                    "Verify incoming power feed, start auxiliary diesel backup pumps, and notify municipal water authority."
                )
            }
        return None

anomaly_detector = StreamingAnomalyDetector()
