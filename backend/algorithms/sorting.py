"""
sorting.py
Sorting Algorithms for Vehicle Priority Arrangement.

Implements multiple sorting algorithms used in traffic management:
  - Bubble Sort   : Small queues, educational visualization
  - Selection Sort: Simple priority arrangement
  - Insertion Sort: Nearly-sorted queues (efficient for real-time updates)
  - Merge Sort    : Stable sort for equal-priority vehicles
  - Quick Sort    : Large traffic volumes

All algorithms sort vehicles by priority (descending) for signal allocation.
"""

from typing import List, Dict, Tuple
import time


# ─── Bubble Sort ──────────────────────────────────────────────────────────────
def bubble_sort(vehicles: List[Dict], key: str = 'priority') -> Tuple[List[Dict], List[Dict]]:
    """
    Bubble Sort – repeatedly swap adjacent elements if out of order.

    Time Complexity:  O(n²) worst/average, O(n) best (already sorted)
    Space Complexity: O(1) in-place
    Stable: Yes

    Args:
        vehicles: List of vehicle dicts
        key:      Sort key (default: 'priority', descending)

    Returns:
        (sorted_list, steps) where steps records each swap for visualization
    """
    arr = [v.copy() for v in vehicles]
    n = len(arr)
    steps = []

    for i in range(n - 1):
        swapped = False
        for j in range(n - i - 1):
            if arr[j][key] < arr[j + 1][key]:   # Descending order
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
                steps.append({
                    'type': 'swap',
                    'indices': [j, j + 1],
                    'values': [arr[j][key], arr[j + 1][key]],
                    'state': [v[key] for v in arr]
                })
            else:
                steps.append({
                    'type': 'compare',
                    'indices': [j, j + 1],
                    'values': [arr[j][key], arr[j + 1][key]],
                    'state': [v[key] for v in arr]
                })
        if not swapped:
            break   # Early termination if already sorted

    return arr, steps


# ─── Selection Sort ───────────────────────────────────────────────────────────
def selection_sort(vehicles: List[Dict], key: str = 'priority') -> List[Dict]:
    """
    Selection Sort – find maximum element and place it at front.

    Time Complexity:  O(n²) all cases
    Space Complexity: O(1) in-place
    Stable: No

    Used for: Simple priority arrangement when stability not required.
    """
    arr = [v.copy() for v in vehicles]
    n = len(arr)

    for i in range(n):
        max_idx = i
        for j in range(i + 1, n):
            if arr[j][key] > arr[max_idx][key]:
                max_idx = j
        arr[i], arr[max_idx] = arr[max_idx], arr[i]

    return arr


# ─── Insertion Sort ───────────────────────────────────────────────────────────
def insertion_sort(vehicles: List[Dict], key: str = 'priority') -> List[Dict]:
    """
    Insertion Sort – insert each element into its correct position.

    Time Complexity:  O(n²) worst, O(n) best (nearly sorted)
    Space Complexity: O(1) in-place
    Stable: Yes

    Used for: Real-time queue updates where new vehicles are inserted
              into an already-sorted queue (nearly sorted input).
    """
    arr = [v.copy() for v in vehicles]
    n = len(arr)

    for i in range(1, n):
        key_item = arr[i]
        j = i - 1
        # Shift elements smaller than key_item to the right
        while j >= 0 and arr[j][key] < key_item[key]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key_item

    return arr


# ─── Merge Sort ───────────────────────────────────────────────────────────────
def merge_sort(vehicles: List[Dict], key: str = 'priority') -> List[Dict]:
    """
    Merge Sort – divide and conquer, merge sorted halves.

    Time Complexity:  O(n log n) all cases
    Space Complexity: O(n) auxiliary
    Stable: Yes

    Used for: Large traffic volumes where stability matters
              (vehicles with equal priority maintain insertion order).
    """
    if len(vehicles) <= 1:
        return [v.copy() for v in vehicles]

    mid = len(vehicles) // 2
    left = merge_sort(vehicles[:mid], key)
    right = merge_sort(vehicles[mid:], key)

    return _merge(left, right, key)


def _merge(left: List[Dict], right: List[Dict], key: str) -> List[Dict]:
    """Merge two sorted lists into one sorted list (descending)."""
    result = []
    i = j = 0

    while i < len(left) and j < len(right):
        if left[i][key] >= right[j][key]:   # Descending
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    result.extend(left[i:])
    result.extend(right[j:])
    return result


# ─── Quick Sort ───────────────────────────────────────────────────────────────
def quick_sort(vehicles: List[Dict], key: str = 'priority') -> List[Dict]:
    """
    Quick Sort – partition around pivot, recursively sort partitions.

    Time Complexity:  O(n log n) average, O(n²) worst
    Space Complexity: O(log n) stack space
    Stable: No

    Used for: Very large traffic volumes (highway simulation).
    """
    arr = [v.copy() for v in vehicles]
    _quick_sort_helper(arr, 0, len(arr) - 1, key)
    return arr


def _quick_sort_helper(arr: List[Dict], low: int, high: int, key: str):
    if low < high:
        pivot_idx = _partition(arr, low, high, key)
        _quick_sort_helper(arr, low, pivot_idx - 1, key)
        _quick_sort_helper(arr, pivot_idx + 1, high, key)


def _partition(arr: List[Dict], low: int, high: int, key: str) -> int:
    """Lomuto partition scheme (descending order)."""
    pivot = arr[high][key]
    i = low - 1

    for j in range(low, high):
        if arr[j][key] >= pivot:   # Descending
            i += 1
            arr[i], arr[j] = arr[j], arr[i]

    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1


# ─── Benchmark ────────────────────────────────────────────────────────────────
def benchmark_sorts(n: int = 100) -> Dict:
    """
    Benchmark all sorting algorithms on n random vehicles.

    Returns timing comparison for educational display.
    """
    import random

    vehicle_types = ['car', 'bike', 'truck', 'bus', 'ambulance', 'police']
    vehicles = [
        {
            'id': i,
            'type': random.choice(vehicle_types),
            'priority': random.randint(1, 10),
            'road': random.choice(['north', 'south', 'east', 'west'])
        }
        for i in range(n)
    ]

    results = {}
    algorithms = {
        'Bubble Sort':    lambda v: bubble_sort(v)[0],
        'Selection Sort': selection_sort,
        'Insertion Sort': insertion_sort,
        'Merge Sort':     merge_sort,
        'Quick Sort':     quick_sort,
    }

    for name, func in algorithms.items():
        start = time.perf_counter()
        sorted_v = func(vehicles)
        elapsed = (time.perf_counter() - start) * 1000  # ms
        results[name] = {
            'time_ms': round(elapsed, 3),
            'correct': sorted_v[0]['priority'] >= sorted_v[-1]['priority']
        }

    return results


if __name__ == '__main__':
    print("=== Sorting Algorithms Demo ===")

    vehicles = [
        {'id': 1, 'type': 'car',       'priority': 1,  'road': 'north'},
        {'id': 2, 'type': 'ambulance', 'priority': 10, 'road': 'south'},
        {'id': 3, 'type': 'bus',       'priority': 3,  'road': 'east'},
        {'id': 4, 'type': 'police',    'priority': 9,  'road': 'west'},
        {'id': 5, 'type': 'truck',     'priority': 2,  'road': 'north'},
        {'id': 6, 'type': 'bike',      'priority': 1,  'road': 'south'},
    ]

    print("\nOriginal order:")
    for v in vehicles:
        print(f"  {v['type']:12} P={v['priority']}")

    sorted_v, steps = bubble_sort(vehicles)
    print(f"\nBubble Sort result ({len(steps)} operations):")
    for v in sorted_v:
        print(f"  {v['type']:12} P={v['priority']}")

    print("\nBenchmark (n=200):")
    bench = benchmark_sorts(200)
    for algo, res in bench.items():
        print(f"  {algo:16}: {res['time_ms']:.3f}ms  ✓" if res['correct'] else f"  {algo}: FAILED")
