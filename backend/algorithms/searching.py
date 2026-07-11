"""
searching.py
Searching Algorithms for Traffic Route Discovery.

Implements:
  - Linear Search   : Find vehicle by ID in unsorted queue
  - Binary Search   : Find route in sorted route table
  - Jump Search     : Find nearest low-traffic road
  - Interpolation   : Estimate road density position
  - Hash-based      : O(1) intersection lookup

Used for: Finding nearest low-traffic routes, vehicle lookup,
          intersection search in road network.
"""

from typing import List, Dict, Optional, Tuple
import math


# ─── Linear Search ────────────────────────────────────────────────────────────
def linear_search(vehicles: List[Dict], target_id: int) -> Optional[Dict]:
    """
    Linear Search – scan each element until target found.

    Time Complexity:  O(n) worst/average, O(1) best
    Space Complexity: O(1)

    Used for: Finding a specific vehicle in an unsorted queue.

    Args:
        vehicles:  List of vehicle dicts
        target_id: Vehicle ID to find

    Returns:
        Vehicle dict if found, None otherwise
    """
    for i, vehicle in enumerate(vehicles):
        if vehicle.get('id') == target_id:
            return {'vehicle': vehicle, 'index': i, 'comparisons': i + 1}
    return None


# ─── Binary Search ────────────────────────────────────────────────────────────
def binary_search_route(
    routes: List[Dict],
    target_distance: float,
    key: str = 'distance'
) -> Optional[Dict]:
    """
    Binary Search – find route with specific distance in sorted route table.

    PRECONDITION: routes must be sorted by key (ascending).

    Time Complexity:  O(log n)
    Space Complexity: O(1)

    Used for: Finding a route with a specific distance in the sorted route table.

    Args:
        routes:          Sorted list of route dicts
        target_distance: Distance to search for
        key:             Sort key

    Returns:
        Route dict if found, closest match otherwise
    """
    if not routes:
        return None

    low, high = 0, len(routes) - 1
    comparisons = 0
    closest = routes[0]
    closest_diff = abs(routes[0][key] - target_distance)

    while low <= high:
        mid = (low + high) // 2
        comparisons += 1
        diff = abs(routes[mid][key] - target_distance)

        if diff < closest_diff:
            closest = routes[mid]
            closest_diff = diff

        if routes[mid][key] == target_distance:
            return {
                'route': routes[mid],
                'index': mid,
                'exact_match': True,
                'comparisons': comparisons
            }
        elif routes[mid][key] < target_distance:
            low = mid + 1
        else:
            high = mid - 1

    return {
        'route': closest,
        'exact_match': False,
        'comparisons': comparisons,
        'closest_distance': closest[key]
    }


# ─── Jump Search ──────────────────────────────────────────────────────────────
def jump_search_low_traffic(
    roads: List[Dict],
    max_density: float = 40.0
) -> Optional[Dict]:
    """
    Jump Search – find first road with density below threshold.

    Roads must be sorted by density (ascending) for jump search.

    Time Complexity:  O(√n)
    Space Complexity: O(1)

    Used for: Finding nearest low-traffic road for rerouting.

    Args:
        roads:       List of road dicts sorted by density ascending
        max_density: Maximum acceptable density threshold

    Returns:
        First road with density <= max_density
    """
    n = len(roads)
    if n == 0:
        return None

    step = int(math.sqrt(n))
    prev = 0
    comparisons = 0

    # Jump forward in blocks of √n
    while prev < n and roads[min(step, n) - 1]['density'] <= max_density:
        comparisons += 1
        prev = step
        step += int(math.sqrt(n))
        if prev >= n:
            return None

    # Linear search in the identified block
    while prev < min(step, n):
        comparisons += 1
        if roads[prev]['density'] <= max_density:
            return {
                'road': roads[prev],
                'index': prev,
                'comparisons': comparisons
            }
        prev += 1

    return None


# ─── Interpolation Search ─────────────────────────────────────────────────────
def interpolation_search_density(
    densities: List[float],
    target: float
) -> Dict:
    """
    Interpolation Search – estimate position based on value distribution.
    Better than binary search for uniformly distributed data.

    Time Complexity:  O(log log n) average for uniform data, O(n) worst
    Space Complexity: O(1)

    Used for: Estimating which road segment has a specific density level.

    Args:
        densities: Sorted list of density values
        target:    Target density to find

    Returns:
        Search result with index and comparisons
    """
    low, high = 0, len(densities) - 1
    comparisons = 0

    while low <= high and densities[low] <= target <= densities[high]:
        comparisons += 1

        if densities[low] == densities[high]:
            if densities[low] == target:
                return {'index': low, 'found': True, 'comparisons': comparisons}
            break

        # Interpolation formula: estimate position
        pos = low + int(
            (target - densities[low]) * (high - low) /
            (densities[high] - densities[low])
        )
        pos = max(low, min(high, pos))

        if densities[pos] == target:
            return {'index': pos, 'found': True, 'comparisons': comparisons}
        elif densities[pos] < target:
            low = pos + 1
        else:
            high = pos - 1

    return {'index': -1, 'found': False, 'comparisons': comparisons}


# ─── Hash-based Intersection Lookup ──────────────────────────────────────────
class IntersectionIndex:
    """
    Hash map for O(1) intersection lookup by name or coordinates.
    Used for fast road network queries.
    """

    def __init__(self):
        self._by_name: Dict[str, Dict] = {}
        self._by_coords: Dict[Tuple, Dict] = {}

    def add(self, name: str, x: float, y: float, data: Dict = None):
        """Add intersection to index."""
        entry = {'name': name, 'x': x, 'y': y, **(data or {})}
        self._by_name[name.lower()] = entry
        self._by_coords[(round(x, 1), round(y, 1))] = entry

    def find_by_name(self, name: str) -> Optional[Dict]:
        """O(1) lookup by intersection name."""
        return self._by_name.get(name.lower())

    def find_by_coords(self, x: float, y: float, tolerance: float = 0.5) -> Optional[Dict]:
        """O(1) lookup by coordinates with tolerance."""
        key = (round(x, 1), round(y, 1))
        if key in self._by_coords:
            return self._by_coords[key]
        # Fallback: scan nearby coordinates
        for (cx, cy), entry in self._by_coords.items():
            if abs(cx - x) <= tolerance and abs(cy - y) <= tolerance:
                return entry
        return None

    def find_nearest_low_traffic(self, densities: Dict[str, float], threshold: float = 40.0) -> List[Dict]:
        """Find all intersections with density below threshold."""
        results = []
        for name, entry in self._by_name.items():
            density = densities.get(name, 100.0)
            if density <= threshold:
                results.append({**entry, 'density': density})
        return sorted(results, key=lambda x: x['density'])


def find_nearest_low_traffic_road(
    densities: Dict[str, float],
    threshold: float = 40.0
) -> Dict:
    """
    Find the road with lowest traffic density using linear search.

    Args:
        densities: {road: density_percent}
        threshold: Maximum acceptable density

    Returns:
        Best road for rerouting
    """
    if not densities:
        return {}

    # Linear search for minimum density
    min_road = min(densities, key=densities.get)
    min_density = densities[min_road]

    low_traffic_roads = [
        {'road': road, 'density': density}
        for road, density in densities.items()
        if density <= threshold
    ]

    return {
        'best_road': min_road,
        'best_density': min_density,
        'low_traffic_roads': sorted(low_traffic_roads, key=lambda x: x['density']),
        'recommendation': f'Reroute via {min_road} ({min_density:.1f}% density)',
        'algorithm': 'Linear Search – Minimum Density'
    }


if __name__ == '__main__':
    print("=== Searching Algorithms Demo ===")

    # Linear search
    vehicles = [{'id': i, 'type': 'car', 'road': 'north'} for i in range(1, 11)]
    result = linear_search(vehicles, 7)
    print(f"\nLinear Search (id=7): found at index {result['index']}, {result['comparisons']} comparisons")

    # Binary search
    routes = [{'id': i, 'distance': i * 2.5, 'path': []} for i in range(1, 20)]
    result = binary_search_route(routes, 17.5)
    print(f"Binary Search (dist=17.5): {result['comparisons']} comparisons, exact={result['exact_match']}")

    # Find low traffic road
    densities = {'north': 65, 'south': 30, 'east': 80, 'west': 25}
    result = find_nearest_low_traffic_road(densities)
    print(f"Nearest low-traffic: {result['recommendation']}")
