"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { GlassPanel } from "@/components/GlassPanel";
import { Plane, Activity, Wind, Navigation, Gauge, Loader2, AlertTriangle } from "lucide-react";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface FlightDataParam {
  data: number[];
  units: string;
  rate: number;
  step?: number;
}

type FlightData = Record<string, FlightDataParam>;

const PARAM_CONFIG = [
  { key: 'ALT', name: 'Pressure Altitude LSP', color: '#06b6d4', icon: Navigation, unit: 'FT' },
  { key: 'CAS', name: 'Computed Airspeed LSP', color: '#f59e0b', icon: Wind, unit: 'KTS' },
  { key: 'PTCH', name: 'Pitch Angle LSP', color: '#f97316', icon: Gauge, unit: 'DEG' },
  { key: 'ROLL', name: 'Roll Angle LSP', color: '#3b82f6', icon: Activity, unit: 'DEG' },
  { key: 'VRTG', name: 'Vertical Acceleration', color: '#d946ef', icon: Activity, unit: 'G' },
];

function TelemetryChart({
  title,
  data,
  x,
  color,
  unit,
  isLast
}: {
  title: string,
  data: number[],
  x: number[],
  color: string,
  unit: string,
  isLast: boolean
}) {
  return (
    <div className="w-full">
      <h4 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-200 px-1.5 flex justify-between">
        <span>{title}</span>
        <span className="text-slate-400 text-[10px]">{unit}</span>
      </h4>
      <div className="h-[160px] w-full bg-black rounded-lg border border-emerald-500/10 overflow-hidden">
        <Plot
          data={[
            {
              x: x,
              y: data,
              type: "scatter",
              mode: "lines",
              line: { color: color, width: 1.5 },
              fill: 'tozeroy',
              fillcolor: `${color}08`,
              name: title
            },
          ]}
          layout={{
            paper_bgcolor: "#000000",
            plot_bgcolor: "#000000",
            font: { color: "#34d399", size: 10, family: 'Monaco, monospace' },
            margin: { t: 5, b: 35, l: 50, r: 25 },
            hovermode: "x",
            xaxis: {
              gridcolor: "#065f46",
              gridwidth: 0.8,
              zeroline: false,
              title: {
                text: isLast ? "[ TIME_DOMAIN_SECONDS ]" : "",
                font: { size: 10, color: "#34d399", weight: 'bold' }
              },
              showticklabels: true,
              showline: true,
              linewidth: 1.5,
              linecolor: "#059669",
              mirror: true,
              tickfont: { size: 9, color: "#34d399", weight: 'bold' }
            },
            yaxis: {
              gridcolor: "#065f46",
              gridwidth: 0.8,
              zeroline: false,
              tickfont: { size: 9, color: "#34d399", weight: 'bold' },
              showline: true,
              linewidth: 1.5,
              linecolor: "#059669",
              mirror: true
            },
            showlegend: false,
            autosize: true
          }}
          useResizeHandler
          className="h-full w-full"
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFlightData = (filename: string) => {
    setLoading(true);
    setError(null);
    fetch(`/api/data/${filename}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load flight data");
        return res.json();
      })
      .then((data) => {
        setFlightData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFiles(data.files);
          if (data.files.length > 0) {
            const initialFile = data.files[0];
            setSelectedFile(initialFile);
            fetchFlightData(initialFile);
          }
        }
      });
  }, []);

  return (
    <div className="min-h-screen p-4 max-w-7xl mx-auto bg-black text-emerald-500 selection:bg-emerald-500/30 selection:text-white">

      <header className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2 ring-1 ring-emerald-500/30">
            <Plane className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight font-sans">
              FDR <span className="text-emerald-500">DATALINK</span>
            </h1>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-[0.25em]">Flight Recorder Analysis Interface v1.0</p>
          </div>
        </div>

        <div className="flex flex-col md:items-end mt-4 md:mt-0 gap-1">
          <GlassPanel className="p-1 w-full md:w-auto flex items-center pr-2">
            <select
              value={selectedFile}
              disabled={loading}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedFile(val);
                fetchFlightData(val);
              }}
              aria-label="Select flight recording"
              className="bg-transparent px-3 py-1 text-xs text-emerald-500 outline-none w-full md:w-56 cursor-pointer hover:text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {files.map((f) => (
                <option key={f} value={f} className="bg-black text-emerald-500">
                  {f}
                </option>
              ))}
            </select>
            {loading && <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />}
          </GlassPanel>
          <a
            href="https://c3.ndc.nasa.gov/dashlink/projects/85/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-emerald-400/80 hover:text-emerald-300 underline decoration-emerald-500/50 transition-colors uppercase tracking-[0.10em] px-2 text-right mt-1"
          >
            Source: NASA Dashlink
          </a>
        </div>
      </header>

      <GlassPanel className="mb-6 p-5 border-emerald-500/40 bg-emerald-950/20">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
          Project Context: Sample Flight Data via NASA Dashlink
        </h2>
        <p className="text-xs leading-relaxed text-emerald-300 font-medium text-justify">
          This application displays data from the <a href="https://c3.ndc.nasa.gov/dashlink/projects/85/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold underline decoration-emerald-500/50 hover:text-white transition-colors">Sample Flight Data project via NASA Dashlink</a> (A web-based collaboration tool for those interested in data mining and systems health). Through access to de-identified aggregate flight recorded data, researchers have the ability to proactively identify and analyze trends and target resources to reduce operational risks in the National Airspace System (NAS). This valuable data source enables the aviation community to take positive steps in mitigating potential issues in the system and improving the overall safety of the NAS. The posted files contain actual data recorded onboard a single type of regional jet operating in commercial service over a three-year period. While the files contain detailed aircraft dynamics, system performance, and other engineering parameters, they do not provide any information that can be traced to a particular airline or manufacturer. These records are not part of any airline Flight Operational Quality Assurance (FOQA) program.
        </p>
      </GlassPanel>

      <main className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Navigation / KPIs */}
        <div className="space-y-3 lg:col-span-1">
          {PARAM_CONFIG.map((param) => {
            const Icon = param.icon;
            const val = flightData?.[param.key]?.data?.slice(-1)[0];
            return (
              <GlassPanel key={param.key} title={param.name} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl font-mono`} style={{ color: param.color }}>
                      {val !== undefined ? val.toFixed(param.key === 'VRTG' ? 2 : 1) : "---"}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-500/60 uppercase">{flightData?.[param.key]?.units || param.unit}</span>
                  </div>
                  <Icon className="h-5 w-5 text-emerald-500/40" />
                </div>
              </GlassPanel>
            );
          })}
        </div>

        {/* Multi-Graph Visualization Suite */}
        <GlassPanel title="Telemetry Data Pipeline" className="lg:col-span-3">
          <div className="space-y-4">
            {loading ? (
              <div
                role="status"
                aria-live="polite"
                aria-label="Loading flight data"
                className="flex h-[400px] items-center justify-center"
              >
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
              </div>
            ) : error ? (
              <div
                role="alert"
                className="flex h-[400px] flex-col items-center justify-center gap-4"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <AlertTriangle className="h-10 w-10 text-red-500/80" />
                  <p className="text-sm font-bold uppercase tracking-wider text-red-500">{error}</p>
                  <p className="text-[10px] text-emerald-500/60">Please try selecting another file</p>
                </div>
                <button
                  onClick={() => fetchFlightData(selectedFile)}
                  className="rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-500 transition-colors hover:bg-emerald-500/20 hover:text-emerald-400"
                >
                  Retry Connection
                </button>
              </div>
            ) : flightData ? (
              PARAM_CONFIG.map((param, idx) => {
                const pData = flightData?.[param.key];
                if (!pData) return null;

                const x = Array.from({ length: pData.data.length }, (_, i) => (i * (pData.step || 1)) / pData.rate);

                return (
                  <TelemetryChart
                    key={param.key}
                    title={param.name}
                    data={pData.data}
                    x={x}
                    color={param.color}
                    unit={pData.units || param.unit}
                    isLast={idx === PARAM_CONFIG.length - 1}
                  />
                );
              })
            ) : (
              <div className="flex h-[400px] items-center justify-center">
                <p className="text-emerald-500/60 text-sm italic underline decoration-emerald-500/30">Connect to data source via selector</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </main>

      <footer className="mt-8 text-center text-[10px] text-emerald-400 font-medium pb-8 uppercase tracking-[0.4em]">
        <a href="https://github.com/dhruvhaldar/FDR_DATALINK" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 transition-colors">FDR_DATALINK</a> • GPLv3.0 • <a href="https://dhruvhaldar.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 transition-colors">Dhruv Haldar</a>
      </footer>
    </div>
  );
}
