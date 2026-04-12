import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
    className?: string;
    title?: string;
    headingLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function GlassPanel({ children, className, title, headingLevel = "h2", ...props }: GlassPanelProps) {
    const titleId = useId();
    const Component = title ? "section" : "div";
    const Heading = headingLevel;

    return (
        <Component
            className={cn(
                "relative overflow-hidden rounded-lg border border-emerald-500/30 bg-black p-4 transition-all hover:bg-emerald-950/20",
                "focus-within:border-emerald-500/50 focus-within:bg-emerald-950/30 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
                "shadow-[0_0_20px_rgba(16,185,129,0.05)]",
                className
            )}
            aria-labelledby={title ? titleId : undefined}
            {...props}
        >
            {title && (
                <Heading id={titleId} className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">
                    <span aria-hidden="true">&gt;</span> {title}
                </Heading>
            )}
            {children}
        </Component>
    );
}
