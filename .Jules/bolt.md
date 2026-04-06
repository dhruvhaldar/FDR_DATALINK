## 2024-03-31 - Bounding React State Caches for Large Payloads
**Learning:** Storing massive data structures (like WebGL chart datasets from `.mat` files) in an unbounded React state cache (e.g., `useState<Record<string, FlightData>>({})`) creates severe memory leaks on the client as the user browses through more files. Garbage collection is unable to free the unused data.
**Action:** Always wrap in-memory React state caches that store large payloads with a bounded eviction policy (like Least Recently Used, LRU) with a strict maximum size to protect the browser's heap limit and prevent the app from freezing or crashing.
## 2024-04-06 - Replacing React State Cache with useRef<Map>
**Learning:** Using `useState<Record<string, Any>>` for a client-side cache of large payloads triggers costly component re-renders and forces $O(N)$ key operations for LRU evictions.
**Action:** Prefer storing the cache in a native `Map` inside a `useRef`. This prevents React from tracking the cache as state (eliminating unnecessary re-renders) and provides $O(1)$ LRU eviction by grabbing the first key (`Map.prototype.keys().next().value`) instead of cloning and keying an entire object map.
