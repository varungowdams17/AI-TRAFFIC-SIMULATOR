"""
traffic_routes.py
Flask routes for traffic simulation state management.
Handles signal updates, vehicle management, emergency events, and accidents.
"""

from flask import Blueprint, request, jsonify
import sqlite3
import json
import random
from datetime import datetime

from algorithms.greedy import greedy_signal_optimizer, calculate_optimal_cycle
from algorithms.priority_queue import TrafficPriorityQueue
from algorithms.searching import find_nearest_low_traffic_road

traffic_bp = Blueprint('traffic', __name__)

# In-memory simulation state (shared across requests)
_state = {
    'is_running': False,
    'densities': {'north': 30.0, 'south': 25.0, 'east': 40.0, 'west': 20.0},
    'signals': {
        'north': {'state': 'red',   'timer': 30, 'duration': 30},
        'south': {'state': 'green', 'timer': 15, 'duration': 30},
        'east':  {'state': 'red',   'timer': 20, 'duration': 25},
        'west':  {'state': 'red',   'timer': 25, 'duration': 20},
    },
    'active_signal': 'south',
    'emergency': None,
    'accidents': [],
    'vehicles': [],
    'total_vehicles': 0,
}

_priority_queue = TrafficPriorityQueue()


# ─── GET /api/traffic/state ───────────────────────────────────────────────────
@traffic_bp.route('/state', methods=['GET'])
def get_state():
    """Return current simulation state."""
    return jsonify({
        'success': True,
        'data': _state
    })


# ─── POST /api/traffic/start ──────────────────────────────────────────────────
@traffic_bp.route('/start', methods=['POST'])
def start_simulation():
    """Start the traffic simulation."""
    _state['is_running'] = True
    _log_event('simulation_start', None, 'Simulation started')
    return jsonify({'success': True, 'message': 'Simulation started'})


# ─── POST /api/traffic/stop ───────────────────────────────────────────────────
@traffic_bp.route('/stop', methods=['POST'])
def stop_simulation():
    """Stop the traffic simulation."""
    _state['is_running'] = False
    _log_event('simulation_stop', None, 'Simulation stopped')
    return jsonify({'success': True, 'message': 'Simulation stopped'})


# ─── POST /api/traffic/reset ──────────────────────────────────────────────────
@traffic_bp.route('/reset', methods=['POST'])
def reset_simulation():
    """Reset simulation to initial state."""
    _state['is_running'] = False
    _state['densities'] = {'north': 30.0, 'south': 25.0, 'east': 40.0, 'west': 20.0}
    _state['emergency'] = None
    _state['accidents'] = []
    _state['vehicles'] = []
    _state['total_vehicles'] = 0
    _priority_queue.__init__()
    _log_event('simulation_reset', None, 'Simulation reset')
    return jsonify({'success': True, 'message': 'Simulation reset'})


# ─── POST /api/traffic/update-density ────────────────────────────────────────
@traffic_bp.route('/update-density', methods=['POST'])
def update_density():
    """
    Update traffic density and recalculate optimal signals using Greedy Algorithm.
    """
    data = request.get_json()
    densities = data.get('densities', {})

    if not densities:
        return jsonify({'success': False, 'error': 'No density data provided'}), 400

    # Update state
    for road, density in densities.items():
        if road in _state['densities']:
            _state['densities'][road] = max(0.0, min(100.0, float(density)))

    # Apply Greedy Algorithm to optimize signals
    result = greedy_signal_optimizer(_state['densities'])
    _state['signals'] = {
        road: {
            'state': sig['state'],
            'timer': sig['duration'],
            'duration': sig['duration'],
            'density': sig['density']
        }
        for road, sig in result['signals'].items()
    }
    _state['active_signal'] = result['green_road']

    return jsonify({
        'success': True,
        'densities': _state['densities'],
        'signals': _state['signals'],
        'active_signal': _state['active_signal'],
        'greedy_decision': result['decision']
    })


# ─── POST /api/traffic/emergency ─────────────────────────────────────────────
@traffic_bp.route('/emergency', methods=['POST'])
def trigger_emergency():
    """
    Trigger emergency vehicle priority using Priority Queue.
    Immediately switches signal to green on emergency road.
    """
    data = request.get_json()
    vehicle_type = data.get('type', 'ambulance')
    road = data.get('road', 'north')

    # Add to priority queue
    vehicle = _priority_queue.insert(vehicle_type, road)

    # Process emergency (extract highest priority)
    result = _priority_queue.process_emergency()

    # Override signals – emergency road gets green
    for r in _state['signals']:
        _state['signals'][r]['state'] = 'green' if r == road else 'red'
        _state['signals'][r]['timer'] = 60 if r == road else 30

    _state['emergency'] = {
        'type': vehicle_type,
        'road': road,
        'priority': vehicle.priority,
        'timestamp': datetime.now().isoformat()
    }
    _state['active_signal'] = road

    _log_event('emergency', road, f'{vehicle_type} emergency on {road} road')

    return jsonify({
        'success': True,
        'emergency': _state['emergency'],
        'signals': _state['signals'],
        'message': f'🚨 {vehicle_type} priority activated on {road} road',
        'priority_queue_result': result
    })


# ─── POST /api/traffic/clear-emergency ───────────────────────────────────────
@traffic_bp.route('/clear-emergency', methods=['POST'])
def clear_emergency():
    """Clear emergency state and restore normal signal operation."""
    _state['emergency'] = None

    # Restore greedy-optimized signals
    result = greedy_signal_optimizer(_state['densities'])
    _state['active_signal'] = result['green_road']
    for road, sig in result['signals'].items():
        _state['signals'][road] = {
            'state': sig['state'],
            'timer': sig['duration'],
            'duration': sig['duration'],
            'density': sig['density']
        }

    _log_event('emergency_cleared', None, 'Emergency cleared, normal operation resumed')
    return jsonify({'success': True, 'message': 'Emergency cleared', 'signals': _state['signals']})


# ─── POST /api/traffic/accident ──────────────────────────────────────────────
@traffic_bp.route('/accident', methods=['POST'])
def trigger_accident():
    """
    Simulate an accident on a road.
    Increases density on that road and triggers rerouting.
    """
    data = request.get_json()
    road = data.get('road', 'north')

    accident = {
        'id': len(_state['accidents']) + 1,
        'road': road,
        'timestamp': datetime.now().isoformat(),
        'active': True
    }
    _state['accidents'].append(accident)

    # Increase density on accident road
    _state['densities'][road] = min(100.0, _state['densities'].get(road, 50.0) + 30.0)

    # Find alternate low-traffic road
    reroute = find_nearest_low_traffic_road(_state['densities'])

    _log_event('accident', road, f'Accident on {road} road')

    return jsonify({
        'success': True,
        'accident': accident,
        'reroute_recommendation': reroute,
        'message': f'⚠️ Accident on {road} – Rerouting via {reroute.get("best_road", "alternate")}'
    })


# ─── POST /api/traffic/clear-accident ────────────────────────────────────────
@traffic_bp.route('/clear-accident', methods=['POST'])
def clear_accident():
    """Clear accident and restore normal traffic flow."""
    data = request.get_json()
    accident_id = data.get('id')

    _state['accidents'] = [a for a in _state['accidents'] if a['id'] != accident_id]

    _log_event('accident_cleared', None, f'Accident {accident_id} cleared')
    return jsonify({'success': True, 'message': 'Accident cleared'})


# ─── GET /api/traffic/signals ─────────────────────────────────────────────────
@traffic_bp.route('/signals', methods=['GET'])
def get_signals():
    """Get current signal states with Greedy Algorithm decision."""
    result = greedy_signal_optimizer(_state['densities'])
    return jsonify({
        'success': True,
        'signals': _state['signals'],
        'active_signal': _state['active_signal'],
        'greedy_result': result
    })


# ─── POST /api/traffic/peak-hour ─────────────────────────────────────────────
@traffic_bp.route('/peak-hour', methods=['POST'])
def toggle_peak_hour():
    """Toggle peak hour mode – increases all road densities."""
    data = request.get_json()
    enable = data.get('enable', True)

    if enable:
        _state['densities'] = {'north': 85.0, 'south': 90.0, 'east': 80.0, 'west': 75.0}
        msg = 'Peak hour mode activated'
    else:
        _state['densities'] = {'north': 30.0, 'south': 25.0, 'east': 40.0, 'west': 20.0}
        msg = 'Peak hour mode deactivated'

    _log_event('peak_hour', None, msg)
    return jsonify({'success': True, 'message': msg, 'densities': _state['densities']})


# ─── Helper ───────────────────────────────────────────────────────────────────
def _log_event(event_type: str, road: str, description: str):
    """Log traffic event to database."""
    try:
        from flask import current_app
        db_path = current_app.config.get('DATABASE', 'database/traffic.db')
        conn = sqlite3.connect(db_path)
        conn.execute(
            'INSERT INTO traffic_events (event_type, road, description) VALUES (?, ?, ?)',
            (event_type, road, description)
        )
        conn.commit()
        conn.close()
    except Exception:
        pass  # Don't crash if DB unavailable
