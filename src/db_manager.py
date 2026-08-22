"""
src/db_manager.py
Database query and retrieval interface for unified_farm_engine.db
Features self-healing auto-initialization if the database file is not present on disk.
"""

import os
import sqlite3
from typing import List, Dict, Any, Optional
from src.config import UNIFIED_DB_PATH

class DatabaseManager:
    def __init__(self, db_path: str = UNIFIED_DB_PATH):
        self.db_path = db_path
        self._ensure_database_exists()

    def _ensure_database_exists(self):
        """Self-healing check: builds database automatically if missing."""
        if not os.path.exists(self.db_path) or os.path.getsize(self.db_path) == 0:
            from src.db_builder import build_database
            build_database()

    def _get_connection(self):
        self._ensure_database_exists()
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def get_all_districts(self) -> List[Dict[str, Any]]:
        """Returns all district profiles in India master catalog."""
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM geo_districts ORDER BY state_name, district_name")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def get_district_by_id(self, district_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single district profile by ID."""
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM geo_districts WHERE district_id = ?", (district_id,))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    def get_district_by_name(self, state_name: str, district_name: str) -> Optional[Dict[str, Any]]:
        """Retrieves district by state and district name (case-insensitive)."""
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT * FROM geo_districts WHERE LOWER(state_name) = LOWER(?) AND LOWER(district_name) = LOWER(?)",
            (state_name.strip(), district_name.strip())
        )
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    def get_crop_profile(self, crop_name: str) -> Optional[Dict[str, Any]]:
        """Retrieves crop agronomic requirements."""
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM crop_master WHERE crop_name = ?", (crop_name,))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None

    def get_all_crops(self) -> List[Dict[str, Any]]:
        """Retrieves all crop agronomic profiles."""
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM crop_master ORDER BY crop_name")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def get_historical_crop_baselines(self, district_id: str, season: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Retrieves historical crop yield, price, cost, and profit benchmarks for a district.
        Optionally filtered by season ('Kharif', 'Rabi', 'Zaid', 'Whole Year').
        """
        conn = self._get_connection()
        cur = conn.cursor()
        if season:
            cur.execute("""
            SELECT b.*, c.water_req_mm, c.drought_sensitivity, c.waterlogging_sensitivity,
                   c.heat_stress_threshold, c.temp_opt_min, c.temp_opt_max, c.min_acres, c.max_acre_share, c.description
            FROM district_crop_historical_baseline b
            JOIN crop_master c ON b.crop_name = c.crop_name
            WHERE b.district_id = ? AND (b.season = ? OR b.season = 'Whole Year')
            ORDER BY b.net_profit_per_ha DESC
            """, (district_id, season))
        else:
            cur.execute("""
            SELECT b.*, c.water_req_mm, c.drought_sensitivity, c.waterlogging_sensitivity,
                   c.heat_stress_threshold, c.temp_opt_min, c.temp_opt_max, c.min_acres, c.max_acre_share, c.description
            FROM district_crop_historical_baseline b
            JOIN crop_master c ON b.crop_name = c.crop_name
            WHERE b.district_id = ?
            ORDER BY b.net_profit_per_ha DESC
            """, (district_id,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def get_imd_rainfall_normals(self, district_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves IMD historical rainfall normals for a district."""
        conn = self._get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM imd_rainfall_normals WHERE district_id = ?", (district_id,))
        row = cur.fetchone()
        conn.close()
        return dict(row) if row else None
