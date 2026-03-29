import { NextRequest, NextResponse } from "next/server";
import { PythonShell } from "python-shell";
import path from "path";
import fsp from "fs/promises";

const DATA_DIR = path.join(process.cwd(), "Tail_666_9");

// ⚡ Bolt: In-memory LRU cache to prevent re-running expensive Python script
// for previously processed files (saves ~600ms per request).
// Bounding the cache to 16 items prevents infinite Node.js heap growth (memory leaks)
// during prolonged usage, maintaining parity with the Python backend @lru_cache.
// ⚡ Bolt: Cache raw JSON string instead of parsed object to avoid expensive JSON.parse/stringify
const MAX_CACHE_SIZE = 16;
const cache = new Map<string, string>();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    // ⚡ Bolt: Check cache first to avoid expensive Python process spawn and SciPy parsing
    if (cache.has(filename)) {
        // Move the accessed item to the end to mark it as recently used (LRU)
        const cachedData = cache.get(filename)!;
        cache.delete(filename);
        cache.set(filename, cachedData);

        return new NextResponse(cachedData, {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
            },
        });
    }

    const filePath = path.join(DATA_DIR, filename);
    const scriptPath = path.join(process.cwd(), "lib", "extract_data.py");

    try {
        // ⚡ Bolt: Replace synchronous fs.existsSync with async fsp.access
        // to prevent blocking the Node.js event loop during concurrent requests.
        await fsp.access(filePath);
    } catch {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    try {
        const results = await PythonShell.run(scriptPath, {
            args: [filePath],
        });

        if (!results || results.length === 0) {
            return NextResponse.json({ error: "Failed to extract data" }, { status: 500 });
        }

        const rawJsonString = results[0];

        // ⚡ Bolt: Store the raw JSON string in memory
        cache.set(filename, rawJsonString);

        // ⚡ Bolt: Enforce LRU cache limits to prevent memory leaks
        if (cache.size > MAX_CACHE_SIZE) {
            const oldestKey = cache.keys().next().value;
            if (oldestKey !== undefined) {
                cache.delete(oldestKey);
            }
        }

        return new NextResponse(rawJsonString, {
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
            },
        });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
