import { NextResponse } from "next/server";
import { glob } from "glob";
import path from "path";
import fs from "fs";

const DATA_DIR = "/home/dh_lenovo_ideapad/FlightDataNASA/data/Tail_666_9";

export async function GET() {
    if (!fs.existsSync(DATA_DIR)) {
        return NextResponse.json({ error: "Data directory not found", path: DATA_DIR }, { status: 404 });
    }

    const files = glob.sync(path.join(DATA_DIR, "*.mat").replace(/\\/g, '/'));
    const file_names = files.map((f) => path.basename(f)).sort();
    return NextResponse.json({ files: file_names });
}
