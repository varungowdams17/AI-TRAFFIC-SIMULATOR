"""
dijkstra.py
Dijkstra's Shortest Path Algorithm implementation for traffic routing.

Purpose: Find shortest path between intersections in the city road network.
Used for: Emergency vehicle routing, accident-based rerouting, optimal path finding.

Time Complexity:  O((V + E) log V) using min-heap priority queue
Space Complexity: O(V) for distance and predecessor arrays
"""

import heapq
from typing import Dict, List, Tuple, Optional


def dijkstra(graph: Dict[str, Dict[str, float]], source: str) -> Tuple[Dict, Dict]:
    """
    Run Dijkstra's algorithm from source node.

    Args:
        graph: Adjacency dict {node: {neighbor: weight, ...}, ...}
        source: Starting node

    Returns:
        distances: Shortest distance from source to each node
        predecessors: Previous node in shortest path tree
    """
    # Initialize distances to infinity for all nodes
    distances = {node: float('inf') for node in graph}
    distances[source] = 0

    # Track predecessors for path reconstruction
    predecessors = {node: None for node in graph}

    # Min-heap: (distance, node)
    heap = [(0, source)]

    # Track visited nodes
    visited = set()

    while heap:
        # Extract node with minimum distance (greedy choice)
        current_dist, current_node = heapq.heappop(heap)

        # Skip if already processed
        if current_node in visited:
            continue
        visited.add(current_node)

        # Explore neighbors
        for neighbor, weight in graph[current_node].items():
            if neighbor in visited:
                continue

            # Relaxation step: update if shorter path found
            new_dist = current_dist + weight
            if new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                predecessors[neighbor] = current_node
                heapq.heappush(heap, (new_dist, neighbor))

    return distances, predecessors


def get_shortest_path(predecessors: Dict, source: str, destination: str) -> List[str]:
    """
    Reconstruct shortest path from source to destination.

    Args:
        predecessors: Predecessor map from dijkstra()
        source: Start node
        destination: End node

    Returns:
        List of nodes forming the shortest path
    """
    path = []
    current = destination

    while current is not None:
        path.append(current)
        current = predecessors.get(current)

    path.reverse()

    # Validate path starts at source
    if path and path[0] == source:
        return path
    return []  # No path found


def find_alternate_routes(
    graph: Dict[str, Dict[str, float]],
    source: str,
    destination: str,
    blocked_edges: List[Tuple[str, str]] = None
) -> Dict:
    """
    Find shortest path and alternate routes, optionally avoiding blocked roads.

    Args:
        graph: Road network graph
        source: Origin intersection
        destination: Target intersection
        blocked_edges: List of (from, to) tuples representing blocked roads

    Returns:
        Dictionary with primary path, alternate path, and distances
    """
    blocked_edges = blocked_edges or []

    # Build modified graph excluding blocked edges
    modified_graph = {}
    for node, neighbors in graph.items():
        modified_graph[node] = {}
        for neighbor, weight in neighbors.items():
            if (node, neighbor) not in blocked_edges:
                modified_graph[node][neighbor] = weight

    # Find primary shortest path
    distances, predecessors = dijkstra(modified_graph, source)
    primary_path = get_shortest_path(predecessors, source, destination)
    primary_dist = distances.get(destination, float('inf'))

    # Find alternate path by temporarily blocking primary path edges
    alternate_path = []
    alternate_dist = float('inf')

    if len(primary_path) > 1:
        # Block the first edge of primary path to force alternate route
        first_edge = (primary_path[0], primary_path[1])
        alt_blocked = blocked_edges + [first_edge]

        alt_graph = {}
        for node, neighbors in graph.items():
            alt_graph[node] = {}
            for neighbor, weight in neighbors.items():
                if (node, neighbor) not in alt_blocked:
                    alt_graph[node][neighbor] = weight

        alt_distances, alt_predecessors = dijkstra(alt_graph, source)
        alternate_path = get_shortest_path(alt_predecessors, source, destination)
        alternate_dist = alt_distances.get(destination, float('inf'))

    return {
        'source': source,
        'destination': destination,
        'primary_path': primary_path,
        'primary_distance': primary_dist if primary_dist != float('inf') else None,
        'alternate_path': alternate_path,
        'alternate_distance': alternate_dist if alternate_dist != float('inf') else None,
        'blocked_edges': blocked_edges,
        'all_distances': {k: v for k, v in distances.items() if v != float('inf')}
    }


# ─── City Road Network ────────────────────────────────────────────────────────
CITY_GRAPH = {
    'Home':      {'School': 4, 'Market': 2},
    'School':    {'Home': 4, 'Hospital': 5, 'Center': 3},
    'Hospital':  {'School': 5, 'Airport': 2},
    'Market':    {'Home': 2, 'Center': 6, 'Park': 3},
    'Center':    {'School': 3, 'Market': 6, 'Airport': 4, 'Station': 5},
    'Airport':   {'Hospital': 2, 'Center': 4, 'Station': 3},
    'Park':      {'Market': 3, 'Station': 7},
    'Station':   {'Center': 5, 'Airport': 3, 'Park': 7},
}


if __name__ == '__main__':
    # Test the algorithm
    print("=== Dijkstra's Algorithm Test ===")
    distances, predecessors = dijkstra(CITY_GRAPH, 'Home')

    print("\nShortest distances from Home:")
    for node, dist in sorted(distances.items(), key=lambda x: x[1]):
        path = get_shortest_path(predecessors, 'Home', node)
        print(f"  {node}: {dist} km | Path: {' → '.join(path)}")

    print("\nAlternate routes (with accident on Home→Market):")
    result = find_alternate_routes(CITY_GRAPH, 'Home', 'Airport', [('Home', 'Market')])
    print(f"  Primary: {' → '.join(result['primary_path'])} ({result['primary_distance']} km)")
    print(f"  Alternate: {' → '.join(result['alternate_path'])} ({result['alternate_distance']} km)")
