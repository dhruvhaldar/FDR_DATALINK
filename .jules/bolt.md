## 2024-05-20 - Expensive Python Parsing in API Route
**Learning:** The API route `app/api/data/[filename]/route.ts` executes a Python script (`extract_data.py`) using `python-shell` for every request. This incurs a significant overhead (0.5s - 1.0s) due to Python VM startup and `scipy.io.loadmat` parsing, even for previously requested static `.mat` files.
**Action:** Implement an in-memory cache (`Map`) in the API route to store the parsed JSON output for each filename. This bypasses the Python execution entirely for repeated requests, reducing response time significantly for cached files.

## 2024-05-21 - Native FS vs Glob Performance
**Learning:** The `glob` library (`glob.sync`), while convenient, adds measurable overhead (~2.5x slower) compared to Node.js native `fs.promises.readdir` when listing a large number of files in a single directory. The overhead comes from parsing glob string patterns and additional file system traversals that glob performs under the hood.
**Action:** For simple, flat-directory filtering tasks (e.g. "list all files ending in `.mat`"), always prefer native `fs.readdir` or `fs.promises.readdir` with a manual `.filter()` instead of introducing a `glob` dependency to avoid unnecessary performance bottlenecks on the API layer.

## 2024-05-22 - Expensive WebGL Unmounts in React
**Learning:** React unmounting expensive WebGL charts (like `react-plotly.js`) during asynchronous data fetching (by setting `loading = true`) causes noticeable jitter and re-renders when switching between already viewed datasets. Even if the network request is cached by the browser, the async tick causes the UI to flush the DOM, destroying and rebuilding the WebGL context.
**Action:** Implement client-side memory caching (`dataCache` state) to bypass `fetch` entirely for previously loaded data. Updating state synchronously avoids the `loading = true` state change, keeping the charts mounted and significantly improving perceived performance during dataset switching.
