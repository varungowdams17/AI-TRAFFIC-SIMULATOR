"""
greedy.py
Greedy Algorithm for Traffic Signal Optimization.

Purpose: Dynamically assign green signal to road with highest vehicle density.
Strategy: At each decision point, make the locally optimal choice (max density = green).
Used for: Real-time signal timing, throughput maximization.

Time Complexity:  O(n log n) for sorting roads by density
Space Complexity: O(1) auxiliary space
"""

from typing import Dict, List, Tuple


def greedy_signal_optimizer(
    densities: Dict[str, float],
    base_duration: int = 20,
    max_duration: int = 60,
    min_duration: int = 10
) -> Dict:
    """
    Apply Greedy Algorithm to determine optimal signal assignment.

    The greedy choice: Give green signal to the road with maximum vehicle density.
    Signal duration is proportional to density (more vehicles = longer green).

    Args:
        densities: {road: density_percent} for each road
        base_duration: Minimum green signal duration in seconds
        max_duration: Maximum green signal duration in seconds
        min_duration: Minimum red signal duration in seconds

    Returns:
        Dictionary with signal assignments and durations
    """
    if not densities:
        return {}

    # Step 1: Sort roads by density (descending) – O(n log n)
    sorted_roads = sorted(densities.items(), key=lambda x: x[1], reverse=True)

    # Step 2: Greedy choice – highest density road gets green
    green_road, green_density = sorted_roads[0]

    # Step 3: Calculate dynamic duration based on density
    # Formula: duration = base + (density/100) * (max - base)
    green_duration = int(base_duration + (green_density / 100) * (max_duration - base_duration))
    green_duration = max(min_duration, min(max_duration, green_duration))

    # Step 4: Assign signals to all roads
    signals = {}
    for road, density in densities.items():
        if road == green_road:
            signals[road] = {
                'state': 'green',
                'duration': green_duration,
                'density': density,
                'reason': f'Highest density ({density:.1f}%) – Greedy choice'
            }
        else:
            # Red roads get duration proportional to their position in sorted order
            signals[road] = {
                'state': 'red',
                'duration': min_duration + 5,
                'density': density,
                'reason': f'Lower density ({density:.1f}%) – Waiting'
            }

    return {
        'green_road': green_road,
        'green_duration': green_duration,
        'signals': signals,
        'sorted_roads': [{'road': r, 'density': d} for r, d in sorted_roads],
        'decision': f'GREEN → {green_road} ({green_density:.1f}% density, {green_duration}s)',
        'algorithm': 'Greedy – Maximum Density First'
    }


def greedy_route_selection(routes: List[Dict]) -> Dict:
    """
    Greedy selection of best route based on current traffic conditions.

    Args:
        routes: List of route dicts with 'path', 'distance', 'density'

    Returns:
        Best route selected greedily
    """
    if not routes:
        return {}

    # Greedy: minimize weighted cost = distance * (1 + density/100)
    def route_cost(route):
        density_factor = 1 + route.get('density', 0) / 100
        return route.get('distance', float('inf')) * density_factor

    best_route = min(routes, key=route_cost)
    best_route['selected'] = True
    best_route['cost'] = route_cost(best_route)

    return {
        'best_route': best_route,
        'all_routes': routes,
        'algorithm': 'Greedy – Minimum Weighted Cost'
    }


def calculate_optimal_cycle(densities: Dict[str, float], total_cycle: int = 120) -> Dict:
    """
    Calculate optimal signal cycle allocation using greedy proportional assignment.

    Allocates green time proportionally to vehicle density.

    Args:
        densities: Road densities
        total_cycle: Total cycle duration in seconds

    Returns:
        Optimal time allocation for each road
    """
    total_density = sum(densities.values())
    if total_density == 0:
        # Equal distribution if no traffic
        equal_time = total_cycle // len(densities)
        return {road: equal_time for road in densities}

    # Proportional allocation (greedy)
    allocation = {}
    for road, density in densities.items():
        proportion = density / total_density
        allocation[road] = max(10, int(proportion * total_cycle))

    return {
        'allocation': allocation,
        'total_cycle': total_cycle,
        'algorithm': 'Greedy Proportional Allocation'
    }


if __name__ == '__main__':
    # Test the greedy algorithm
    print("=== Greedy Signal Optimizer Test ===")

    test_densities = {'north': 65, 'south': 30, 'east': 80, 'west': 45}
    result = greedy_signal_optimizer(test_densities)

    print(f"\nDecision: {result['decision']}")
    print("\nSignal assignments:")
    for road, sig in result['signals'].items():
        print(f"  {road}: {sig['state'].upper()} ({sig['duration']}s) – {sig['reason']}")

    print("\nOptimal cycle allocation:")
    cycle = calculate_optimal_cycle(test_densities)
    for road, time in cycle['allocation'].items():
        print(f"  {road}: {time}s")
