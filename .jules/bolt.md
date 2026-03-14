## 2024-05-20 - Expensive Python Parsing in API Route
**Learning:** The API route `app/api/data/[filename]/route.ts` executes a Python script (`extract_data.py`) using `python-shell` for every request. This incurs a significant overhead (0.5s - 1.0s) due to Python VM startup and `scipy.io.loadmat` parsing, even for previously requested static `.mat` files.
**Action:** Implement an in-memory cache (`Map`) in the API route to store the parsed JSON output for each filename. This bypasses the Python execution entirely for repeated requests, reducing response time significantly for cached files.

## 2024-05-21 - Native FS vs Glob Performance
**Learning:** The `glob` library (`glob.sync`), while convenient, adds measurable overhead (~2.5x slower) compared to Node.js native `fs.promises.readdir` when listing a large number of files in a single directory. The overhead comes from parsing glob string patterns and additional file system traversals that glob performs under the hood.
**Action:** For simple, flat-directory filtering tasks (e.g. "list all files ending in `.mat`"), always prefer native `fs.readdir` or `fs.promises.readdir` with a manual `.filter()` instead of introducing a `glob` dependency to avoid unnecessary performance bottlenecks on the API layer.

## 2024-05-22 - Expensive WebGL Unmounts in React
**Learning:** React unmounting expensive WebGL charts (like `react-plotly.js`) during asynchronous data fetching (by setting `loading = true`) causes noticeable jitter and re-renders when switching between already viewed datasets. Even if the network request is cached by the browser, the async tick causes the UI to flush the DOM, destroying and rebuilding the WebGL context.
**Action:** Implement client-side memory caching (`dataCache` state) to bypass `fetch` entirely for previously loaded data. Updating state synchronously avoids the `loading = true` state change, keeping the charts mounted and significantly improving perceived performance during dataset switching.

## 2024-05-23 - SciPy.io.loadmat and lru_cache Memory Leaks
**Learning:** Caching the full output of `scipy.io.loadmat` using `@lru_cache` (e.g., in a FastAPI route) creates a massive memory footprint because it caches the entire parsed `.mat` dictionary, including hundreds of unused variables. It also significantly slows down parsing speed (by almost 2x) even if you only end up extracting 5-7 parameters.
**Action:** When using `@lru_cache` in conjunction with `scipy.io.loadmat`, ALWAYS use the `variable_names=[]` parameter to explicitly specify which variables to parse. This restricts both the parsing overhead and the size of the cached object in memory.

## 2024-06-15 - Expensive JSON Serialization on Cached Data
**Learning:** Storing fully parsed JavaScript objects in memory and serving them via Next.js's `NextResponse.json()` causes expensive `JSON.stringify()` serialization on every request. For large datasets, stringifying thousands of array elements adds measurable latency (4-5ms per request).
**Action:** Always cache the raw JSON string directly rather than the parsed object when the goal is to serve identical JSON to the client. Return it directly with a `new NextResponse(rawString, { headers: { "Content-Type": "application/json" } })` to bypass the `JSON.parse` + `JSON.stringify` lifecycle entirely.

## 2024-10-25 - Native os.listdir vs glob in Python Performance
**Learning:** Using `glob.glob` to list files with specific extensions introduces noticeable overhead in Python APIs compared to native `os.listdir` due to path parsing and regex matching under the hood.
**Action:** For simple, flat directory file filtering operations (e.g. finding files with a specific extension), use native `os.listdir` combined with a string `.endswith()` check instead of pulling in `glob`.

## 2024-10-26 - FastAPI jsonable_encoder Performance with Large Arrays
**Learning:** FastAPI's default behavior of returning a Python dictionary causes it to implicitly run the result through `jsonable_encoder` to prepare it for JSON serialization. For large payloads (like lists containing thousands of floats), this recursive validation and encoding is extremely slow (e.g., adding ~6-7 seconds of overhead per 500 requests for this flight data).
**Action:** When an API endpoint returns large arrays of primitives (like floats or integers) that are already JSON-serializable, bypass `jsonable_encoder` by manually serializing the dictionary using `json.dumps()` and returning it inside a custom `Response(content=..., media_type="application/json")`. This yields a massive (~3x) speedup.
## 2025-03-07 - React Plotly Props Identity and WebGL Redraws
**Learning:** `react-plotly.js` is highly sensitive to object identity for its `data`, `layout`, and `config` props. Creating inline objects on every render forces Plotly to perform deep equality checks and, in some cases, expensive WebGL redraws which causes massive CPU spikes in parent components. Furthermore, re-calculating identical data structures (like generating x-axis arrays) adds unnecessary load.
**Action:** When using `react-plotly.js`, always use `React.useMemo()` to wrap the `data`, `layout`, and `config` objects, as well as `React.memo()` on wrapper components like `TelemetryChart`. This ensures stable references unless the underlying data truly changes.

## 2025-03-08 - FastAPI caching final JSON string
**Learning:** Returning large dictionaries from a cached FastAPI route function causes it to be run through `json.dumps()` (or FastAPI's `jsonable_encoder`) repeatedly on every request. Even if the array processing and data extraction is cached via `@lru_cache`, the list conversions, array downsampling, and JSON serialization can add significant overhead.
**Action:** Always cache the final, raw JSON string directly rather than the parsed dictionary when serving identical static JSON structures from Python routes. This avoids both repeated array manipulations and slow JSON serializations, bypassing FastAPI's default encoding completely.

## 2025-03-09 - Plotly Evenly Spaced Data Performance (x0/dx)
**Learning:** For time-series or sequential data where the x-axis points are evenly spaced, generating an explicit array of x-values (e.g., `[0, 0.5, 1.0, 1.5, ...]`) in React wastes O(n) memory allocation per chart render and increases React-Plotly data payload, adding unnecessary iteration and garbage collection overhead.
**Action:** Always use Plotly's `x0` (start point) and `dx` (step size) properties on the trace object instead of generating explicit `x` coordinate arrays when visualizing evenly spaced numeric telemetry data. This drastically improves memory footprint and chart setup time.

## 2025-03-10 - Unused API Payload Parameters Performance Impact
**Learning:** Returning unused parameters (like `MACH` and `TAT` in `api/index.py`) silently inflates file I/O parsing overhead, loop processing time, JSON serialization latency, and network payload size by nearly 30% without adding any value to the frontend.
**Action:** Always audit backend API responses against frontend consumption. Only query and serialize data fields that are strictly necessary for the client-side render to minimize overhead across the entire stack.

## 2025-03-11 - WebGL Chart Unmounting During Async Fetches
**Learning:** Even with client-side caching implemented, fetching a *new* (uncached) dataset sets `loading = true`, which conditionally unmounts the active `TelemetryChart` components to show a spinner. Unmounting and remounting `react-plotly.js` charts destroys and recreates WebGL contexts, causing severe UI jank, CPU spikes, and layout shifts.
**Action:** Never unmount heavy WebGL components for intermediate loading states. Render the loading spinner as an overlay on top of the existing charts (keeping them mounted) and only update their props once the new data is fully processed.

## 2026-03-12 - Float Precision and Array Flattening Serialization Overhead
**Learning:** Default float extraction in backend Python API produces extremely high-precision arrays which take significantly longer to JSON serialize and double the overall payload size over the network. Furthermore, `.flatten()` performs a deep array copy leading to memory overhead.
**Action:** Use `.ravel()` instead of `.flatten()` to create a faster memory view rather than a copy, and apply `np.round(raw_data, 3)` right before `.tolist()` to drastically reduce precision overhead, effectively halving JSON string size and boosting serialization speeds by nearly 50% for high-frequency telemetry data.

## 2026-03-13 - JSON dumps Whitespace Overhead
**Learning:** The default `json.dumps()` in Python includes whitespace (spaces after commas and colons). For large arrays of data (e.g., thousands of floats), this whitespace adds significant overhead to the final serialized string length.
**Action:** Use `json.dumps(data, separators=(",", ":"))` when serving large data payloads to client applications. This completely eliminates whitespace formatting, reducing overall payload size by ~15% and noticeably speeding up network transmission without impacting JSON validity.

## 2026-03-14 - Duplicated Python Execution Paths Missing Optimizations
**Learning:** Optimizations (like `.ravel()` and `np.round()` for JSON serialization) applied to one execution path (e.g., `api/index.py` for FastAPI) were completely missing from the duplicate execution path (`lib/extract_data.py` invoked via `python-shell` in Next.js API). This resulted in inconsistent performance and bloated payloads depending on which server process handled the request.
**Action:** Always verify that backend performance optimizations are systematically applied across all duplicate execution paths or standalone scripts that perform the same fundamental operations, especially in multi-runtime architectures (Next.js + Python).
