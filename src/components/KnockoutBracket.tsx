"use client";

import React, { useState, useMemo, useRef } from "react";
import { Match } from "../types/match";
import MatchCard from "./MatchCard";
import MiniCard from "./MiniCard";
import { GitCommit, Grid, TreeDeciduous, Trophy, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { getMatchOrFallback, resolveTeam } from "../utils/matchUtils";

interface KnockoutBracketProps {
  matches: Match[];
}

export default function KnockoutBracket({ matches }: KnockoutBracketProps) {
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [activeRound, setActiveRound] = useState<string>("all");
  const [scale, setScale] = useState<number>(1.0);

  // Drag Scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollRef.current.scrollLeft,
      scrollTop: scrollRef.current.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
    scrollRef.current.scrollTop = dragStart.current.scrollTop - dy;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const knockoutMatchesResolved = useMemo(() => {
    const tempMap = new Map<string, Match>();
    matches.forEach((m) => tempMap.set(m.match_id, m));

    return matches
      .filter((m) => m.phase === "knockout")
      .map((m) => {
        const resolvedHome = resolveTeam(m.home_team_name, tempMap);
        const resolvedAway = resolveTeam(m.away_team_name, tempMap);
        return {
          ...m,
          home_team_name: resolvedHome.name || m.home_team_name,
          home_team_iso2: resolvedHome.iso2 || m.home_team_iso2,
          away_team_name: resolvedAway.name || m.away_team_name,
          away_team_iso2: resolvedAway.iso2 || m.away_team_iso2,
        };
      });
  }, [matches]);

  const matchesMap = useMemo(() => {
    const map = new Map<string, Match>();
    knockoutMatchesResolved.forEach((m) => map.set(m.match_id, m));
    return map;
  }, [knockoutMatchesResolved]);

  const groupedByRound = useMemo(() => {
    const groups: { [key: string]: { label: string; matches: Match[] } } = {
      round_32: { label: "Vòng 32 đội (Round of 32)", matches: [] },
      round_16: { label: "Vòng 16 đội (Round of 16)", matches: [] },
      quarterfinals: { label: "Tứ kết (Quarterfinals)", matches: [] },
      semifinals: { label: "Bán kết (Semifinals)", matches: [] },
      finals: { label: "Chung kết & Tranh hạng ba", matches: [] },
    };

    knockoutMatchesResolved.forEach((m) => {
      if (m.stage_key === "round32" || m.stage_key === "round_32") groups.round_32.matches.push(m);
      else if (m.stage_key === "round16" || m.stage_key === "round_16") groups.round_16.matches.push(m);
      else if (m.stage_key === "quarterfinal" || m.stage_key === "quarterfinals") groups.quarterfinals.matches.push(m);
      else if (m.stage_key === "semifinal" || m.stage_key === "semifinals") groups.semifinals.matches.push(m);
      else if (m.stage_key === "final" || m.stage_key === "third_place") groups.finals.matches.push(m);
    });

    return groups;
  }, [knockoutMatchesResolved]);

  // Symmetrical split bracket definition (Splits top half to Left and bottom half to Right)
  const bracketData = useMemo(() => {
    // --- LEFT HALF (Match 101 path) ---
    const leftR32 = [74, 77, 73, 75, 83, 84, 81, 82].map((i) =>
      getMatchOrFallback(matchesMap, i, "round32", "Vòng 32 Đội", `Thắng trận ${i - 72}`, `Thắng trận ${i - 56}`),
    );

    const leftR16 = [89, 90, 93, 94].map((i) =>
      getMatchOrFallback(
        matchesMap,
        i,
        "round16",
        "Vòng 16 Đội",
        `Thắng trận ${73 + (i - 89) * 2}`,
        `Thắng trận ${74 + (i - 89) * 2}`,
      ),
    );

    const leftQf = [97, 98].map((i) =>
      getMatchOrFallback(
        matchesMap,
        i,
        "quarterfinal",
        "Tứ Kết",
        `Thắng trận ${89 + (i - 97) * 2}`,
        `Thắng trận ${90 + (i - 97) * 2}`,
      ),
    );

    const leftSf = [getMatchOrFallback(matchesMap, 101, "semifinal", "Bán Kết", "Thắng trận 97", "Thắng trận 98")];

    // --- RIGHT HALF (Match 102 path) ---
    const rightR32 = [76, 78, 79, 80, 86, 88, 85, 87].map((i) =>
      getMatchOrFallback(matchesMap, i, "round32", "Vòng 32 Đội", `Thắng trận ${i - 72}`, `Thắng trận ${i - 56}`),
    );

    const rightR16 = [91, 92, 95, 96].map((i) =>
      getMatchOrFallback(
        matchesMap,
        i,
        "round16",
        "Vòng 16 Đội",
        `Thắng trận ${73 + (i - 89) * 2}`,
        `Thắng trận ${74 + (i - 89) * 2}`,
      ),
    );

    const rightQf = [99, 100].map((i) =>
      getMatchOrFallback(
        matchesMap,
        i,
        "quarterfinal",
        "Tứ Kết",
        `Thắng trận ${89 + (i - 97) * 2}`,
        `Thắng trận ${90 + (i - 97) * 2}`,
      ),
    );

    const rightSf = [getMatchOrFallback(matchesMap, 102, "semifinal", "Bán Kết", "Thắng trận 99", "Thắng trận 100")];

    // --- CENTER FINALS ---
    const finalMatch = getMatchOrFallback(matchesMap, 104, "final", "Chung Kết", "Thắng trận 101", "Thắng trận 102");
    const thirdPlaceMatch = getMatchOrFallback(
      matchesMap,
      103,
      "third_place",
      "Tranh Hạng Ba",
      "Thua trận 101",
      "Thua trận 102",
    );

    return {
      left: { r32: leftR32, r16: leftR16, qf: leftQf, sf: leftSf },
      right: { r32: rightR32, r16: rightR16, qf: rightQf, sf: rightSf },
      center: { final: finalMatch, thirdPlace: thirdPlaceMatch },
    };
  }, [matchesMap]);

  // Zoom handlers
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.1, 1.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.1, 0.5));
  const handleZoomReset = () => setScale(1.0);

  return (
    <div className="space-y-6">
      {/* View Mode & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("tree")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              viewMode === "tree"
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-102"
                : "text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            <TreeDeciduous size={14} /> Sơ đồ nhánh
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              viewMode === "list"
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-102"
                : "text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            <Grid size={14} /> Danh sách vòng đấu
          </button>
        </div>

        {viewMode === "list" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveRound("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                activeRound === "all"
                  ? "bg-slate-250 dark:bg-white/10 text-foreground border border-slate-300 dark:border-white/10"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              Tất cả vòng
            </button>
            {Object.entries(groupedByRound).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setActiveRound(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                  activeRound === key
                    ? "bg-slate-250 dark:bg-white/10 text-foreground border border-slate-300 dark:border-white/10"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                {value.label.split(" (")[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* RENDER VIEW */}
      {viewMode === "list" ? (
        /* LIST ROUND VIEW */
        <div className="space-y-8 animate-slide-up">
          {Object.entries(groupedByRound).map(([key, value]) => {
            if (activeRound !== "all" && activeRound !== key) return null;
            return (
              <div key={key} className="space-y-4">
                <h3 className="text-sm sm:text-md font-extrabold text-secondary flex items-center gap-2 pb-1.5 border-b border-white/5">
                  <GitCommit size={16} /> {value.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {value.matches.map((match) => (
                    <MatchCard key={match.match_id} match={match} showDateHeader={true} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TREE BRACKET VIEW (Deterministic mathematical aligned double-sided layout) */
        <div className="relative w-full overflow-hidden border border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-black/30 p-2">
          {/* Zoom Control Panel */}
          <div className="absolute bottom-1 right-1 z-25 flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-lg p-1 shadow-lg transition-all duration-300 hover:scale-102">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              title="Zoom Out"
              className="p-1 rounded text-foreground/75 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[9px] font-black min-w-[28px] text-center select-none text-foreground/70">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 1.5}
              title="Zoom In"
              className="p-1 rounded text-foreground/75 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 cursor-pointer"
            >
              <ZoomIn size={13} />
            </button>
            <div className="w-[1px] h-3 bg-slate-250 dark:bg-white/10 mx-0.5" />
            <button
              onClick={handleZoomReset}
              title="Reset Zoom"
              className="p-1 rounded text-foreground/75 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Interactive Scroll Window */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`w-full overflow-auto scrollbar-thin select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            style={{ height: `${480 * scale + 36}px` }}
          >
            {/* Scaled Bracket Content */}
            <div
              style={{
                width: "1100px",
                height: "480px",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className="flex justify-between h-[480px] gap-5"
            >
              {/* === LEFT SIDE BRACKET (Columns 1-4) === */}

              {/* 1. Left Round of 32 */}
              <div className="flex flex-col w-26 h-full justify-between">
                <div className="flex flex-col h-[480px] justify-between">
                  {Array.from({ length: 4 }).map((_, pairIndex) => {
                    const m1 = bracketData.left.r32[pairIndex * 2];
                    const m2 = bracketData.left.r32[pairIndex * 2 + 1];
                    return (
                      <div
                        key={pairIndex}
                        style={{ height: "120px" }}
                        className="relative flex flex-col justify-between py-[15px]"
                      >
                        <div className="h-[40px] relative">
                          <MiniCard match={m1} />
                        </div>
                        <div className="h-[40px] relative">
                          <MiniCard match={m2} />
                        </div>
                        {/* Connector line to Left R16 */}
                        <div className="absolute top-[35px] bottom-[35px] right-[-10px] w-[10px] border-y border-r border-slate-300 dark:border-white/15 rounded-r pointer-events-none transition-all duration-300">
                          <div className="absolute top-1/2 right-[-10px] w-[10px] h-[1px] bg-slate-300 dark:bg-white/15" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Left Round of 16 */}
              <div className="flex flex-col w-26 h-full justify-between">
                <div className="flex flex-col h-[480px] justify-between">
                  {Array.from({ length: 2 }).map((_, pairIndex) => {
                    const m1 = bracketData.left.r16[pairIndex * 2];
                    const m2 = bracketData.left.r16[pairIndex * 2 + 1];
                    return (
                      <div
                        key={pairIndex}
                        style={{ height: "240px" }}
                        className="relative flex flex-col justify-between py-[40px]"
                      >
                        <div className="h-[40px] relative">
                          <MiniCard match={m1} />
                        </div>
                        <div className="h-[40px] relative">
                          <MiniCard match={m2} />
                        </div>
                        {/* Connector line to Left QF */}
                        <div className="absolute top-[60px] bottom-[60px] right-[-10px] w-[10px] border-y border-r border-slate-300 dark:border-white/15 rounded-r pointer-events-none transition-all duration-300">
                          <div className="absolute top-1/2 right-[-10px] w-[10px] h-[1px] bg-slate-300 dark:bg-white/15" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Left Quarterfinals */}
              <div className="flex flex-col w-26 h-full justify-between">
                <div className="flex flex-col h-[480px] justify-between">
                  <div style={{ height: "480px" }} className="relative flex flex-col justify-between py-[100px]">
                    <div className="h-[40px] relative">
                      <MiniCard match={bracketData.left.qf[0]} />
                    </div>
                    <div className="h-[40px] relative">
                      <MiniCard match={bracketData.left.qf[1]} />
                    </div>
                    {/* Connector line to Left SF */}
                    <div className="absolute top-[120px] bottom-[120px] right-[-10px] w-[10px] border-y border-r border-slate-300 dark:border-white/15 rounded-r pointer-events-none transition-all duration-300">
                      <div className="absolute top-1/2 right-[-10px] w-[10px] h-[1px] bg-slate-300 dark:bg-white/15" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Left Semifinals */}
              <div className="flex flex-col w-26 h-full justify-between">
                <div className="flex flex-col h-[480px] justify-center relative">
                  <div className="h-[40px] relative">
                    <MiniCard match={bracketData.left.sf[0]} />
                    {/* Connector straight to Center Final */}
                    <div className="absolute top-1/2 right-[-20px] w-[20px] h-[1px] bg-slate-300 dark:bg-white/15 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* === CENTER FINALS & THIRD PLACE (Column 5) === */}

              <div className="flex flex-col w-32 h-[480px] relative">
                {/* Final Match (Vertically centered at y = 240px; top starts at 204px) */}
                <div className="absolute top-[190px] left-0 right-0 h-[80px] space-y-1 border border-amber-500/30 rounded-lg p-1 bg-amber-500/5 shadow shadow-amber-500/5 animate-pulse-gold">
                  <div className="text-[8px] font-black text-amber-500 text-center uppercase tracking-wider flex items-center justify-center gap-0.5">
                    🏆 <Trophy size={9} className="inline animate-bounce" /> Chung Kết
                  </div>
                  <div className="h-[40px]">
                    <MiniCard match={bracketData.center.final} />
                  </div>
                </div>

                {/* Third Place Match (Placed below, starting at y = 276px) */}
                <div className="absolute top-[286px] left-0 right-0 h-[64px] space-y-1 border border-slate-300 dark:border-white/10 rounded-lg p-1 bg-slate-500/5 shadow-sm">
                  <div className="text-[8px] font-extrabold text-foreground/60 text-center uppercase tracking-wider">
                    🥉 Tranh Hạng Ba
                  </div>
                  <div className="h-[40px]">
                    <MiniCard match={bracketData.center.thirdPlace} />
                  </div>
                </div>
              </div>

              {/* === RIGHT SIDE BRACKET (Columns 6-9) === */}

              {/* 6. Right Semifinals */}
              <div className="flex flex-col w-26 h-full justify-between">
                <div className="flex flex-col h-[480px] justify-center relative">
                  <div className="h-[40px] relative">
                    <MiniCard match={bracketData.right.sf[0]} />
                    {/* Connector straight to Center Final */}
                    <div className="absolute top-1/2 left-[-20px] w-[20px] h-[1px] bg-slate-300 dark:bg-white/15 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 7. Right Quarterfinals */}
              <div className="flex flex-col w-26 h-full justify-between">
                <div className="flex flex-col h-[480px] justify-between">
                  <div style={{ height: "480px" }} className="relative flex flex-col justify-between py-[100px]">
                    <div className="h-[40px] relative">
                      <MiniCard match={bracketData.right.qf[0]} />
                    </div>
                    <div className="h-[40px] relative">
                      <MiniCard match={bracketData.right.qf[1]} />
                    </div>
                    {/* Connector line to Right SF */}
                    <div className="absolute top-[120px] bottom-[120px] left-[-10px] w-[10px] border-y border-l border-slate-300 dark:border-white/15 rounded-l pointer-events-none transition-all duration-300">
                      <div className="absolute top-1/2 left-[-10px] w-[10px] h-[1px] bg-slate-300 dark:bg-white/15" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 8. Right Round of 16 */}
              <div className="flex flex-col w-26 h-full justify-between">
                <div className="flex flex-col h-[480px] justify-between">
                  {Array.from({ length: 2 }).map((_, pairIndex) => {
                    const m1 = bracketData.right.r16[pairIndex * 2];
                    const m2 = bracketData.right.r16[pairIndex * 2 + 1];
                    return (
                      <div
                        key={pairIndex}
                        style={{ height: "240px" }}
                        className="relative flex flex-col justify-between py-[40px]"
                      >
                        <div className="h-[40px] relative">
                          <MiniCard match={m1} />
                        </div>
                        <div className="h-[40px] relative">
                          <MiniCard match={m2} />
                        </div>
                        {/* Connector line to Right QF */}
                        <div className="absolute top-[60px] bottom-[60px] left-[-10px] w-[10px] border-y border-l border-slate-300 dark:border-white/15 rounded-l pointer-events-none transition-all duration-300">
                          <div className="absolute top-1/2 left-[-10px] w-[10px] h-[1px] bg-slate-300 dark:bg-white/15" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 9. Right Round of 32 */}
              <div className="flex flex-col w-26 h-full justify-between">
                <div className="flex flex-col h-[480px] justify-between">
                  {Array.from({ length: 4 }).map((_, pairIndex) => {
                    const m1 = bracketData.right.r32[pairIndex * 2];
                    const m2 = bracketData.right.r32[pairIndex * 2 + 1];
                    return (
                      <div
                        key={pairIndex}
                        style={{ height: "120px" }}
                        className="relative flex flex-col justify-between py-[15px]"
                      >
                        <div className="h-[40px] relative">
                          <MiniCard match={m1} />
                        </div>
                        <div className="h-[40px] relative">
                          <MiniCard match={m2} />
                        </div>
                        {/* Connector line to Right R16 */}
                        <div className="absolute top-[35px] bottom-[35px] left-[-10px] w-[10px] border-y border-l border-slate-300 dark:border-white/15 rounded-l pointer-events-none transition-all duration-300">
                          <div className="absolute top-1/2 left-[-10px] w-[10px] h-[1px] bg-slate-300 dark:bg-white/15" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
