"""
src/config.py
Configuration and Indian Agronomic Constants for USICT038
Autonomous AI Agent for Strategic Farm Management & Dynamic Economic Optimization
"""

import os

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
RAW_DATA_DIR = os.path.join(DATA_DIR, "raw")
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, "processed")

UNIFIED_DB_PATH = os.path.join(PROCESSED_DATA_DIR, "unified_farm_engine.db")
CACHE_DB_PATH = os.path.join(PROCESSED_DATA_DIR, "weather_cache.db")

# Geographic Validation: Indian Subcontinent Bounding Box
INDIA_GEO_BOUNDS = {
    "min_lat": 6.0,
    "max_lat": 37.5,
    "min_lon": 68.0,
    "max_lon": 98.0
}

# Weather API Configuration
OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast"
NASA_POWER_DAILY_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
WEATHER_CACHE_TTL_HOURS = 3.0

# Indian Agricultural Seasons & Normal Growing Periods
INDIAN_SEASONS = {
    "Kharif": {
        "description": "Monsoon / Autumn crop cycle (Sowing: June/July, Harvest: Oct/Nov)",
        "months": [6, 7, 8, 9, 10],
        "rainfall_weight": 0.75  # ~75% of annual rainfall occurs in Kharif (SW Monsoon)
    },
    "Rabi": {
        "description": "Winter / Spring crop cycle (Sowing: Oct/Nov, Harvest: Mar/Apr)",
        "months": [11, 12, 1, 2, 3, 4],
        "rainfall_weight": 0.15  # ~15% of annual rainfall
    },
    "Zaid": {
        "description": "Summer crop cycle (Sowing: Mar/Apr, Harvest: May/June)",
        "months": [3, 4, 5, 6],
        "rainfall_weight": 0.10  # ~10% of annual rainfall (pre-monsoon showers)
    }
}

# Irrigation Type Drought-Mitigation Multipliers (Lower means higher drought buffer)
IRRIGATION_MITIGATION = {
    "Rainfed": 1.00,      # 0% mitigation, 100% dependent on rainfall
    "Borewell": 0.25,     # 75% mitigation against surface rainfall deficit
    "Canal": 0.35,        # 65% mitigation (subject to canal scheduling)
    "Drip": 0.10,         # 90% mitigation (precision micro-irrigation)
    "Sprinkler": 0.20,    # 80% mitigation
    "Other": 0.50
}

# Irrigation Reliability Weights
IRRIGATION_RELIABILITY_WEIGHT = {
    "High": 0.80,         # Further reduces risk penalty
    "Medium": 1.00,       # Standard
    "Low": 1.40           # Unreliable power/water supply increases risk penalty
}

# Conversion Constants
HECTARES_TO_ACRES = 2.47105
ACRES_TO_HECTARES = 0.404686
TONNES_TO_QUINTALS = 10.0

# Crop Agronomic Master Metadata (Calibrated against ICAR / FAO-56 Agronomy Standards)
CROP_AGRONOMIC_PROFILES = {
    "Wheat": {
        "season": "Rabi",
        "duration_days": 120,
        "water_req_mm": 450,
        "temp_opt_min": 12.0,
        "temp_opt_max": 25.0,
        "heat_stress_threshold": 32.0,
        "drought_sensitivity": 0.70,     # Medium-High
        "waterlogging_sensitivity": 0.85, # High (susceptible to root rot / rust)
        "preferred_soil": ["Alluvial", "Medium Black Soil", "Loamy"],
        "min_acres": 0.5,
        "max_acre_share": 0.80,
        "description": "Major staple winter grain requiring cool germination and dry harvest."
    },
    "Rice": {
        "season": "Kharif",
        "duration_days": 135,
        "water_req_mm": 1150,
        "temp_opt_min": 20.0,
        "temp_opt_max": 35.0,
        "heat_stress_threshold": 38.0,
        "drought_sensitivity": 0.95,     # Very High
        "waterlogging_sensitivity": 0.10, # Very Low (loves standing water)
        "preferred_soil": ["Clayey", "Alluvial", "Deep Black Soil"],
        "min_acres": 0.5,
        "max_acre_share": 0.75,
        "description": "Staple food grain with heavy water demand and high moisture tolerance."
    },
    "Soyabean": {
        "season": "Kharif",
        "duration_days": 105,
        "water_req_mm": 500,
        "temp_opt_min": 20.0,
        "temp_opt_max": 32.0,
        "heat_stress_threshold": 36.0,
        "drought_sensitivity": 0.60,     # Medium
        "waterlogging_sensitivity": 0.90, # Very High (seedling rot under standing water)
        "preferred_soil": ["Medium Black Soil", "Vertisol", "Loamy"],
        "min_acres": 0.5,
        "max_acre_share": 0.80,
        "description": "Key oilseed crop of Central India, highly profitable but waterlogging sensitive."
    },
    "Maize": {
        "season": "Kharif",
        "duration_days": 100,
        "water_req_mm": 550,
        "temp_opt_min": 18.0,
        "temp_opt_max": 32.0,
        "heat_stress_threshold": 37.0,
        "drought_sensitivity": 0.55,     # Medium
        "waterlogging_sensitivity": 0.75, # High
        "preferred_soil": ["Alluvial", "Red Sandy Loam", "Medium Black Soil"],
        "min_acres": 0.5,
        "max_acre_share": 0.70,
        "description": "Versatile cereal crop with moderate water demand and steady market demand."
    },
    "Cotton": {
        "season": "Kharif",
        "duration_days": 160,
        "water_req_mm": 700,
        "temp_opt_min": 21.0,
        "temp_opt_max": 35.0,
        "heat_stress_threshold": 40.0,
        "drought_sensitivity": 0.50,     # Low-Medium (deep taproot)
        "waterlogging_sensitivity": 0.80, # High (boll shedding in standing water)
        "preferred_soil": ["Deep Black Soil", "Vertisol", "Alluvial"],
        "min_acres": 1.0,
        "max_acre_share": 0.70,
        "description": "High-value commercial fiber crop with deep root system."
    },
    "Chickpea (Gram)": {
        "season": "Rabi",
        "duration_days": 110,
        "water_req_mm": 300,
        "temp_opt_min": 10.0,
        "temp_opt_max": 26.0,
        "heat_stress_threshold": 30.0,
        "drought_sensitivity": 0.35,     # Low (excellent dryland crop)
        "waterlogging_sensitivity": 0.95, # Extreme (collar rot)
        "preferred_soil": ["Medium Black Soil", "Loamy", "Sandy Loam"],
        "min_acres": 0.5,
        "max_acre_share": 0.60,
        "description": "Hardy winter pulse with low water requirement and nitrogen fixation."
    },
    "Pigeonpea (Arhar)": {
        "season": "Kharif",
        "duration_days": 180,
        "water_req_mm": 600,
        "temp_opt_min": 20.0,
        "temp_opt_max": 35.0,
        "heat_stress_threshold": 38.0,
        "drought_sensitivity": 0.40,     # Low (deep rooting)
        "waterlogging_sensitivity": 0.85, # High
        "preferred_soil": ["Medium Black Soil", "Alluvial", "Red Loam"],
        "min_acres": 0.5,
        "max_acre_share": 0.50,
        "description": "Long-duration protein pulse widely intercropped in dryland agriculture."
    },
    "Groundnut": {
        "season": "Kharif",
        "duration_days": 115,
        "water_req_mm": 500,
        "temp_opt_min": 22.0,
        "temp_opt_max": 32.0,
        "heat_stress_threshold": 36.0,
        "drought_sensitivity": 0.50,     # Medium
        "waterlogging_sensitivity": 0.80, # High
        "preferred_soil": ["Red Sandy Loam", "Sandy Soil", "Light Alluvial"],
        "min_acres": 0.5,
        "max_acre_share": 0.60,
        "description": "Oilseed legume requiring light, well-drained soils for pod development."
    },
    "Mustard": {
        "season": "Rabi",
        "duration_days": 105,
        "water_req_mm": 350,
        "temp_opt_min": 10.0,
        "temp_opt_max": 25.0,
        "heat_stress_threshold": 29.0,
        "drought_sensitivity": 0.40,     # Low
        "waterlogging_sensitivity": 0.90, # Very High
        "preferred_soil": ["Alluvial", "Sandy Loam", "Medium Black Soil"],
        "min_acres": 0.5,
        "max_acre_share": 0.60,
        "description": "Primary winter oilseed with high return and modest irrigation need."
    },
    "Sugarcane": {
        "season": "Whole Year",
        "duration_days": 330,
        "water_req_mm": 1800,
        "temp_opt_min": 20.0,
        "temp_opt_max": 38.0,
        "heat_stress_threshold": 42.0,
        "drought_sensitivity": 0.90,     # High (requires assured irrigation)
        "waterlogging_sensitivity": 0.30, # Low
        "preferred_soil": ["Deep Alluvial", "Deep Black Soil", "Clay Loam"],
        "min_acres": 1.0,
        "max_acre_share": 0.60,
        "description": "Annual commercial cash crop demanding high capital and perennial water access."
    }
}

# Major Indian Agricultural District Master Catalog
INDIAN_DISTRICTS_CATALOG = [
    {
        "district_id": "MP_BHOPAL",
        "state_name": "Madhya Pradesh",
        "district_name": "Bhopal",
        "latitude": 23.2599,
        "longitude": 77.4126,
        "agro_climatic_zone": "Central Plateau and Hills",
        "major_soil_type": "Medium Black Soil",
        "imd_annual_rainfall_mm": 1080.0,
        "major_crops": ["Soyabean", "Wheat", "Gram", "Maize"]
    },
    {
        "district_id": "MP_INDORE",
        "state_name": "Madhya Pradesh",
        "district_name": "Indore",
        "latitude": 22.7196,
        "longitude": 75.8577,
        "agro_climatic_zone": "Malwa Plateau",
        "major_soil_type": "Deep Black Soil (Vertisol)",
        "imd_annual_rainfall_mm": 950.0,
        "major_crops": ["Soyabean", "Wheat", "Gram", "Cotton"]
    },
    {
        "district_id": "MP_BALAGHAT",
        "state_name": "Madhya Pradesh",
        "district_name": "Balaghat",
        "latitude": 21.8129,
        "longitude": 80.1838,
        "agro_climatic_zone": "Wainganga Valley",
        "major_soil_type": "Red and Yellow Soil",
        "imd_annual_rainfall_mm": 1320.0,
        "major_crops": ["Rice", "Gram", "Linseed"]
    },
    {
        "district_id": "MH_PUNE",
        "state_name": "Maharashtra",
        "district_name": "Pune",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "agro_climatic_zone": "Western Plateau and Hills",
        "major_soil_type": "Medium Black Soil",
        "imd_annual_rainfall_mm": 722.0,
        "major_crops": ["Sugarcane", "Soyabean", "Wheat", "Gram"]
    },
    {
        "district_id": "MH_NASHIK",
        "state_name": "Maharashtra",
        "district_name": "Nashik",
        "latitude": 19.9975,
        "longitude": 73.7898,
        "agro_climatic_zone": "Western Ghats / Semi-Arid",
        "major_soil_type": "Medium Black Soil",
        "imd_annual_rainfall_mm": 810.0,
        "major_crops": ["Maize", "Soyabean", "Wheat", "Cotton"]
    },
    {
        "district_id": "MH_AURANGABAD",
        "state_name": "Maharashtra",
        "district_name": "Aurangabad",
        "latitude": 19.8762,
        "longitude": 75.3433,
        "agro_climatic_zone": "Marathwada Dry Zone",
        "major_soil_type": "Black Cotton Soil",
        "imd_annual_rainfall_mm": 734.0,
        "major_crops": ["Cotton", "Soyabean", "Maize", "Arhar"]
    },
    {
        "district_id": "PB_LUDHIANA",
        "state_name": "Punjab",
        "district_name": "Ludhiana",
        "latitude": 30.9010,
        "longitude": 75.8573,
        "agro_climatic_zone": "Trans-Gangetic Plains",
        "major_soil_type": "Alluvial Soil",
        "imd_annual_rainfall_mm": 680.0,
        "major_crops": ["Wheat", "Rice", "Maize", "Mustard"]
    },
    {
        "district_id": "PB_PATIALA",
        "state_name": "Punjab",
        "district_name": "Patiala",
        "latitude": 30.3398,
        "longitude": 76.3869,
        "agro_climatic_zone": "Trans-Gangetic Plains",
        "major_soil_type": "Alluvial Soil",
        "imd_annual_rainfall_mm": 650.0,
        "major_crops": ["Wheat", "Rice", "Sugarcane"]
    },
    {
        "district_id": "UP_VARANASI",
        "state_name": "Uttar Pradesh",
        "district_name": "Varanasi",
        "latitude": 25.3176,
        "longitude": 82.9739,
        "agro_climatic_zone": "Middle Gangetic Plains",
        "major_soil_type": "Alluvial Soil",
        "imd_annual_rainfall_mm": 1010.0,
        "major_crops": ["Rice", "Wheat", "Mustard", "Sugarcane"]
    },
    {
        "district_id": "UP_MEERUT",
        "state_name": "Uttar Pradesh",
        "district_name": "Meerut",
        "latitude": 28.9845,
        "longitude": 77.7064,
        "agro_climatic_zone": "Upper Gangetic Plains",
        "major_soil_type": "Alluvial Soil",
        "imd_annual_rainfall_mm": 840.0,
        "major_crops": ["Sugarcane", "Wheat", "Rice", "Mustard"]
    },
    {
        "district_id": "RJ_JAIPUR",
        "state_name": "Rajasthan",
        "district_name": "Jaipur",
        "latitude": 26.9124,
        "longitude": 75.7873,
        "agro_climatic_zone": "Semi-Arid Eastern Plain",
        "major_soil_type": "Sandy Loam",
        "imd_annual_rainfall_mm": 580.0,
        "major_crops": ["Mustard", "Wheat", "Gram", "Groundnut"]
    },
    {
        "district_id": "GJ_RAJKOT",
        "state_name": "Gujarat",
        "district_name": "Rajkot",
        "latitude": 22.3039,
        "longitude": 70.8022,
        "agro_climatic_zone": "Saurashtra Dry Zone",
        "major_soil_type": "Medium Black Soil",
        "imd_annual_rainfall_mm": 620.0,
        "major_crops": ["Cotton", "Groundnut", "Wheat"]
    },
    {
        "district_id": "KA_DHARWAD",
        "state_name": "Karnataka",
        "district_name": "Dharwad",
        "latitude": 15.4589,
        "longitude": 75.0078,
        "agro_climatic_zone": "Northern Transition Zone",
        "major_soil_type": "Black & Red Loam",
        "imd_annual_rainfall_mm": 740.0,
        "major_crops": ["Soyabean", "Cotton", "Maize", "Groundnut"]
    },
    {
        "district_id": "AP_GUNTUR",
        "state_name": "Andhra Pradesh",
        "district_name": "Guntur",
        "latitude": 16.3067,
        "longitude": 80.4365,
        "agro_climatic_zone": "East Coast Plains and Hills",
        "major_soil_type": "Black Cotton Soil",
        "imd_annual_rainfall_mm": 860.0,
        "major_crops": ["Cotton", "Rice", "Maize"]
    },
    {
        "district_id": "WB_BURDWAN",
        "state_name": "West Bengal",
        "district_name": "Bardhaman",
        "latitude": 23.2324,
        "longitude": 87.8615,
        "agro_climatic_zone": "Lower Gangetic Plains",
        "major_soil_type": "Alluvial Deltaic Soil",
        "imd_annual_rainfall_mm": 1400.0,
        "major_crops": ["Rice", "Mustard", "Wheat"]
    }
]
