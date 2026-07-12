## 2026-03-16 - Array Downsampling Division Overhead
**Learning:** Using floor division (`len(raw_data) // max_points`) for array downsampling allows arrays of size between `max_points` and `2 * max_points - 1` to pass through without any downsampling at all (because `3999 // 2000 = 1`, resulting in `raw_data[::1]`). This quietly bloats payload sizes and processing time by up to 100% over the intended `max_points` limit.
**Action:** When mathematically downsampling arrays to a strict maximum size, use ceiling division `(len(raw_data) + max_points - 1) // max_points`. This guarantees the resulting step size will strictly bound the final array to `<= max_points` elements, keeping payload sizes predictable and optimal.

## 2026-03-16 - FastAPI Missing HTTP Caching on Static API Routes
**Learning:** Caching data in memory on the backend (`@lru_cache`) prevents re-processing, but without setting `Cache-Control` headers on the `Response`, the browser continues to make network requests (and download massive JSON payloads) on every page reload or tab switch.
**Action:** Always add standard HTTP caching headers (`headers={"Cache-Control": "public, max-age=86400, stale-while-revalidate=3600"}`) to FastAPI responses that serve immutable or static data (like telemetry from static `.mat` files). This pushes the cache to the edge/browser, completely eliminating unnecessary network traffic and backend load.
## 2026-03-21 - Python Script Lazy Loading
**Learning:** Top-level imports of heavy scientific libraries like `scipy.io` and `numpy` block script initialization for ~400ms. In multi-runtime architectures (e.g. Next.js spawning Python scripts via `PythonShell`), this causes massive CPU/memory spikes even for invalid or missing files before the script eventually errors out.
**Action:** When creating CLI scripts or Python helpers spawned by external processes, move expensive imports inside the main execution functions, placing them *after* cheap validation checks (like `os.path.exists()`) to ensure lightning-fast failure paths.

## 2026-03-22 - Static API Responses Caching Time
**Learning:** Adding a 24-hour cache (`max-age=86400`) to an endpoint that lists directory contents (`/api/files`) is a functional regression if the directory is dynamic, because new files won't be visible for a full day. The `Cache-Control` header should be applied carefully based on whether the data is truly static. If the file list is dynamic, a much shorter cache or no cache is appropriate.
**Action:** When adding `Cache-Control` headers, strictly evaluate if the data can change. For directory listings, use short caching (e.g., `max-age=60`) or revalidate frequently, rather than the 86400 seconds used for immutable static files.

## 2026-03-22 - Caching API Files is a Bad Idea
**Learning:** Adding ANY HTTP caching (`Cache-Control` max-age > 0) to a directory listing endpoint (`/api/files`) fundamentally breaks read-after-write consistency. If a user or background process adds, deletes, or modifies a file, the application will fail to reflect those changes for the duration of the cache. This is a functional regression and breaks the rule that "speed without correctness is useless."
**Action:** Do NOT apply caching headers to dynamic list endpoints unless the application architecture guarantees that the underlying data is strictly immutable or provides an active cache invalidation mechanism.
## 2024-03-24 - Number.prototype.toLocaleString Performance
**Learning:** Using `Number.prototype.toLocaleString()` inside tight React rendering loops (e.g. mapping over arrays or large datasets) causes significant performance overhead because it instantiates a new formatter object on every single call. This leads to wasted CPU cycles and garbage collection spikes.
**Action:** When repeatedly formatting numbers in a render loop, pre-instantiate `Intl.NumberFormat` outside the component (or in a `useMemo`) and reuse its `.format()` method. This provides the same localized formatting with drastically reduced performance overhead.

## 2026-03-29 - Unbounded In-Memory Cache Causes Memory Leaks in Next.js
**Learning:** Using an unbounded `Map` for server-side caching in long-running Node.js processes (like Next.js API routes) causes the V8 heap to grow indefinitely. For large objects (like stringified telemetry arrays), this quickly leads to Garbage Collection thrashing and eventual Out-of-Memory (OOM) crashes during prolonged use or high traffic.
**Action:** Always bound server-side in-memory caches (e.g., using an LRU cache pattern with a strict maximum size) to protect the Node.js event loop and maintain parity with backend architectures (like Python's `@lru_cache`).
## 2026-03-31 - Trailing Zeros Payload Bloat
**Learning:** Returning un-trimmed telemetry arrays with padding zeros from the API backend inflates the JSON payload size, increasing network transmission time and causing KPIs to incorrectly read 0.0.
**Action:** Trim trailing padding zeros in time-series telemetry arrays (e.g., CAS, PTCH, ROLL) prior to JSON serialization. Use a manual O(1) early-break loop to trim the views efficiently.

## 2026-03-31 - Pre-encoding cached JSON to Buffer in Next.js
**Learning:** Storing massive raw JSON strings (like flight telemetry) in an in-memory cache and directly passing them to `new NextResponse(string)` forces Next.js to repetitively spend CPU cycles and memory re-encoding the string to UTF-8 bytes on every single cache hit.
**Action:** When caching large textual payloads in a Node.js/Next.js environment, pre-encode the string to bytes once using `Buffer.from(string, 'utf-8')` before storing it in the cache map (`Map<string, Buffer>`). Passing a `Buffer` to `NextResponse` bypasses the framework's encoding step entirely, directly mirroring the FastAPI `Response(content=bytes)` optimization.
