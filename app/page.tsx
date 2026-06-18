"use client";

import React, { useEffect, useState, useMemo, memo, useRef } from "react";
import dynamic from "next/dynamic";
import { GlassPanel } from "@/components/GlassPanel";
import { Plane, Activity, Wind, Navigation, Gauge, Loader2, AlertTriangle, ExternalLink, RefreshCw, ChevronDown } from "lucide-react";

// ⚡ Bolt: Dynamically import Plotly using the factory with a specific gl2d subset.
// This drastically reduces the react-plotly.js bundle size from ~4.7MB to ~1.6MB,
// speeding up download times and lowering main thread parsing time.
import type { PlotParams } from 'react-plotly.js';

const Plot = dynamic<PlotParams>(
  async () => {
    const factoryModule = await import("react-plotly.js/factory");
    // @ts-expect-error - plotly.js dist modules don't have types
    const plotlyModule = await import("plotly.js/dist/plotly-gl2d");

    // Ensure we extract the default export correctly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createPlotlyComponent = (factoryModule as any).default ?? factoryModule;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Plotly = (plotlyModule as any).default ?? plotlyModule;

    const Component = createPlotlyComponent(Plotly);
    return Component;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2" role="status" aria-live="polite">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500/20 border-t-emerald-500" />
        <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-500/50">Initializing Canvas...</span>
      </div>
    )
  }
);

interface FlightDataParam {
  data: number[];
  units: string;
  rate: number;
  step?: number;
}

type FlightData = Record<string, FlightDataParam>;

const PARAM_CONFIG = [
  { key: 'ALT', name: 'Pressure Altitude LSP', color: '#06b6d4', icon: Navigation, unit: 'FT', unitTitle: 'Feet' },
  { key: 'CAS', name: 'Computed Airspeed LSP', color: '#f59e0b', icon: Wind, unit: 'KTS', unitTitle: 'Knots' },
  { key: 'PTCH', name: 'Pitch Angle LSP', color: '#f97316', icon: Gauge, unit: 'DEG', unitTitle: 'Degrees' },
  { key: 'ROLL', name: 'Roll Angle LSP', color: '#3b82f6', icon: Activity, unit: 'DEG', unitTitle: 'Degrees' },
  { key: 'VRTG', name: 'Vertical Acceleration', color: '#d946ef', icon: Activity, unit: 'G', unitTitle: 'G-Force' },
];

// ⚡ Bolt: Pre-instantiate Intl.NumberFormat outside the React component render loop.
// Calling .toLocaleString() inside a tight mapping/render loop creates significant
// performance overhead because it re-instantiates the formatter on every call.
// Reusing these formatters avoids CPU cycles and garbage collection overhead.
const formatOneDigit = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatTwoDigits = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ⚡ Bolt: React.memo prevents expensive re-renders of the TelemetryChart component
// if the props (which are now primitive or stable references) haven't changed.
const TelemetryChart = memo(function TelemetryChart({
  title,
  data,
  step,
  rate,
  color,
  unit,
  unitTitle,
  isLast
}: {
  title: string,
  data: number[],
  step: number,
  rate: number,
  color: string,
  unit: string,
  unitTitle: string,
  isLast: boolean
}) {
  // ⚡ Bolt: react-plotly.js is highly sensitive to prop object identity.
  // Passing fresh inline objects for data, layout, and config on every render forces
  // Plotly to perform deep equality checks and potential WebGL redraws.
  // Memoizing these objects reduces CPU spikes during parent component re-renders.
  // ⚡ Bolt: Using x0 and dx instead of generating an explicit x array avoids O(N) memory
  // allocation, massive array iteration, and reduces React re-renders memory footprint.
  const plotData = useMemo(() => [
    {
      y: data,
      x0: 0,
      dx: (step || 1) / rate,
      // ⚡ Bolt: Use 'scattergl' (WebGL) instead of 'scatter' (SVG) for high-density telemetry data.
      // This offloads rendering to the GPU, avoiding massive DOM node creation, unblocking
      // the main thread, and ensuring a smooth 60fps interaction framerate.
      type: "scattergl" as const,
      mode: "lines" as const,
      line: { color: color, width: 1.5 },
      fill: 'tozeroy' as const,
      fillcolor: `${color}08`,
      name: title
    },
  ], [data, step, rate, color, title]);

  const plotLayout = useMemo(() => ({
    paper_bgcolor: "#000000",
    plot_bgcolor: "#000000",
    font: { color: "#34d399", size: 10, family: 'Monaco, monospace' },
    margin: { t: 5, b: 35, l: 50, r: 25 },
    hovermode: "x" as const,
    xaxis: {
      gridcolor: "#065f46",
      gridwidth: 0.8,
      zeroline: false,
      title: {
        text: isLast ? "[ TIME_DOMAIN_SECONDS ]" : "",
        font: { size: 10, color: "#34d399", weight: 'bold' as const }
      },
      showticklabels: true,
      showline: true,
      linewidth: 1.5,
      linecolor: "#059669",
      mirror: true,
      tickfont: { size: 9, color: "#34d399", weight: 'bold' as const }
    },
    yaxis: {
      gridcolor: "#065f46",
      gridwidth: 0.8,
      zeroline: false,
      tickfont: { size: 9, color: "#34d399", weight: 'bold' as const },
      showline: true,
      linewidth: 1.5,
      linecolor: "#059669",
      mirror: true
    },
    showlegend: false,
    autosize: true
  }), [isLast]);

  const plotConfig = useMemo(() => ({ responsive: true, displayModeBar: false }), []);

  return (
    <div className="w-full group/chart">
      <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-200 group-hover/chart:text-emerald-400 group-focus-within/chart:text-emerald-400 transition-colors duration-300 px-1.5 flex justify-between">
        <span>{title}</span>
        <span className="text-slate-400 text-[10px]">
          <abbr
            title={unitTitle}
            tabIndex={0}
            className="cursor-help decoration-dotted underline decoration-slate-500/50 rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-black"
          >
            {unit}
          </abbr>
        </span>
      </h3>
      <div
        className="h-[160px] w-full bg-black rounded-lg border border-emerald-500/10 group-hover/chart:border-emerald-500/30 group-focus-within/chart:border-emerald-500/50 group-focus-within/chart:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        role="figure"
        tabIndex={0}
        aria-label={`Interactive telemetry chart displaying ${title} data over time in ${unitTitle}`}
      >
        <Plot
          data={plotData}
          layout={plotLayout}
          useResizeHandler
          className="h-full w-full"
          config={plotConfig}
        />
      </div>
    </div>
  );
});

export default function Dashboard() {
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingFiles, setIsFetchingFiles] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  // ⚡ Bolt: Client-side cache for fetched datasets.
  // Prevents re-fetching and the expensive unmount/remount of Plotly charts
  // when switching between previously viewed datasets.
  // ⚡ Bolt: Define maximum size for client-side cache to prevent memory leaks.
  // ⚡ Bolt: Using a native Map in a useRef prevents unnecessary component re-renders
  // on cache updates and allows for O(1) Least Recently Used (LRU) evictions.
  const MAX_CLIENT_CACHE_SIZE = 5;
  const dataCacheRef = useRef<Map<string, FlightData>>(new Map());

  // 🎨 Palette: Ref for the main content area to manage focus
  const mainContentRef = useRef<HTMLElement>(null);

  // ⚡ Bolt: Store the AbortController to cancel ongoing requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFlightData = (filename: string) => {
    // ⚡ Bolt: Fast-path for cached data.
    // This synchronous update avoids setting `loading = true`, which would
    // otherwise cause the heavy WebGL charts to unmount and remount.
    const cachedData = dataCacheRef.current.get(filename);
    if (cachedData) {
      setFlightData(cachedData);
      setStatusMessage(`Restored ${filename} from cache.`);

      // ⚡ Bolt: Move accessed item to the end of the Map keys
      // to maintain Least Recently Used (LRU) ordering
      dataCacheRef.current.delete(filename);
      dataCacheRef.current.set(filename, cachedData);
      return;
    }

    // ⚡ Bolt: Cancel any ongoing fetch request to prevent race conditions
    // and save network bandwidth when the user rapidly switches datasets.
    // This avoids expensive JSON parsing and WebGL chart rendering overhead for stale data.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setStatusMessage(`Loading flight data for ${filename}...`);
    fetch(`/api/data/${filename}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load flight data");
        return res.json();
      })
      .then((data) => {
        setFlightData(data);
        // ⚡ Bolt: Store fetched data in bounded LRU cache
        dataCacheRef.current.set(filename, data);
        if (dataCacheRef.current.size > MAX_CLIENT_CACHE_SIZE) {
          // O(1) LRU eviction by grabbing the first key
          const firstKey = dataCacheRef.current.keys().next().value;
          if (firstKey !== undefined) {
            dataCacheRef.current.delete(firstKey);
          }
        }
        setLoading(false);
        setStatusMessage(`Successfully loaded ${filename}.`);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          console.log(`Fetch aborted for ${filename}`);
          return;
        }
        console.error(err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setLoading(false);
        setStatusMessage(`Error loading ${filename}: ${err instanceof Error ? err.message : "An unknown error occurred"}`);
      });
  };

  // ⚡ Bolt: Clean up the abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Dynamic Document Title
  useEffect(() => {
    const isLoading = loading || isFetchingFiles;
    if (selectedFile) {
      document.title = `${isLoading ? '(Loading...) ' : ''}${selectedFile} | FDR DATALINK`;
    } else {
      document.title = `${isLoading ? '(Loading...) ' : ''}FDR DATALINK`;
    }
  }, [selectedFile, loading, isFetchingFiles]);

  // Global keyboard shortcut for focusing the dataset selector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const datasetSelect = document.getElementById("dataset-select");
        if (document.activeElement === datasetSelect) {
          document.getElementById('main-content')?.focus();
        }
        return;
      }

      // Ignore if user is already typing in an input or text area
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("dataset-select")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // ⚡ Bolt: Pre-load the optimized plotly gl2d chunk immediately on mount.
    // Waiting for the sequential API requests (/api/files -> /api/data) to resolve
    // before triggering the dynamic import creates a massive network waterfall,
    // delaying the First Meaningful Paint. By importing the correct factory and subset now,
    // the browser downloads the ~1.6MB chart library in parallel with the JSON data.
    // WARNING: Do not import("react-plotly.js") directly here, as it will eagerly
    // download the full unoptimized ~4.7MB bundle, defeating the dynamic import optimization.
    import("react-plotly.js/factory").catch(() => {});
    // @ts-expect-error - plotly.js dist modules don't have types
    import("plotly.js/dist/plotly-gl2d").catch(() => {});

    setStatusMessage("Fetching available datasets...");
    fetch("/api/files")
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setFiles(data.files);
          if (data.files.length > 0) {
            const initialFile = data.files[0];
            setSelectedFile(initialFile);
            fetchFlightData(initialFile);
          } else {
            setStatusMessage("No datasets available. Please add .mat telemetry files to the server.");
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch files:", err);
        setStatusMessage("Error fetching available datasets.");
      })
      .finally(() => {
        setIsFetchingFiles(false);
      });
  }, []);

  return (
    <div className="min-h-screen p-4 max-w-7xl mx-auto bg-black text-emerald-500 selection:bg-emerald-500/30 selection:text-white">
      {/* 🎨 Palette: Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-emerald-950 focus:text-emerald-400 focus:px-4 focus:py-2 focus:rounded focus:border focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-black font-bold uppercase tracking-widest text-xs"
      >
        Skip to main content
      </a>

      {/* 🎨 Palette: Screen reader status region */}
      <div aria-live="polite" className="sr-only" role="status">
        {statusMessage}
      </div>

      <header className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2 ring-1 ring-emerald-500/30">
            <Plane className="h-6 w-6 text-emerald-500" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight font-sans">
              FDR <span className="text-emerald-500">DATALINK</span>
            </h1>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-[0.25em]">Flight Recorder Analysis Interface v1.0</p>
          </div>
        </div>

        <div className="flex flex-col md:items-end mt-4 md:mt-0 gap-1">
          <GlassPanel className={`group p-1 w-full md:w-auto flex items-center pr-2 transition-colors duration-300 ${error ? 'border-red-500/50 bg-red-950/10 hover:bg-red-950/20 focus-within:border-red-500/50 focus-within:bg-red-950/30 focus-within:shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}`}>
            <label htmlFor="dataset-select" className={`pl-3 pr-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer whitespace-nowrap flex items-center gap-1.5 transition-colors duration-300 ${error ? 'text-red-400 group-hover:text-red-300 group-focus-within:text-red-300' : 'text-emerald-400 group-hover:text-emerald-300 group-focus-within:text-emerald-300'} ${(isFetchingFiles || files.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              Dataset:
              <div className="w-3 shrink-0 flex items-center justify-center">
                <Loader2 aria-hidden="true" className={`w-3 h-3 animate-spin transition-opacity duration-300 ${loading || isFetchingFiles ? 'opacity-100' : 'opacity-0'}`} />
              </div>
              <span className="hidden md:grid items-center justify-items-center relative">
                <kbd className={`col-start-1 row-start-1 rounded border px-1 py-0.5 text-[8px] font-mono transition-all duration-300 group-focus-within:opacity-0 group-focus-within:scale-75 ${error ? 'border-red-500/30 bg-red-950/30 text-red-400 group-hover:border-red-400 group-hover:text-red-300' : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400 group-hover:border-emerald-400 group-hover:text-emerald-300'}`} aria-hidden="true" title="Press '/' to focus dataset selector">/</kbd>
                <kbd className={`col-start-1 row-start-1 rounded border px-1 py-0.5 text-[8px] font-mono transition-all duration-300 opacity-0 scale-75 group-focus-within:opacity-100 group-focus-within:scale-100 ${error ? 'border-red-500/30 bg-red-950/30 text-red-400 group-focus-within:border-red-400 group-focus-within:text-red-300' : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-400 group-focus-within:border-emerald-400 group-focus-within:text-emerald-300'}`} aria-hidden="true" title="Press 'Escape' to blur">ESC</kbd>
              </span>
            </label>
            <div className="relative w-full md:w-56">
              <select
                id="dataset-select"
                value={selectedFile}
                disabled={isFetchingFiles || files.length === 0}
                title={isFetchingFiles ? "Fetching available datasets" : (loading ? "Loading flight data..." : (files.length === 0 ? "No datasets available" : "Select a dataset"))}
                aria-busy={isFetchingFiles || loading}
                aria-invalid={!!error}
                aria-keyshortcuts="/"
                aria-controls="telemetry-pipeline"
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedFile(val);
                  fetchFlightData(val);
                }}
                className={`appearance-none bg-transparent pl-3 pr-8 py-1 text-xs outline-none w-full cursor-pointer transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded ${error ? 'text-red-500 hover:text-red-400 focus-visible:ring-red-500' : 'text-emerald-500 hover:text-emerald-400 focus-visible:ring-emerald-500'}`}
              >
                {isFetchingFiles && <option value="" disabled className="bg-black text-emerald-500">Loading datasets...</option>}
                {!isFetchingFiles && files.length === 0 && <option value="" disabled className="bg-black text-emerald-500">No datasets available</option>}
                {!isFetchingFiles && files.length > 0 && <option value="" disabled className="bg-black text-emerald-500">Select a dataset...</option>}
                {files.map((f) => (
                  <option key={f} value={f} className="bg-black text-emerald-500">
                    {f}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown className={`h-4 w-4 ${error ? 'text-red-500 group-hover:text-red-400 group-focus-within:text-red-400' : 'text-emerald-500 group-hover:text-emerald-400 group-focus-within:text-emerald-400'} transition-colors duration-300 opacity-70`} aria-hidden="true" />
              </div>
            </div>
          </GlassPanel>
          <a
            href="https://c3.ndc.nasa.gov/dashlink/projects/85/"
            target="_blank"
            rel="noopener noreferrer"
            className="group text-[10px] text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/50 transition-colors uppercase tracking-[0.10em] px-2 mt-1 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm focus-visible:outline-none inline-flex items-center gap-1 justify-end"
          >
            Source: NASA Dashlink
            <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </header>

      <GlassPanel title="Project Context: Sample Flight Data via NASA Dashlink" className="mb-6 p-5 border-emerald-500/40 bg-emerald-950/20">
        <p className="text-xs leading-relaxed text-emerald-300 font-medium">
          This application displays data from the <a href="https://c3.ndc.nasa.gov/dashlink/projects/85/" target="_blank" rel="noopener noreferrer" className="group text-emerald-400 font-bold underline decoration-emerald-500/50 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm focus-visible:outline-none inline-flex items-center gap-0.5">Sample Flight Data project via NASA Dashlink <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5" aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></a> (A web-based collaboration tool for those interested in data mining and systems health). Through access to de-identified aggregate flight recorded data, researchers have the ability to proactively identify and analyze trends and target resources to reduce operational risks in the National Airspace System (NAS). This valuable data source enables the aviation community to take positive steps in mitigating potential issues in the system and improving the overall safety of the NAS. The posted files contain actual data recorded onboard a single type of regional jet operating in commercial service over a three-year period. While the files contain detailed aircraft dynamics, system performance, and other engineering parameters, they do not provide any information that can be traced to a particular airline or manufacturer. These records are not part of any airline Flight Operational Quality Assurance (FOQA) program.
        </p>
      </GlassPanel>

      <main id="main-content" ref={mainContentRef} tabIndex={-1} className="grid grid-cols-1 gap-4 lg:grid-cols-4 outline-none" aria-label="Flight Data Dashboard Content">
        {/* Navigation / KPIs */}
        <section className="lg:col-span-1" aria-labelledby="kpi-heading">
          <h2 id="kpi-heading" className="sr-only">Flight Parameters</h2>
          <div role="group" aria-label="Key Performance Indicators" className="space-y-3">
            {PARAM_CONFIG.map((param) => {
              const Icon = param.icon;
              // ⚡ Bolt: Avoids O(1) array allocation via slice(-1) per render per param
              const paramData = flightData?.[param.key]?.data;
              const val = paramData ? paramData[paramData.length - 1] : undefined;
              const formattedVal = val !== undefined ? (param.key === 'VRTG' ? formatTwoDigits.format(val) : formatOneDigit.format(val)) : 'No data';
              const unitLabel = flightData?.[param.key]?.units || param.unitTitle;

              return (
                <GlassPanel
                  key={param.key}
                  title={param.name}
                  headingLevel="h3"
                  className="p-3 group cursor-default focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black outline-none"
                  aria-busy={loading}
                  tabIndex={0}
                  aria-label={`${param.name}: ${formattedVal} ${unitLabel}`}
                >
                  <div className={`flex items-center justify-between transition-opacity duration-300 ${loading ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>
                    <div className="flex items-baseline gap-1.5">
                      <span aria-hidden="true" className={`text-2xl font-mono`} style={{ color: param.color }}>
                        {val !== undefined ? (param.key === 'VRTG' ? formatTwoDigits.format(val) : formatOneDigit.format(val)) : (
                          <>---</>
                        )}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">
                        <abbr
                          title={param.unitTitle}
                          tabIndex={0}
                          className="cursor-help decoration-dotted underline decoration-emerald-500/50 rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 focus-visible:ring-offset-black"
                        >
                          {flightData?.[param.key]?.units || param.unit}
                        </abbr>
                      </span>
                    </div>
                    <Icon className="h-5 w-5 text-emerald-500/40 transition-all duration-500 group-hover:scale-110 group-hover:text-emerald-400 group-focus-within:scale-110 group-focus-within:text-emerald-400" aria-hidden="true" />
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        </section>

        {/* Multi-Graph Visualization Suite */}
        <GlassPanel id="telemetry-pipeline" title="Telemetry Data Pipeline" headingLevel="h2" className="lg:col-span-3">
          {/* ⚡ Bolt: Adding relative positioning here allows the loading overlay to position correctly without unmounting WebGL charts */}
          <div className="space-y-4 relative">
            {(isFetchingFiles && files.length === 0) || (!flightData && loading) ? (
              <div
                role="status"
                aria-live="polite"
                aria-label={isFetchingFiles ? "Fetching available datasets" : `Loading flight data for ${selectedFile}`}
                className="flex h-[400px] flex-col items-center justify-center gap-3"
              >
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 animate-pulse">
                  {isFetchingFiles ? "Fetching Datasets..." : "Processing Telemetry..."}
                </span>
              </div>
            ) : error ? (
              <div
                className="flex h-[400px] flex-col items-center justify-center gap-4"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <AlertTriangle className="h-10 w-10 text-red-500/80" aria-hidden="true" />
                  <p role="alert" className="text-sm font-bold uppercase tracking-wider text-red-500">{error}</p>
                  <button
                    type="button"
                    onClick={() => document.getElementById('dataset-select')?.focus()}
                    className="group flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 underline decoration-red-500/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-sm"
                    aria-label="Please try selecting another file (Focuses dataset selector)"
                    aria-keyshortcuts="/"
                  >
                    Please try selecting another file
                    <kbd className="hidden md:inline-block rounded border border-red-500/30 bg-red-950/30 px-1 py-0.5 text-[8px] font-mono text-red-400 transition-colors group-hover:border-red-400 group-hover:text-red-300 group-focus-visible:border-red-400 group-focus-visible:text-red-300" aria-hidden="true" title="Press '/' to focus dataset selector">/</kbd>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    fetchFlightData(selectedFile);
                    mainContentRef.current?.focus();
                  }}
                  disabled={loading}
                  title={loading ? "Loading flight data..." : ""}
                  className={`group flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-500 transition-colors hover:bg-red-500/20 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Retry Connection (Fetches selected dataset)"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : 'transition-transform group-hover:rotate-180 group-focus-visible:rotate-180 duration-500'}`} aria-hidden="true" />
                  Retry Connection
                </button>
              </div>
            ) : !isFetchingFiles && files.length === 0 ? (
              <div role="status" className="flex h-[400px] flex-col items-center justify-center gap-4">
                <div className="rounded-full bg-red-500/5 p-4 ring-1 ring-red-500/20">
                  <AlertTriangle className="h-8 w-8 text-red-500/40" aria-hidden="true" />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-red-500">No Datasets Available</p>
                  <p className="text-[10px] text-red-400 uppercase tracking-wider">Please add .mat telemetry files to the server</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="group mt-2 flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-500 transition-colors hover:bg-red-500/20 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-95"
                  aria-label="Check Again (Reloads page)"
                  aria-keyshortcuts="F5"
                >
                  <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-180 group-focus-visible:rotate-180 duration-500" aria-hidden="true" />
                  Check Again
                  <kbd className="hidden md:inline-block rounded border border-red-500/30 bg-red-950/30 px-1 py-0.5 text-[10px] font-mono text-red-400 transition-colors group-hover:border-red-400 group-hover:text-red-300 group-focus-visible:border-red-400 group-focus-visible:text-red-300" aria-hidden="true" title="Press 'F5' to reload page">F5</kbd>
                </button>
              </div>
            ) : flightData ? (
              <>
                {/* ⚡ Bolt: Render loading overlay instead of unmounting charts to prevent expensive WebGL context recreation */}
                {/* ⚡ Bolt: Removed backdrop-blur-sm because CSS backdrop filters over WebGL canvases force the
                    browser to read back the GPU framebuffer to the CPU for compositing, causing severe main-thread lockups and jank. */}
                {loading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 rounded-lg" aria-hidden="true">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 animate-pulse">Processing Telemetry...</span>
                    </div>
                  </div>
                )}
                {PARAM_CONFIG.map((param, idx) => {
                  const pData = flightData?.[param.key];
                  if (!pData) return null;

                  return (
                    <TelemetryChart
                      key={param.key}
                      title={param.name}
                      data={pData.data}
                      step={pData.step || 1}
                      rate={pData.rate}
                      color={param.color}
                      unit={pData.units || param.unit}
                      unitTitle={param.unitTitle}
                      isLast={idx === PARAM_CONFIG.length - 1}
                    />
                  );
                })}
              </>
            ) : (
              <div role="status" className="flex h-[400px] flex-col items-center justify-center gap-4">
                <div className="rounded-full bg-emerald-500/5 p-4 ring-1 ring-emerald-500/20">
                  <Activity className="h-8 w-8 text-emerald-500/40" aria-hidden="true" />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Ready for Telemetry</p>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider">Select a dataset to begin visualization</p>
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById('dataset-select')?.focus()}
                  className="group mt-2 flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-500 transition-all hover:bg-emerald-500/20 hover:text-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-95"
                  aria-label="Connect Data Source (Focuses dataset selector)"
                  aria-keyshortcuts="/"
                >
                  Connect Data Source
                  <kbd className="hidden md:inline-block rounded border border-emerald-500/30 bg-emerald-950/30 px-1 py-0.5 text-[10px] font-mono text-emerald-400 transition-colors group-hover:border-emerald-400 group-hover:text-emerald-300 group-focus-visible:border-emerald-400 group-focus-visible:text-emerald-300" aria-hidden="true" title="Press '/' to focus dataset selector">/</kbd>
                </button>
              </div>
            )}
          </div>
        </GlassPanel>
      </main>

      <footer className="mt-8 text-center text-[10px] text-emerald-400 font-medium pb-8 uppercase tracking-[0.4em] flex justify-center items-center flex-wrap gap-2">
        <a href="https://github.com/dhruvhaldar/FDR_DATALINK" target="_blank" rel="noopener noreferrer" className="group hover:text-emerald-300 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm focus-visible:outline-none inline-flex items-center gap-1">FDR_DATALINK <ExternalLink className="h-2.5 w-2.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5" aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></a>
        <span aria-hidden="true">•</span>
        <span>GPLv3.0</span>
        <span aria-hidden="true">•</span>
        <a href="https://dhruvhaldar.vercel.app/" target="_blank" rel="noopener noreferrer" className="group hover:text-emerald-300 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm focus-visible:outline-none inline-flex items-center gap-1">Dhruv Haldar <ExternalLink className="h-2.5 w-2.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5" aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></a>
      </footer>
    </div>
  );
}
