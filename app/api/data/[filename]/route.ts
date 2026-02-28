import { NextRequest, NextResponse } from "next/server";
import { PythonShell } from "python-shell";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "Tail_666_9");

// ⚡ Bolt: In-memory cache to prevent re-running expensive Python script
// for previously processed files (saves ~600ms per request)
// Using `unknown` instead of `any` for type safety
const cache = new Map<string, unknown>();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params; // Next.js 15+ needs await on params in some cases, let's play safe

    // ⚡ Bolt: Check cache first to avoid expensive Python process spawn and SciPy parsing
    if (cache.has(filename)) {
        return NextResponse.json(cache.get(filename), {
            headers: {
                // ⚡ Bolt: Also instruct the browser/CDN to cache this static file's response
                "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
            },
        });
    }

    const filePath = path.join(DATA_DIR, filename);
    const scriptPath = path.join(process.cwd(), "lib", "extract_data.py");

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    try {
        const results = await PythonShell.run(scriptPath, {
            args: [filePath],
        });

        if (!results || results.length === 0) {
            return NextResponse.json({ error: "Failed to extract data" }, { status: 500 });
        }

        const data = JSON.parse(results[0]);

        // ⚡ Bolt: Store the expensive parsed result in memory
        cache.set(filename, data);

        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
            },
        });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
