"""
analytics_routes.py
Flask routes for analytics data – snapshots, history, reports.
"""

from flask import Blueprint, request, jsonify
import sqlite3
import json
from datetime import datetime

analytics_bp = Blueprint('analytics', __name__)


# ─── POST /api/analytics/snapshot ────────────────────────────────────────────
@analytics_bp.route('/snapshot', methods=['POST'])
def save_snapshot():
    """Save a simulation analytics snapshot to the database."""
    data = request.get_json() or {}

    try:
        from flask import current_app
        db_path = current_app.config.get('DATABASE', 'database/traffic.db')
        conn = sqlite3.connect(db_path)
        conn.execute('''
            INSERT INTO analytics_snapshots
            (total_vehicles, moving_vehicles, waiting_vehicles,
             avg_wait_time, congestion_percent, throughput,
             north_density, south_density, east_density, west_density)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('total_vehicles', 0),
            data.get('moving_vehicles', 0),
            data.get('waiting_vehicles', 0),
            data.get('avg_wait_time', 0),
            data.get('congestion_percent', 0),
            data.get('throughput', 0),
            data.get('north_density', 0),
            data.get('south_density', 0),
            data.get('east_density', 0),
            data.get('west_density', 0),
        ))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Snapshot saved'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ─── GET /api/analytics/history ──────────────────────────────────────────────
@analytics_bp.route('/history', methods=['GET'])
def get_history():
    """Get recent analytics snapshots for chart display."""
    limit = int(request.args.get('limit', 20))

    try:
        from flask import current_app
        db_path = current_app.config.get('DATABASE', 'database/traffic.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            'SELECT * FROM analytics_snapshots ORDER BY timestamp DESC LIMIT ?',
            (limit,)
        ).fetchall()
        conn.close()

        history = [dict(row) for row in reversed(rows)]
        return jsonify({'success': True, 'history': history, 'count': len(history)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e), 'history': []}), 200


# ─── GET /api/analytics/events ───────────────────────────────────────────────
@analytics_bp.route('/events', methods=['GET'])
def get_events():
    """Get recent traffic events (emergencies, accidents, etc.)."""
    limit = int(request.args.get('limit', 50))

    try:
        from flask import current_app
        db_path = current_app.config.get('DATABASE', 'database/traffic.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            'SELECT * FROM traffic_events ORDER BY timestamp DESC LIMIT ?',
            (limit,)
        ).fetchall()
        conn.close()

        events = [dict(row) for row in rows]
        return jsonify({'success': True, 'events': events, 'count': len(events)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e), 'events': []}), 200


# ─── GET /api/analytics/summary ──────────────────────────────────────────────
@analytics_bp.route('/summary', methods=['GET'])
def get_summary():
    """Get aggregated analytics summary."""
    try:
        from flask import current_app
        db_path = current_app.config.get('DATABASE', 'database/traffic.db')
        conn = sqlite3.connect(db_path)

        summary = conn.execute('''
            SELECT
                COUNT(*) as total_snapshots,
                AVG(congestion_percent) as avg_congestion,
                MAX(congestion_percent) as peak_congestion,
                AVG(avg_wait_time) as avg_wait,
                SUM(total_vehicles) as total_vehicles_processed,
                COUNT(CASE WHEN congestion_percent > 70 THEN 1 END) as high_congestion_periods
            FROM analytics_snapshots
        ''').fetchone()

        event_counts = conn.execute('''
            SELECT event_type, COUNT(*) as count
            FROM traffic_events
            GROUP BY event_type
        ''').fetchall()

        conn.close()

        return jsonify({
            'success': True,
            'summary': {
                'total_snapshots': summary[0] or 0,
                'avg_congestion': round(summary[1] or 0, 1),
                'peak_congestion': round(summary[2] or 0, 1),
                'avg_wait_time': round(summary[3] or 0, 1),
                'total_vehicles_processed': summary[4] or 0,
                'high_congestion_periods': summary[5] or 0,
            },
            'event_counts': {row[0]: row[1] for row in event_counts}
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
