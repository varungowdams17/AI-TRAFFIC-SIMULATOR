"""
db.py
SQLite database initialization and helper functions.
"""

import sqlite3
import os
from flask import g


def get_db(app):
    """Get database connection, creating it if needed."""
    if 'db' not in g:
        g.db = sqlite3.connect(
            app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(e=None):
    """Close database connection."""
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db(app):
    """Initialize database schema and seed data."""
    db_path = app.config['DATABASE']
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Traffic events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS traffic_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            road TEXT,
            description TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Analytics snapshots table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS analytics_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_vehicles INTEGER DEFAULT 0,
            moving_vehicles INTEGER DEFAULT 0,
            waiting_vehicles INTEGER DEFAULT 0,
            avg_wait_time REAL DEFAULT 0,
            congestion_percent REAL DEFAULT 0,
            throughput INTEGER DEFAULT 0,
            north_density REAL DEFAULT 0,
            south_density REAL DEFAULT 0,
            east_density REAL DEFAULT 0,
            west_density REAL DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Algorithm results table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS algorithm_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            algorithm TEXT NOT NULL,
            input_data TEXT,
            result TEXT,
            execution_time_ms REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Seed some initial traffic events
    cursor.execute('''
        INSERT OR IGNORE INTO traffic_events (id, event_type, road, description)
        VALUES
            (1, 'system_start', NULL, 'AAI Traffic Simulator initialized'),
            (2, 'signal_update', 'north', 'Initial signal configuration applied'),
            (3, 'algorithm_run', NULL, 'Greedy signal optimizer activated')
    ''')

    conn.commit()
    conn.close()
    print(f"[DB] Database initialized at {db_path}")
