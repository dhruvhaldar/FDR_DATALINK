## 2024-03-31 - Bounding React State Caches for Large Payloads
**Learning:** Storing massive data structures (like WebGL chart datasets from `.mat` files) in an unbounded React state cache (e.g., `useState<Record<string, FlightData>>({})`) creates severe memory leaks on the client as the user browses through more files. Garbage collection is unable to free the unused data.
**Action:** Always wrap in-memory React state caches that store large payloads with a bounded eviction policy (like Least Recently Used, LRU) with a strict maximum size to protect the browser's heap limit and prevent the app from freezing or crashing.
## 2024-04-06 - Replacing React State Cache with useRef<Map>
**Learning:** Using `useState<Record<string, Any>>` for a client-side cache of large payloads triggers costly component re-renders and forces $O(N)$ key operations for LRU evictions.
**Action:** Prefer storing the cache in a native `Map` inside a `useRef`. This prevents React from tracking the cache as state (eliminating unnecessary re-renders) and provides $O(1)$ LRU eviction by grabbing the first key (`Map.prototype.keys().next().value`) instead of cloning and keying an entire object map.
## 2024-04-18 - In-Place NumPy Operations for Memory Footprint
**Learning:** During extraction of telemetry arrays via `np.round(raw_data, decimals)` inside an API or CLI script, allocating a new array (the default behavior) creates a deep copy of up to thousands of floats. Since the data object isn't cached (or is overwritten), we can avoid O(N) allocation completely.
**Action:** Always prefer `np.round(raw_data, decimals, out=raw_data)` to manipulate the float values in-place when the original unrounded values are no longer required, saving redundant memory allocation overhead in Python endpoints.
## 2026-03-31 - Use WebGL for Heavy Charts
**Learning:** For high-density telemetry data (like 2000 points per chart across 5 charts), using Plotly's default SVG-based `scatter` mode creates an enormous number of DOM nodes. This bogs down the browser's main thread and can make the UI extremely sluggish or unresponsive during renders and resizes.
**Action:** When rendering thousands of data points with `react-plotly.js`, always use `type: "scattergl"`. This switches the renderer to WebGL, offloading the work to the GPU and maintaining a smooth, 60fps interaction framerate.
## 2024-04-20 - Flattening MATLAB Cell Arrays during Load
**Learning:** By default, `scipy.io.loadmat` parses 1xN MATLAB cell arrays or structs into highly nested structures requiring `[0, 0]` indexing followed by `.ravel()` or `.flatten()` to access the raw 1D numeric data, which bloats extraction logic and adds slight overhead.
**Action:** Always pass `squeeze_me=True` to `loadmat()` when loading tabular telemetry or numeric arrays from `.mat` files. This instructs SciPy to natively squeeze out singleton dimensions during parsing, yielding flat 1D numpy arrays directly accessible via `.item()` (for scalars or single objects) without verbose unpacking.
## 2026-04-12 - Lazy Loading Heavy Scientific Libraries in API
**Learning:** Top-level importing of heavy libraries like `scipy.io` and `numpy` in a FastAPI entrypoint (`api/index.py`) causes significant initialization overhead (~350ms) and memory allocation during Vercel cold starts, even when handling simple requests like `/api/files` that don't need them.
**Action:** Move expensive imports inside the functions that actually use them (lazy loading), drastically reducing the API cold start time and improving overall initial responsiveness.
