"""
graph.py
Graph Algorithms for Road Network Modeling.

Purpose: Model city road network as a weighted graph.
         BFS for shortest hop-count paths, DFS for connectivity analysis,
         topological sort for traffic flow ordering.

Time Complexity:  BFS/DFS O(V + E)
Space Complexity: O(V + E) for adjacency list
"""

from collections import deque, defaultdict
from typing import Dict, List, Set, Optional, Tuple


class RoadNetwork:
    """
    Weighted directed graph representing a city road network.
    Nodes = intersections, Edges = roads with distance/time weights.
    """

    def __init__(self):
        # Adjacency list: {node: [(neighbor, weight), ...]}
        self.adj: Dict[str, List[Tuple[str, float]]] = defaultdict(list)
        self.nodes: Set[str] = set()
        self.edge_count = 0

    def add_node(self, node: str):
        """Add an intersection to the network."""
        self.nodes.add(node)
        if node not in self.adj:
            self.adj[node] = []

    def add_edge(self, from_node: str, to_node: str, weight: float = 1.0, bidirectional: bool = True):
        """
        Add a road between two intersections.

        Args:
            from_node: Source intersection
            to_node:   Destination intersection
            weight:    Road distance/travel time
            bidirectional: If True, add edge in both directions
        """
        self.nodes.add(from_node)
        self.nodes.add(to_node)
        self.adj[from_node].append((to_node, weight))
        self.edge_count += 1

        if bidirectional:
            self.adj[to_node].append((from_node, weight))
            self.edge_count += 1

    def bfs(self, source: str) -> Dict[str, int]:
        """
        Breadth-First Search from source node.
        Finds minimum hop-count (number of roads) to each node.

        Time Complexity: O(V + E)

        Args:
            source: Starting intersection

        Returns:
            Dictionary of {node: hop_count}
        """
        if source not in self.nodes:
            return {}

        visited = {source: 0}
        queue = deque([source])

        while queue:
            node = queue.popleft()
            for neighbor, _ in self.adj[node]:
                if neighbor not in visited:
                    visited[neighbor] = visited[node] + 1
                    queue.append(neighbor)

        return visited

    def bfs_path(self, source: str, destination: str) -> List[str]:
        """
        BFS to find minimum-hop path between two intersections.

        Returns:
            List of nodes forming the path, empty if no path
        """
        if source not in self.nodes or destination not in self.nodes:
            return []

        visited = {source: None}  # node -> predecessor
        queue = deque([source])

        while queue:
            node = queue.popleft()
            if node == destination:
                break
            for neighbor, _ in self.adj[node]:
                if neighbor not in visited:
                    visited[neighbor] = node
                    queue.append(neighbor)

        # Reconstruct path
        if destination not in visited:
            return []

        path = []
        current = destination
        while current is not None:
            path.append(current)
            current = visited[current]
        path.reverse()
        return path

    def dfs(self, source: str, visited: Set[str] = None) -> List[str]:
        """
        Depth-First Search from source node.
        Used for connectivity analysis and cycle detection.

        Time Complexity: O(V + E)

        Args:
            source: Starting intersection
            visited: Set of already-visited nodes (for recursive calls)

        Returns:
            List of nodes visited in DFS order
        """
        if visited is None:
            visited = set()

        visited.add(source)
        order = [source]

        for neighbor, _ in self.adj[source]:
            if neighbor not in visited:
                order.extend(self.dfs(neighbor, visited))

        return order

    def is_connected(self) -> bool:
        """Check if the road network is fully connected (all intersections reachable)."""
        if not self.nodes:
            return True
        start = next(iter(self.nodes))
        visited = set(self.dfs(start))
        return visited == self.nodes

    def find_all_paths(self, source: str, destination: str, max_paths: int = 3) -> List[List[str]]:
        """
        Find multiple paths between source and destination using DFS.

        Args:
            source: Start intersection
            destination: End intersection
            max_paths: Maximum number of paths to find

        Returns:
            List of paths (each path is a list of nodes)
        """
        all_paths = []

        def dfs_paths(current, dest, visited, path):
            if len(all_paths) >= max_paths:
                return
            if current == dest:
                all_paths.append(list(path))
                return
            for neighbor, _ in self.adj[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    path.append(neighbor)
                    dfs_paths(neighbor, dest, visited, path)
                    path.pop()
                    visited.remove(neighbor)

        dfs_paths(source, destination, {source}, [source])
        return all_paths

    def get_degree(self, node: str) -> Dict[str, int]:
        """Get in-degree and out-degree of a node (intersection complexity)."""
        out_degree = len(self.adj.get(node, []))
        in_degree = sum(1 for n in self.nodes for nb, _ in self.adj.get(n, []) if nb == node)
        return {'in': in_degree, 'out': out_degree, 'total': in_degree + out_degree}

    def get_network_stats(self) -> Dict:
        """Get overall network statistics."""
        return {
            'nodes': len(self.nodes),
            'edges': self.edge_count,
            'is_connected': self.is_connected(),
            'avg_degree': self.edge_count / max(len(self.nodes), 1),
            'node_list': sorted(self.nodes)
        }

    def to_dict(self) -> Dict:
        """Serialize graph to dictionary for API response."""
        return {
            'nodes': list(self.nodes),
            'edges': [
                {'from': node, 'to': nb, 'weight': w}
                for node, neighbors in self.adj.items()
                for nb, w in neighbors
            ],
            'stats': self.get_network_stats()
        }


def build_city_network() -> RoadNetwork:
    """Build the default city road network for the simulator."""
    network = RoadNetwork()

    roads = [
        ('Home',     'School',   4.0),
        ('Home',     'Market',   2.0),
        ('School',   'Hospital', 5.0),
        ('School',   'Center',   3.0),
        ('Hospital', 'Airport',  2.0),
        ('Market',   'Center',   6.0),
        ('Market',   'Park',     3.0),
        ('Center',   'Airport',  4.0),
        ('Center',   'Station',  5.0),
        ('Airport',  'Station',  3.0),
        ('Park',     'Station',  7.0),
    ]

    for from_node, to_node, weight in roads:
        network.add_edge(from_node, to_node, weight, bidirectional=True)

    return network


if __name__ == '__main__':
    print("=== Road Network Graph Demo ===")
    net = build_city_network()

    stats = net.get_network_stats()
    print(f"\nNetwork: {stats['nodes']} intersections, {stats['edges']} roads")
    print(f"Connected: {stats['is_connected']}")

    print("\nBFS from Home (hop counts):")
    hops = net.bfs('Home')
    for node, h in sorted(hops.items(), key=lambda x: x[1]):
        print(f"  {node}: {h} hops")

    print("\nBFS shortest path Home → Airport:")
    path = net.bfs_path('Home', 'Airport')
    print(f"  {' → '.join(path)}")

    print("\nAll paths Home → Station (max 3):")
    paths = net.find_all_paths('Home', 'Station', max_paths=3)
    for i, p in enumerate(paths, 1):
        print(f"  Path {i}: {' → '.join(p)}")
