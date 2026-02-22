import React from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

export function GlassPanel({ children, className, title, ...props }: GlassPanelProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-lg border border-emerald-500/30 bg-black p-4 transition-all hover:bg-emerald-950/20",
                "shadow-[0_0_20px_rgba(16,185,129,0.05)]",
                className
            )}
            {...props}
        >
            {title && (
                <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-500">
                    {">"} {title}
                </h3>
            )}
            {children}
        </div>
    );
}
