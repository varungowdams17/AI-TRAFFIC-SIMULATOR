"""
priority_queue.py
Max-Heap Priority Queue for Emergency Vehicle Management.

Purpose: Ensure emergency vehicles (ambulance, police, fire truck) get
         immediate green signal by maintaining a priority-ordered queue.

Time Complexity:  Insert O(log n), Extract-Max O(log n), Peek O(1)
Space Complexity: O(n)
"""

import heapq
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from enum import IntEnum


class VehiclePriority(IntEnum):
    """Priority levels for different vehicle types."""
    AMBULANCE  = 10  # Highest – life-threatening emergency
    POLICE     = 9   # High – law enforcement
    FIRE_TRUCK = 8   # High – fire emergency
    VIP        = 7   # Medium-high – VIP convoy
    BUS        = 3   # Medium – public transport
    TRUCK      = 2   # Low-medium – heavy vehicle
    CAR        = 1   # Normal
    BIKE       = 1   # Normal


@dataclass(order=True)
class Vehicle:
    """Vehicle data class for priority queue."""
    # Negative priority for max-heap (Python heapq is min-heap)
    neg_priority: int = field(compare=True)
    vehicle_id: int = field(compare=False)
    vehicle_type: str = field(compare=False)
    road: str = field(compare=False)
    wait_time: int = field(compare=False, default=0)
    is_emergency: bool = field(compare=False, default=False)

    @property
    def priority(self):
        return -self.neg_priority


class TrafficPriorityQueue:
    """
    Max-heap priority queue for traffic management.
    Emergency vehicles bubble to the top automatically.
    """

    def __init__(self):
        self._heap: List[Vehicle] = []
        self._counter = 0  # Tie-breaker for equal priorities

    def insert(self, vehicle_type: str, road: str, vehicle_id: int = None) -> Vehicle:
        """
        Insert a vehicle into the priority queue.

        Args:
            vehicle_type: Type of vehicle (ambulance, car, etc.)
            road: Road the vehicle is on
            vehicle_id: Optional ID

        Returns:
            The inserted Vehicle object
        """
        self._counter += 1
        vid = vehicle_id or self._counter

        # Get priority based on vehicle type
        priority_map = {
            'ambulance':  VehiclePriority.AMBULANCE,
            'police':     VehiclePriority.POLICE,
            'firetruck':  VehiclePriority.FIRE_TRUCK,
            'fire_truck': VehiclePriority.FIRE_TRUCK,
            'bus':        VehiclePriority.BUS,
            'truck':      VehiclePriority.TRUCK,
            'car':        VehiclePriority.CAR,
            'bike':       VehiclePriority.BIKE,
        }
        priority = priority_map.get(vehicle_type.lower(), VehiclePriority.CAR)
        is_emergency = priority >= VehiclePriority.FIRE_TRUCK

        vehicle = Vehicle(
            neg_priority=-priority,
            vehicle_id=vid,
            vehicle_type=vehicle_type,
            road=road,
            is_emergency=is_emergency
        )

        heapq.heappush(self._heap, vehicle)
        return vehicle

    def extract_max(self) -> Optional[Vehicle]:
        """
        Extract vehicle with highest priority.

        Returns:
            Vehicle with maximum priority, or None if empty
        """
        if not self._heap:
            return None
        return heapq.heappop(self._heap)

    def peek(self) -> Optional[Vehicle]:
        """View highest priority vehicle without removing."""
        if not self._heap:
            return None
        return self._heap[0]

    def has_emergency(self) -> bool:
        """Check if any emergency vehicle is in queue."""
        return any(v.is_emergency for v in self._heap)

    def get_emergency_vehicles(self) -> List[Vehicle]:
        """Get all emergency vehicles in queue."""
        return [v for v in self._heap if v.is_emergency]

    def size(self) -> int:
        return len(self._heap)

    def is_empty(self) -> bool:
        return len(self._heap) == 0

    def to_list(self) -> List[Dict]:
        """Return sorted list of all vehicles (for display)."""
        sorted_vehicles = sorted(self._heap, key=lambda v: v.neg_priority)
        return [
            {
                'id': v.vehicle_id,
                'type': v.vehicle_type,
                'road': v.road,
                'priority': v.priority,
                'is_emergency': v.is_emergency,
                'wait_time': v.wait_time
            }
            for v in sorted_vehicles
        ]

    def process_emergency(self) -> Dict:
        """
        Process emergency vehicle – extract and create priority corridor.

        Returns:
            Emergency handling result
        """
        if not self.has_emergency():
            return {'status': 'no_emergency'}

        # Extract highest priority vehicle
        vehicle = self.extract_max()

        return {
            'status': 'emergency_processed',
            'vehicle': {
                'id': vehicle.vehicle_id,
                'type': vehicle.vehicle_type,
                'road': vehicle.road,
                'priority': vehicle.priority
            },
            'action': f'GREEN signal on {vehicle.road} – {vehicle.vehicle_type} corridor activated',
            'other_roads': 'RED – All other roads stopped'
        }


def demonstrate_priority_queue():
    """Demonstrate priority queue with mixed vehicle types."""
    pq = TrafficPriorityQueue()

    # Add various vehicles
    vehicles_to_add = [
        ('car', 'north'),
        ('bus', 'south'),
        ('truck', 'east'),
        ('car', 'west'),
        ('ambulance', 'north'),  # Emergency!
        ('bike', 'south'),
        ('police', 'east'),      # Emergency!
        ('car', 'north'),
    ]

    print("=== Priority Queue Demo ===")
    print("\nAdding vehicles:")
    for vtype, road in vehicles_to_add:
        v = pq.insert(vtype, road)
        print(f"  Added: {vtype} on {road} (priority={v.priority})")

    print(f"\nQueue size: {pq.size()}")
    print(f"Emergency vehicles: {len(pq.get_emergency_vehicles())}")

    print("\nProcessing queue (highest priority first):")
    while not pq.is_empty():
        v = pq.extract_max()
        marker = " 🚨 EMERGENCY" if v.is_emergency else ""
        print(f"  Processing: {v.vehicle_type} on {v.road} (P={v.priority}){marker}")


if __name__ == '__main__':
    demonstrate_priority_queue()
