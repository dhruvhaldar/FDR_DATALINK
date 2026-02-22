import { NextRequest, NextResponse } from "next/server";
import { PythonShell } from "python-shell";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(process.cwd(), "Tail_666_9");

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params; // Next.js 15+ needs await on params in some cases, let's play safe
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
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
