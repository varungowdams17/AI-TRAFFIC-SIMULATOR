"""
algorithm_routes.py
Flask routes exposing ADA algorithm results via REST API.
Each endpoint runs a specific algorithm and returns results + visualization data.
"""

from flask import Blueprint, request, jsonify
import time

from algorithms.dijkstra import dijkstra, get_shortest_path, find_alternate_routes, CITY_GRAPH
from algorithms.greedy import greedy_signal_optimizer, calculate_optimal_cycle
from algorithms.priority_queue import TrafficPriorityQueue, demonstrate_priority_queue
from algorithms.dynamic_programming import (
    predict_traffic_density, optimal_signal_schedule, congestion_prediction_score
)
from algorithms.sorting import bubble_sort, merge_sort, quick_sort, benchmark_sorts
from algorithms.searching import (
    linear_search, binary_search_route, find_nearest_low_traffic_road
)
from algorithms.graph import build_city_network

algorithm_bp = Blueprint('algorithms', __name__)


# ─── GET /api/algorithms/dijkstra ────────────────────────────────────────────
@algorithm_bp.route('/dijkstra', methods=['POST'])
def run_dijkstra():
    """
    Run Dijkstra's algorithm on the city road network.
    Body: { source, destination, blocked_edges? }
    """
    data = request.get_json() or {}
    source = data.get('source', 'Home')
    destination = data.get('destination', 'Airport')
    blocked = data.get('blocked_edges', [])
    blocked_tuples = [(e[0], e[1]) for e in blocked if len(e) == 2]

    start_time = time.perf_counter()

    result = find_alternate_routes(CITY_GRAPH, source, destination, blocked_tuples)

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return jsonify({
        'success': True,
        'algorithm': "Dijkstra's Shortest Path",
        'time_complexity': 'O((V + E) log V)',
        'space_complexity': 'O(V)',
        'execution_time_ms': round(elapsed_ms, 3),
        'result': result,
        'graph_nodes': list(CITY_GRAPH.keys()),
        'graph_edges': [
            {'from': u, 'to': v, 'weight': w}
            for u, neighbors in CITY_GRAPH.items()
            for v, w in neighbors.items()
        ]
    })


# ─── POST /api/algorithms/greedy ─────────────────────────────────────────────
@algorithm_bp.route('/greedy', methods=['POST'])
def run_greedy():
    """
    Run Greedy signal optimization.
    Body: { densities: {north, south, east, west} }
    """
    data = request.get_json() or {}
    densities = data.get('densities', {'north': 65, 'south': 30, 'east': 80, 'west': 45})

    start_time = time.perf_counter()
    result = greedy_signal_optimizer(densities)
    cycle = calculate_optimal_cycle(densities)
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return jsonify({
        'success': True,
        'algorithm': 'Greedy Signal Optimization',
        'time_complexity': 'O(n log n)',
        'space_complexity': 'O(1)',
        'execution_time_ms': round(elapsed_ms, 3),
        'result': result,
        'optimal_cycle': cycle
    })


# ─── POST /api/algorithms/priority-queue ─────────────────────────────────────
@algorithm_bp.route('/priority-queue', methods=['POST'])
def run_priority_queue():
    """
    Demonstrate Priority Queue with given vehicles.
    Body: { vehicles: [{type, road}, ...] }
    """
    data = request.get_json() or {}
    vehicles_input = data.get('vehicles', [
        {'type': 'car', 'road': 'north'},
        {'type': 'ambulance', 'road': 'south'},
        {'type': 'bus', 'road': 'east'},
        {'type': 'police', 'road': 'west'},
        {'type': 'truck', 'road': 'north'},
    ])

    pq = TrafficPriorityQueue()
    start_time = time.perf_counter()

    for v in vehicles_input:
        pq.insert(v.get('type', 'car'), v.get('road', 'north'))

    queue_state = pq.to_list()
    has_emergency = pq.has_emergency()
    emergency_result = pq.process_emergency() if has_emergency else None

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return jsonify({
        'success': True,
        'algorithm': 'Priority Queue (Max-Heap)',
        'time_complexity': 'O(log n) per operation',
        'space_complexity': 'O(n)',
        'execution_time_ms': round(elapsed_ms, 3),
        'queue': queue_state,
        'has_emergency': has_emergency,
        'emergency_result': emergency_result,
        'queue_size': pq.size()
    })


# ─── POST /api/algorithms/dp ─────────────────────────────────────────────────
@algorithm_bp.route('/dp', methods=['POST'])
def run_dp():
    """
    Run Dynamic Programming traffic prediction.
    Body: { history: [...], densities: {...}, time_of_day: int }
    """
    data = request.get_json() or {}
    roads = ['north', 'south', 'east', 'west']

    history = data.get('history', [
        {'north': 30, 'south': 25, 'east': 40, 'west': 20},
        {'north': 40, 'south': 30, 'east': 50, 'west': 25},
        {'north': 55, 'south': 35, 'east': 65, 'west': 32},
        {'north': 65, 'south': 40, 'east': 75, 'west': 38},
    ])
    densities = data.get('densities', {'north': 65, 'south': 40, 'east': 75, 'west': 38})
    time_of_day = data.get('time_of_day', 8)

    start_time = time.perf_counter()

    predictions = predict_traffic_density(history, roads, steps_ahead=5)
    schedule = optimal_signal_schedule(densities)
    congestion = congestion_prediction_score(densities, time_of_day)

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return jsonify({
        'success': True,
        'algorithm': 'Dynamic Programming',
        'time_complexity': 'O(T × R)',
        'space_complexity': 'O(T × R)',
        'execution_time_ms': round(elapsed_ms, 3),
        'predictions': predictions,
        'optimal_schedule': schedule,
        'congestion_forecast': congestion
    })


# ─── POST /api/algorithms/sort ────────────────────────────────────────────────
@algorithm_bp.route('/sort', methods=['POST'])
def run_sort():
    """
    Run sorting algorithms on vehicle list.
    Body: { vehicles: [...], algorithm: 'bubble'|'merge'|'quick' }
    """
    data = request.get_json() or {}
    vehicles = data.get('vehicles', [
        {'id': 1, 'type': 'car',       'priority': 1,  'road': 'north'},
        {'id': 2, 'type': 'ambulance', 'priority': 10, 'road': 'south'},
        {'id': 3, 'type': 'bus',       'priority': 3,  'road': 'east'},
        {'id': 4, 'type': 'police',    'priority': 9,  'road': 'west'},
        {'id': 5, 'type': 'truck',     'priority': 2,  'road': 'north'},
    ])
    algorithm = data.get('algorithm', 'bubble')

    start_time = time.perf_counter()

    if algorithm == 'merge':
        sorted_v = merge_sort(vehicles)
        steps = []
        algo_name = 'Merge Sort'
        complexity = 'O(n log n)'
    elif algorithm == 'quick':
        sorted_v = quick_sort(vehicles)
        steps = []
        algo_name = 'Quick Sort'
        complexity = 'O(n log n) avg'
    else:
        sorted_v, steps = bubble_sort(vehicles)
        algo_name = 'Bubble Sort'
        complexity = 'O(n²)'

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return jsonify({
        'success': True,
        'algorithm': algo_name,
        'time_complexity': complexity,
        'space_complexity': 'O(1)' if algorithm != 'merge' else 'O(n)',
        'execution_time_ms': round(elapsed_ms, 3),
        'original': vehicles,
        'sorted': sorted_v,
        'steps': steps[:50],  # Limit steps for response size
        'total_steps': len(steps)
    })


# ─── POST /api/algorithms/search ─────────────────────────────────────────────
@algorithm_bp.route('/search', methods=['POST'])
def run_search():
    """
    Run searching algorithms.
    Body: { densities: {...}, target_id?: int }
    """
    data = request.get_json() or {}
    densities = data.get('densities', {'north': 65, 'south': 30, 'east': 80, 'west': 25})

    start_time = time.perf_counter()
    result = find_nearest_low_traffic_road(densities)
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    return jsonify({
        'success': True,
        'algorithm': 'Linear Search – Minimum Density',
        'time_complexity': 'O(n)',
        'space_complexity': 'O(1)',
        'execution_time_ms': round(elapsed_ms, 3),
        'result': result
    })


# ─── GET /api/algorithms/graph ────────────────────────────────────────────────
@algorithm_bp.route('/graph', methods=['GET'])
def get_graph():
    """Return city road network graph data for visualization."""
    network = build_city_network()
    source = request.args.get('source', 'Home')

    bfs_result = network.bfs(source)
    bfs_path = network.bfs_path(source, 'Airport')
    dfs_result = network.dfs(source)
    stats = network.get_network_stats()

    return jsonify({
        'success': True,
        'graph': network.to_dict(),
        'bfs_distances': bfs_result,
        'bfs_path_to_airport': bfs_path,
        'dfs_order': dfs_result,
        'stats': stats
    })


# ─── GET /api/algorithms/benchmark ───────────────────────────────────────────
@algorithm_bp.route('/benchmark', methods=['GET'])
def run_benchmark():
    """Benchmark all sorting algorithms."""
    n = int(request.args.get('n', 100))
    results = benchmark_sorts(min(n, 500))  # Cap at 500 for performance
    return jsonify({
        'success': True,
        'n': n,
        'results': results
    })
