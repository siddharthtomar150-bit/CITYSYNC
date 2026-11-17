"""
CITYSYNC - Machine Learning Grounded Municipal Dataset Generator
Generates realistic, physically-consistent municipal infrastructure datasets
reflecting real city diurnal cycles, rush hours, industrial shifts, and hydraulic profiles.
"""
import csv
import math
import random
from datetime import datetime, timedelta
from pathlib import Path
import shutil

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASETS_DIR = Path(__file__).resolve().parent / "datasets"
ROOT_DATASETS_DIR = BASE_DIR / "datasets"

DATASETS_DIR.mkdir(parents=True, exist_ok=True)
ROOT_DATASETS_DIR.mkdir(parents=True, exist_ok=True)

SECTORS = [
    "Zone 1 - Central CBD & Administrative Heart",
    "Zone 2 - South & Silk Board Chokepoint",
    "Zone 3 - East Outer Ring Road & IT Corridor",
    "Zone 4 - West Peenya Industrial Hub",
    "Zone 5 - North Hebbal & Airport Corridor"
]

def copy_to_root(filepath: Path):
    target = ROOT_DATASETS_DIR / filepath.name
    try:
        shutil.copy2(filepath, target)
    except Exception:
        pass

def generate_traffic_dataset(num_days: int = 21, seed: int = 42) -> Path:
    random.seed(seed)
    output_file = DATASETS_DIR / "traffic_dataset.csv"
    start_time = datetime(2026, 10, 1, 0, 0, 0)
    rows = []
    
    for sector_idx, sector in enumerate(SECTORS):
        base_capacity = [1200, 1600, 900, 1400, 1000][sector_idx]
        congestion_bias = [1.2, 1.1, 0.85, 0.95, 0.9][sector_idx]
        prev_congestion = 25.0
        rolling_hist = [25.0, 25.0, 25.0]
        
        total_hours = num_days * 24
        for h in range(total_hours):
            current_dt = start_time + timedelta(hours=h)
            hour = current_dt.hour
            dow = current_dt.weekday()
            is_weekend = 1 if dow >= 5 else 0
            
            is_morning_rush = 1 if (not is_weekend and 7 <= hour <= 9) else 0
            is_evening_rush = 1 if (not is_weekend and 17 <= hour <= 19) else 0
            is_rush_hour = 1 if (is_morning_rush or is_evening_rush) else 0
            
            diurnal = 30.0 + 20.0 * math.sin((hour - 4) * math.pi / 12)
            if is_morning_rush:
                diurnal += 35.0
            elif is_evening_rush:
                diurnal += 40.0
            elif 23 <= hour or hour <= 4:
                diurnal = max(8.0, diurnal - 15.0)
                
            if is_weekend:
                diurnal = diurnal * 0.72
                
            weather_impact = round(random.uniform(0.9, 1.15), 3)
            raw_congestion = (diurnal * congestion_bias * weather_impact) + random.uniform(-4.0, 4.0)
            congestion_level = max(5.0, min(98.0, round(raw_congestion, 1)))
            vehicle_flow = int(base_capacity * (congestion_level / 100.0) * random.uniform(0.9, 1.1))
            avg_speed_kmh = max(12.0, min(80.0, round(70.0 - (congestion_level * 0.58) + random.uniform(-3, 3), 1)))
            road_occupancy = round(congestion_level * 0.92, 1)
            rolling_3h = round(sum(rolling_hist) / len(rolling_hist), 1)
            
            rows.append({
                "timestamp": current_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "sector": sector,
                "hour_of_day": hour,
                "day_of_week": dow,
                "is_weekend": is_weekend,
                "is_rush_hour": is_rush_hour,
                "prev_hour_congestion": round(prev_congestion, 1),
                "rolling_3h_congestion": rolling_3h,
                "weather_impact_score": weather_impact,
                "vehicle_flow": vehicle_flow,
                "avg_speed_kmh": avg_speed_kmh,
                "road_occupancy_pct": road_occupancy,
                "congestion_level": congestion_level
            })
            
            prev_congestion = congestion_level
            rolling_hist.append(congestion_level)
            if len(rolling_hist) > 3:
                rolling_hist.pop(0)
                
    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
        
    copy_to_root(output_file)
    return output_file

def generate_electricity_dataset(num_days: int = 21, seed: int = 43) -> Path:
    random.seed(seed)
    output_file = DATASETS_DIR / "electricity_dataset.csv"
    start_time = datetime(2026, 10, 1, 0, 0, 0)
    rows = []
    
    sector_profiles = [
        {"base_mw": 85.0, "var_mw": 45.0, "industrial": False},
        {"base_mw": 60.0, "var_mw": 35.0, "industrial": False},
        {"base_mw": 45.0, "var_mw": 30.0, "industrial": False},
        {"base_mw": 110.0, "var_mw": 60.0, "industrial": True},
        {"base_mw": 50.0, "var_mw": 25.0, "industrial": False},
    ]
    
    for sector_idx, sector in enumerate(SECTORS):
        profile = sector_profiles[sector_idx]
        prev_mw = profile["base_mw"]
        rolling_hist = [prev_mw, prev_mw, prev_mw]
        
        total_hours = num_days * 24
        for h in range(total_hours):
            current_dt = start_time + timedelta(hours=h)
            hour = current_dt.hour
            dow = current_dt.weekday()
            is_weekend = 1 if dow >= 5 else 0
            
            ambient_temp = 24.0 + 7.0 * math.sin((hour - 9) * math.pi / 12) + random.uniform(-1.5, 1.5)
            hvac_load = max(0.0, (ambient_temp - 22.0) * 2.8)
            
            if profile["industrial"]:
                shift_factor = 1.25 if (8 <= hour <= 16 or 17 <= hour <= 23) else 0.9
                is_shift = 1 if shift_factor > 1.0 else 0
                sector_load = profile["base_mw"] * shift_factor
            else:
                is_shift = 0
                if 8 <= hour <= 18:
                    sector_load = profile["base_mw"] * 1.35
                elif 19 <= hour <= 22:
                    sector_load = profile["base_mw"] * 1.15
                else:
                    sector_load = profile["base_mw"] * 0.65
                    
            if is_weekend and not profile["industrial"]:
                sector_load *= 0.82
                
            raw_mw = sector_load + hvac_load + random.uniform(-3.5, 3.5)
            power_demand_mw = round(max(15.0, raw_mw), 2)
            grid_load_pct = round(min(98.0, (power_demand_mw / (profile["base_mw"] * 1.6)) * 100), 1)
            voltage_kv = round(11.0 + random.uniform(-0.15, 0.15), 2)
            frequency_hz = round(50.0 + random.uniform(-0.08, 0.08), 2)
            transformer_temp = round(45.0 + (power_demand_mw * 0.22) + random.uniform(-2, 2), 1)
            rolling_3h_mw = round(sum(rolling_hist) / len(rolling_hist), 2)
            
            rows.append({
                "timestamp": current_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "sector": sector,
                "hour_of_day": hour,
                "day_of_week": dow,
                "is_weekend": is_weekend,
                "ambient_temp_c": round(ambient_temp, 1),
                "is_industrial_shift": is_shift,
                "prev_hour_mw": round(prev_mw, 2),
                "rolling_3h_mw": rolling_3h_mw,
                "grid_load_pct": grid_load_pct,
                "voltage_kv": voltage_kv,
                "frequency_hz": frequency_hz,
                "transformer_temp_c": transformer_temp,
                "power_demand_mw": power_demand_mw
            })
            
            prev_mw = power_demand_mw
            rolling_hist.append(power_demand_mw)
            if len(rolling_hist) > 3:
                rolling_hist.pop(0)
                
    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
        
    copy_to_root(output_file)
    return output_file

def generate_water_dataset(num_days: int = 21, seed: int = 44) -> Path:
    random.seed(seed)
    output_file = DATASETS_DIR / "water_dataset.csv"
    start_time = datetime(2026, 10, 1, 0, 0, 0)
    rows = []
    
    for sector_idx, sector in enumerate(SECTORS):
        base_flow = [320.0, 260.0, 290.0, 480.0, 210.0][sector_idx]
        total_hours = num_days * 24
        reservoir_level = 82.0
        
        for h in range(total_hours):
            current_dt = start_time + timedelta(hours=h)
            hour = current_dt.hour
            dow = current_dt.weekday()
            
            if 6 <= hour <= 9:
                demand_mult = 1.45
            elif 18 <= hour <= 21:
                demand_mult = 1.35
            elif 1 <= hour <= 5:
                demand_mult = 0.45
            else:
                demand_mult = 1.0
                
            flow_lps = round(base_flow * demand_mult + random.uniform(-15.0, 15.0), 1)
            pressure_psi = round(58.0 - (flow_lps / base_flow * 4.0) + random.uniform(-1.5, 1.5), 1)
            reservoir_level = max(40.0, min(95.0, round(reservoir_level - (demand_mult - 1.0) * 0.4 + random.uniform(-0.1, 0.1), 1)))
            
            is_anomaly = 0
            anomaly_type = "normal"
            if random.random() < 0.025:
                is_anomaly = 1
                pressure_psi = round(random.uniform(18.0, 32.0), 1)
                flow_lps = round(flow_lps * 1.55, 1)
                anomaly_type = "burst_pipe_pressure_drop"
            elif random.random() < 0.015:
                is_anomaly = 1
                flow_lps = round(flow_lps * 0.2, 1)
                pressure_psi = round(random.uniform(12.0, 24.0), 1)
                anomaly_type = "pump_disruption"
            elif 1 <= hour <= 4 and random.random() < 0.03:
                is_anomaly = 1
                flow_lps = round(base_flow * 1.1, 1)
                anomaly_type = "nighttime_leakage"
                
            flow_pressure_ratio = round(flow_lps / max(1.0, pressure_psi), 2)
            quality_index = round(96.0 - (is_anomaly * 8.0) + random.uniform(-1.5, 1.0), 1)
            
            rows.append({
                "timestamp": current_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "sector": sector,
                "hour_of_day": hour,
                "day_of_week": dow,
                "water_flow_lps": flow_lps,
                "pressure_psi": pressure_psi,
                "reservoir_level_pct": reservoir_level,
                "flow_pressure_ratio": flow_pressure_ratio,
                "water_quality_index": quality_index,
                "is_anomaly": is_anomaly,
                "anomaly_type": anomaly_type
            })
            
    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
        
    copy_to_root(output_file)
    return output_file

def generate_multi_system_dataset(num_days: int = 21, seed: int = 45) -> Path:
    """Generate joint multi-system dataset for Model 4: Infrastructure Anomaly Detection."""
    random.seed(seed)
    output_file = DATASETS_DIR / "multi_system_anomaly_dataset.csv"
    start_time = datetime(2026, 10, 1, 0, 0, 0)
    rows = []

    for sector_idx, sector in enumerate(SECTORS):
        total_hours = num_days * 24
        for h in range(total_hours):
            current_dt = start_time + timedelta(hours=h)
            hour = current_dt.hour
            dow = current_dt.weekday()

            # Normal baselines
            cong = round(35.0 + 25.0 * math.sin((hour - 5) * math.pi / 12) + random.uniform(-5, 5), 1)
            cong = max(5.0, min(80.0, cong))
            power_mw = round(70.0 + 35.0 * math.sin((hour - 9) * math.pi / 12) + random.uniform(-6, 6), 1)
            pressure_psi = round(56.0 + random.uniform(-3, 3), 1)
            flow_lps = round(310.0 + random.uniform(-20, 20), 1)

            is_anomaly = 0
            # 4% cross-system correlated breakdown anomaly
            if random.random() < 0.04:
                is_anomaly = 1
                anom_type = random.choice(["grid_blackout_pump_stop", "corridor_jam_maintenance_delay", "water_burst_road_flood"])
                if anom_type == "grid_blackout_pump_stop":
                    power_mw = 3.5
                    pressure_psi = round(random.uniform(14.0, 22.0), 1)
                    flow_lps = 15.0
                elif anom_type == "corridor_jam_maintenance_delay":
                    cong = round(random.uniform(91.0, 98.0), 1)
                elif anom_type == "water_burst_road_flood":
                    pressure_psi = round(random.uniform(16.0, 25.0), 1)
                    flow_lps = round(flow_lps * 1.6, 1)

            rows.append({
                "timestamp": current_dt.strftime("%Y-%m-%d %H:%M:%S"),
                "sector": sector,
                "hour_of_day": hour,
                "traffic_congestion_pct": cong,
                "power_demand_mw": power_mw,
                "water_pressure_psi": pressure_psi,
                "water_flow_lps": flow_lps,
                "is_multi_system_anomaly": is_anomaly
            })

    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    copy_to_root(output_file)
    return output_file

def generate_all_datasets():
    t = generate_traffic_dataset()
    e = generate_electricity_dataset()
    w = generate_water_dataset()
    m = generate_multi_system_dataset()
    return t, e, w, m

if __name__ == "__main__":
    t, e, w, m = generate_all_datasets()
    print("Generated all 4 grounded municipal datasets successfully.")
