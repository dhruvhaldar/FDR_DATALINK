from fastapi import FastAPI, HTTPException
import scipy.io
import numpy as np
import os
import glob

app = FastAPI()

# Path to the data directory (relative to the project root or absolute)
# For local dev, we use the absolute path we found earlier
# The api folder is in the root, so its parent is the project root
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Tail_666_9")

@app.get("/api/files")
def list_files():
    if not os.path.exists(DATA_DIR):
        return {"error": "Data directory not found", "path": DATA_DIR}
    
    files = glob.glob(os.path.join(DATA_DIR, "*.mat"))
    file_names = [os.path.basename(f) for f in files]
    return {"files": sorted(file_names)}

@app.get("/api/data/{filename}")
def get_flight_data(filename: str):
    file_path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        data = scipy.io.loadmat(file_path)
        result = {}
        
        # We'll extract a subset of interesting parameters
        params = ['ALT', 'CAS', 'PTCH', 'ROLL', 'VRTG', 'MACH', 'TAT']
        
        for p in params:
            if p in data:
                struct = data[p][0, 0]
                # Convert numpy arrays to lists for JSON serialization
                raw_data = struct['data'].flatten()
                
                # Downsample if too large (e.g., > 2000 points) to keep response snappy
                max_points = 2000
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
                    "description": desc
                }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
