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