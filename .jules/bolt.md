## 2024-05-20 - Expensive Python Parsing in API Route
**Learning:** The API route `app/api/data/[filename]/route.ts` executes a Python script (`extract_data.py`) using `python-shell` for every request. This incurs a significant overhead (0.5s - 1.0s) due to Python VM startup and `scipy.io.loadmat` parsing, even for previously requested static `.mat` files.
**Action:** Implement an in-memory cache (`Map`) in the API route to store the parsed JSON output for each filename. This bypasses the Python execution entirely for repeated requests, reducing response time significantly for cached files.
