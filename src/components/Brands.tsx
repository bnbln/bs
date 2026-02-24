"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

export type BrandLogo = {
    src: string;
    padding?: string;
} | string;

const GAP = 19;
const PAUSE_MS = 3000;
const SLIDE_S = 0.5;
const DEFAULT_PADDING = "20%";

interface BrandsProps {
    logos: BrandLogo[];
    title?: string;
}

/** Normalize a BrandLogo entry (string or object) into { src, padding } */
function normalize(entry: BrandLogo): { src: string; padding: string } {
    if (typeof entry === "string") {
        return {
            src: entry.startsWith("/") ? entry : `/${entry}`,
            padding: DEFAULT_PADDING,
        };
    }
    return {
        src: entry.src.startsWith("/") ? entry.src : `/${entry.src}`,
        padding: entry.padding ?? DEFAULT_PADDING,
    };
}

/**
 * Pick initial logo indices so no logo appears twice in the row.
 * Falls back to allowing repeats only when logos < count.
 */
function pickInitial(totalLogos: number, count: number): number[] {
    if (totalLogos === 0 || count === 0) return [];
    if (totalLogos === 1) return Array(count).fill(0);

    const result: number[] = [];
    const available = Array.from({ length: totalLogos }, (_, i) => i);

    // Shuffle
    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }

    for (let i = 0; i < count; i++) {
        result.push(available[i % available.length]);
    }
    return result;
}

export default function Brands({ logos: logosRaw, title }: BrandsProps) {
    const entries = logosRaw ?? [];
    const logos = entries.map(normalize);
    const containerRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(3);
    const [boxLogos, setBoxLogos] = useState<number[]>([]);
    const isPaused = false;

    const boxLogosRef = useRef<number[]>([]);
    const nextBoxRef = useRef(0);

    useEffect(() => {
        boxLogosRef.current = boxLogos;
    }, [boxLogos]);

    /* ── Responsive: how many square boxes fit ─────────────────── */
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0].contentRect.width;
            const minSize = 120; // smaller minSize to fit at least 3 easily, but let's say 120-150px
            let count = Math.max(3, Math.floor((w + GAP) / (minSize + GAP)));
            if (logos.length > 0) count = Math.min(count, logos.length);
            setVisibleCount(count);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [logos.length]);

    /* ── Initialize box logos ──────────────────────────────────── */
    useEffect(() => {
        if (logos.length === 0 || visibleCount === 0) return;
        const timeoutId = window.setTimeout(() => {
            const initial = pickInitial(logos.length, visibleCount);
            setBoxLogos(initial);
            nextBoxRef.current = 0;
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [logos.length, visibleCount]);

    /* ── Staggered timer: one box changes per tick ─────────────── */
    useEffect(() => {
        if (isPaused || logos.length === 0 || boxLogos.length === 0) return;

        const timer = setInterval(() => {
            const boxIdx = nextBoxRef.current;
            const current = boxLogosRef.current;
            if (current.length === 0) return;

            // Exclude ALL logos currently visible in any box + self
            const excluded = new Set<number>(current);

            // Pick random logo not in the entire visible row
            const candidates: number[] = [];
            for (let i = 0; i < logos.length; i++) {
                if (!excluded.has(i)) candidates.push(i);
            }

            let newLogo: number;
            if (candidates.length > 0) {
                newLogo = candidates[Math.floor(Math.random() * candidates.length)];
            } else {
                // All logos are visible — at least avoid neighbours + self
                const softExcluded = new Set<number>();
                softExcluded.add(current[boxIdx]);
                if (boxIdx > 0) softExcluded.add(current[boxIdx - 1]);
                if (boxIdx < current.length - 1) softExcluded.add(current[boxIdx + 1]);
                const softCandidates = Array.from({ length: logos.length }, (_, i) => i).filter(
                    (i) => !softExcluded.has(i)
                );
                newLogo =
                    softCandidates.length > 0
                        ? softCandidates[Math.floor(Math.random() * softCandidates.length)]
                        : (current[boxIdx] + 1) % logos.length;
            }

            setBoxLogos((prev) => {
                const next = [...prev];
                next[boxIdx] = newLogo;
                return next;
            });

            nextBoxRef.current = (boxIdx + 1) % current.length;
        }, PAUSE_MS);

        return () => clearInterval(timer);
    }, [isPaused, logos.length, boxLogos.length]);

    return (
        <div className="flex flex-col gap-6 w-full">
            {title && (
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 font-inter px-2">
                    {title}
                </h4>
            )}
            <div
                ref={containerRef}
                className="grid w-full"
                style={{
                    gridTemplateColumns: `repeat(${visibleCount}, 1fr)`,
                    gap: `${GAP}px`,
                }}
            >
                {logos.length === 0 ? (
                    Array.from({ length: visibleCount }).map((_, i) => (
                        <div
                            key={`empty-${i}`}
                            className="aspect-square bg-white border border-neutral-200/80 rounded-[2rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                        />
                    ))
                ) : (
                    Array.from({ length: visibleCount }).map((_, boxIndex) => {
                        const logoIndex = boxLogos[boxIndex] ?? 0;
                        const logo = logos[logoIndex];
                        if (!logo) return null;

                        return (
                            <div
                                key={`box-${boxIndex}`}
                                className="aspect-square bg-white border border-neutral-200/80 rounded-[2rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] relative overflow-hidden group cursor-default"
                            >
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.div
                                        key={logoIndex}
                                        className="absolute inset-0"
                                        initial={{ y: "100%" }}
                                        animate={{ y: 0 }}
                                        exit={{ y: "-100%" }}
                                        transition={{
                                            duration: SLIDE_S,
                                            ease: [0.4, 0, 0.2, 1],
                                        }}
                                    >
                                        <Image
                                            src={logo.src}
                                            alt="Brand logo"
                                            fill
                                            sizes="(max-width: 768px) 33vw, 25vw"
                                            className="object-contain pointer-events-none"
                                            style={{ padding: logo.padding, filter: "grayscale(1) brightness(0) opacity(0.6)" }}
                                            unoptimized={logo.src.endsWith(".svg")}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
