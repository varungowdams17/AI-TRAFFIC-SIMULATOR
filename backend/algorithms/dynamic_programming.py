"""
dynamic_programming.py
Dynamic Programming for Traffic Pattern Prediction & Optimization.

Purpose:
  1. Predict future traffic density using historical data (DP table)
  2. Optimal signal scheduling over a time horizon
  3. Minimum total wait time calculation

Time Complexity:  O(T * R) where T = time slots, R = roads
Space Complexity: O(T * R) for DP table
"""

from typing import List, Dict, Tuple
import random


# ─── 1. Traffic Density Prediction ───────────────────────────────────────────

def predict_traffic_density(
    history: List[Dict[str, float]],
    roads: List[str],
    steps_ahead: int = 5
) -> List[Dict[str, float]]:
    """
    Predict future traffic density using DP recurrence.

    Recurrence:
        dp[t][r] = alpha * dp[t-1][r] + (1 - alpha) * trend[r]
    where alpha is a smoothing factor and trend is the moving average slope.

    Args:
        history:     List of density snapshots [{road: density}, ...]
        roads:       List of road names
        steps_ahead: How many future steps to predict

    Returns:
        List of predicted density snapshots
    """
    if not history or len(history) < 2:
        # Not enough data — return flat prediction
        last = history[-1] if history else {r: 30.0 for r in roads}
        return [dict(last) for _ in range(steps_ahead)]

    alpha = 0.7   # Smoothing factor (higher = more weight on recent data)
    n = len(history)

    # Build DP table: dp[t][r] = smoothed density at time t for road r
    dp = [dict(history[0])]
    for t in range(1, n):
        row = {}
        for r in roads:
            prev = dp[t - 1].get(r, 30.0)
            curr = history[t].get(r, prev)
            row[r] = alpha * curr + (1 - alpha) * prev
        dp.append(row)

    # Calculate trend (average change per step)
    trend = {}
    for r in roads:
        if n >= 3:
            recent_changes = [
                dp[t][r] - dp[t - 1][r]
                for t in range(max(1, n - 5), n)
            ]
            trend[r] = sum(recent_changes) / len(recent_changes)
        else:
            trend[r] = 0.0

    # Predict future steps
    predictions = []
    last_row = dp[-1]
    for step in range(steps_ahead):
        pred_row = {}
        for r in roads:
            predicted = last_row[r] + trend[r] * (step + 1)
            # Clamp to valid range [5, 100]
            pred_row[r] = max(5.0, min(100.0, predicted))
        predictions.append(pred_row)

    return predictions


# ─── 2. Optimal Signal Schedule (DP over time horizon) ───────────────────────

def optimal_signal_schedule(
    densities: Dict[str, float],
    total_time: int = 120,
    min_green: int = 10,
    max_green: int = 60
) -> Dict:
    """
    Find optimal green-time allocation for each road using DP.

    Problem: Allocate total_time seconds among roads to minimize total wait.
    State:   dp[i][t] = min total wait using first i roads with t seconds allocated
    Choice:  How many seconds to give road i (between min_green and max_green)

    Args:
        densities:  {road: density_percent}
        total_time: Total cycle time to distribute
        min_green:  Minimum green time per road
        max_green:  Maximum green time per road

    Returns:
        Optimal allocation dict
    """
    roads = list(densities.keys())
    n = len(roads)

    if n == 0:
        return {}

    # Wait time model: wait(road, green_time) = density * (1 - green_time/total_time)
    def wait_cost(road: str, green_time: int) -> float:
        density = densities[road]
        utilization = green_time / total_time
        return density * (1.0 - utilization)

    # DP table: dp[i][t] = minimum total wait cost for roads[0..i] with t seconds used
    INF = float('inf')
    dp = [[INF] * (total_time + 1) for _ in range(n + 1)]
    choice = [[0] * (total_time + 1) for _ in range(n + 1)]
    dp[0][0] = 0.0

    for i in range(1, n + 1):
        road = roads[i - 1]
        for t in range(total_time + 1):
            for g in range(min_green, min(max_green, t) + 1):
                prev_cost = dp[i - 1][t - g]
                if prev_cost < INF:
                    cost = prev_cost + wait_cost(road, g)
                    if cost < dp[i][t]:
                        dp[i][t] = cost
                        choice[i][t] = g

    # Backtrack to find optimal allocation
    allocation = {}
    remaining = total_time
    for i in range(n, 0, -1):
        g = choice[i][remaining]
        allocation[roads[i - 1]] = g
        remaining -= g

    return {
        'allocation': allocation,
        'total_time': total_time,
        'min_cost': dp[n][total_time] if dp[n][total_time] < INF else None,
        'algorithm': 'Dynamic Programming – Optimal Signal Scheduling',
        'complexity': 'O(n * T * G) where n=roads, T=total_time, G=max_green'
    }


# ─── 3. Congestion Prediction Score ──────────────────────────────────────────

def congestion_prediction_score(
    current_densities: Dict[str, float],
    time_of_day: int = 8,   # 0-23 hour
    is_weekday: bool = True
) -> Dict:
    """
    Predict congestion level for the next hour using DP-based scoring.

    Uses a pre-computed DP table of historical congestion patterns.

    Args:
        current_densities: Current road densities
        time_of_day:       Current hour (0-23)
        is_weekday:        Whether it's a weekday

    Returns:
        Congestion prediction with confidence score
    """
    # Historical congestion multipliers by hour (simplified model)
    hourly_multipliers = {
        0: 0.2, 1: 0.15, 2: 0.1, 3: 0.1, 4: 0.15, 5: 0.3,
        6: 0.6, 7: 0.9, 8: 1.0, 9: 0.85, 10: 0.7, 11: 0.75,
        12: 0.8, 13: 0.75, 14: 0.7, 15: 0.8, 16: 0.95, 17: 1.0,
        18: 0.9, 19: 0.75, 20: 0.6, 21: 0.5, 22: 0.4, 23: 0.3
    }

    # Weekend reduces traffic by 30%
    day_factor = 1.0 if is_weekday else 0.7

    # Next hour prediction
    next_hour = (time_of_day + 1) % 24
    current_mult = hourly_multipliers.get(time_of_day, 0.5)
    next_mult = hourly_multipliers.get(next_hour, 0.5)

    avg_density = sum(current_densities.values()) / max(len(current_densities), 1)

    # DP recurrence: predicted = current * (next_mult / current_mult) * day_factor
    ratio = next_mult / max(current_mult, 0.01)
    predicted_density = min(100.0, avg_density * ratio * day_factor)

    # Congestion level classification
    if predicted_density >= 80:
        level = 'CRITICAL'
        recommendation = 'Activate peak-hour mode, extend green signals'
    elif predicted_density >= 60:
        level = 'HIGH'
        recommendation = 'Increase signal durations on busy roads'
    elif predicted_density >= 40:
        level = 'MODERATE'
        recommendation = 'Normal operation with slight adjustments'
    else:
        level = 'LOW'
        recommendation = 'Standard signal timing sufficient'

    return {
        'current_density': round(avg_density, 1),
        'predicted_density': round(predicted_density, 1),
        'congestion_level': level,
        'recommendation': recommendation,
        'time_of_day': time_of_day,
        'next_hour': next_hour,
        'confidence': round(0.75 + 0.1 * (1 - abs(ratio - 1)), 2),
        'algorithm': 'Dynamic Programming – Congestion Prediction'
    }


# ─── 4. Minimum Waiting Time (Knapsack-style DP) ─────────────────────────────

def min_total_wait_time(
    vehicles: List[Dict],
    green_slots: int = 4
) -> Dict:
    """
    Minimize total vehicle wait time by optimally assigning green slots.
    Models as a variant of the 0/1 knapsack problem.

    Args:
        vehicles:    List of {id, road, wait_time, priority}
        green_slots: Number of green signal slots available

    Returns:
        Optimal assignment minimizing total wait
    """
    if not vehicles:
        return {'assignments': [], 'total_wait_saved': 0}

    n = len(vehicles)
    # dp[i][j] = max wait time saved using first i vehicles with j slots
    dp = [[0] * (green_slots + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        v = vehicles[i - 1]
        wait = v.get('wait_time', 0)
        priority = v.get('priority', 1)
        value = wait * priority  # Weighted by priority

        for j in range(green_slots + 1):
            # Don't assign green to this vehicle
            dp[i][j] = dp[i - 1][j]
            # Assign green (costs 1 slot, saves wait_time * priority)
            if j >= 1:
                dp[i][j] = max(dp[i][j], dp[i - 1][j - 1] + value)

    # Backtrack to find which vehicles get green
    assignments = []
    j = green_slots
    for i in range(n, 0, -1):
        if dp[i][j] != dp[i - 1][j]:
            assignments.append(vehicles[i - 1])
            j -= 1

    return {
        'assignments': assignments,
        'total_wait_saved': dp[n][green_slots],
        'algorithm': 'DP Knapsack – Minimum Wait Time',
        'complexity': 'O(n * green_slots)'
    }


if __name__ == '__main__':
    print("=== Dynamic Programming Traffic Prediction ===")

    # Test density prediction
    history = [
        {'north': 30, 'south': 25, 'east': 40, 'west': 20},
        {'north': 35, 'south': 28, 'east': 45, 'west': 22},
        {'north': 42, 'south': 30, 'east': 50, 'west': 25},
        {'north': 55, 'south': 35, 'east': 60, 'west': 30},
        {'north': 65, 'south': 40, 'east': 70, 'west': 38},
    ]
    roads = ['north', 'south', 'east', 'west']
    predictions = predict_traffic_density(history, roads, steps_ahead=3)
    print("\nPredicted densities (next 3 steps):")
    for i, pred in enumerate(predictions, 1):
        print(f"  Step +{i}: {', '.join(f'{r}={v:.1f}%' for r, v in pred.items())}")

    # Test optimal schedule
    densities = {'north': 65, 'south': 30, 'east': 80, 'west': 45}
    schedule = optimal_signal_schedule(densities, total_time=120)
    print("\nOptimal signal schedule (120s cycle):")
    for road, time in schedule['allocation'].items():
        print(f"  {road}: {time}s green")

    # Test congestion prediction
    score = congestion_prediction_score(densities, time_of_day=8)
    print(f"\nCongestion prediction: {score['congestion_level']} ({score['predicted_density']}%)")
    print(f"  Recommendation: {score['recommendation']}")
