## 2024-03-31 - Bounding React State Caches for Large Payloads
**Learning:** Storing massive data structures (like WebGL chart datasets from `.mat` files) in an unbounded React state cache (e.g., `useState<Record<string, FlightData>>({})`) creates severe memory leaks on the client as the user browses through more files. Garbage collection is unable to free the unused data.
**Action:** Always wrap in-memory React state caches that store large payloads with a bounded eviction policy (like Least Recently Used, LRU) with a strict maximum size to protect the browser's heap limit and prevent the app from freezing or crashing.
## 2024-05-15 - Map vs Plain Object React Caches
**Learning:** Using a plain object with `useState` for caching heavily structured data creates performance issues, notably O(N) memory cloning for LRU reordering and unnecessary component re-renders on cache-hit mutations. Using a native Map stored in a `useRef` enables true O(1) LRU evictions (Map.prototype.keys().next().value) without triggering expensive React redraws.
**Action:** Use `useRef(new Map())` for client-side LRU caches rather than `useState({})` when storing large payloads.
