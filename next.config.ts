import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dashboard and its preprocessed telemetry are entirely static. This keeps
  // Vercel from creating (and storing) a server function for every deployment.
  output: "export",
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
