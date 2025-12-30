from app.analysis import calculate_cutoff_index
import math

def test_elbow():
    # Shape: steep drop then flat
    # 100, 50, 20, 10, 5, 4, 3, 2, 1, 1
    # Elbow should be around index 2 or 3 (value 20 or 10)
    data = [100, 50, 20, 10, 5, 4, 3, 2, 1, 1]
    
    cutoff = calculate_cutoff_index(data)
    print(f"Data: {data}")
    print(f"Cutoff Index: {cutoff}")
    print(f"Value at Cutoff: {data[cutoff]}")
    
    # Verify logical "knee"
    # Line 100 -> 1. 
    # Distances roughly?
    # Simple visual check: 20 seems to be the "bend".

if __name__ == "__main__":
    test_elbow()
