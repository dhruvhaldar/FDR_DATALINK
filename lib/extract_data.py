import scipy.io
import json
import sys
import os
import numpy as np

def extract_data(file_path):
    if not os.path.exists(file_path):
        return {"error": "File not found"}
    
    try:
        # Parameters requested: Pressure Altitude, Computed Airspeed, Pitch, Roll, Vertical Acceleration
        params = ['ALT', 'CAS', 'PTCH', 'ROLL', 'VRTG']
        
        # Optimize: Only load the specific variables we need, not the entire file
        data = scipy.io.loadmat(file_path, variable_names=params)
        result = {}

        for p in params:
            if p in data:
                struct = data[p][0, 0]
                raw_data = struct['data'].flatten()
                
                # Downsample for web performance
                max_points = 2000
                step = 1
                if len(raw_data) > max_points:
                    step = len(raw_data) // max_points
                    raw_data = raw_data[::step]
                
                rate = float(struct['Rate'][0, 0]) if 'Rate' in struct.dtype.names else 1.0
                units = str(struct['Units'][0]) if 'Units' in struct.dtype.names else ""
                desc = str(struct['Description'][0]) if 'Description' in struct.dtype.names else p
                
                result[p] = {
                    "data": raw_data.tolist(),
                    "rate": rate,
                    "units": units,
                    "description": desc,
                    "step": step
                }
        return result
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
    else:
        print(json.dumps(extract_data(sys.argv[1])))
