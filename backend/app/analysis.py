from typing import List, Tuple
import math

def calculate_cutoff_index(data_points: List[float]) -> int:
    """
    Calculates the 'elbow' or 'knee' point of a curve using the Kneedle algorithm concept
    (maximum distance from the line connecting the start and end points).
    
    Args:
        data_points: A list of numerical values representing the curve (e.g., inclusion rates).
                     Assumes the list is sorted in descending order.
                     
    Returns:
        The index of the data point that represents the optimal cutoff.
    """
    if not data_points or len(data_points) < 3:
        return len(data_points)

    n_points = len(data_points)
    all_indices = range(n_points)
    
    # Line definition: from (0, y_first) to (n-1, y_last)
    # y = mx + c
    x1, y1 = 0, data_points[0]
    x2, y2 = n_points - 1, data_points[-1]
    
    # Preventing division by zero if all points are the same
    if x2 - x1 == 0:
        return 0

    m = (y2 - y1) / (x2 - x1)
    c = y1 - m * x1
    
    max_distance = -1.0
    elbow_index = 0
    
    for i in all_indices:
        y_on_line = m * i + c
        y_actual = data_points[i]
        
        # Calculate distance. Since the curve is usually convex/concave relative to the line,
        # we can just take the vertical distance or perpendicular distance.
        # Perpendicular distance d = |Am + Bn + C| / sqrt(A^2 + B^2)
        # Line eq: -mx + y - c = 0  => A=-m, B=1, C=-c
        
        dist = abs(-m * i + y_actual - c) / math.sqrt(m * m + 1)
        
        if dist > max_distance:
            max_distance = dist
            elbow_index = i
            
    return elbow_index
