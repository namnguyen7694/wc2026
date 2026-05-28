"use client";

import React, { useState, useMemo } from "react";
import { Match } from "../types/match";
import MatchCard from "./MatchCard";
import { GitCommit, Grid, TreeDeciduous, Trophy } from "lucide-react";
import { getMatchOrFallback, resolveTeam } from "../utils/matchUtils";
import { useMatchStore } from "../hooks/useMatchStore";

interface KnockoutBracketProps {
  matches: Match[];
}

export default function KnockoutBracket({ matches }: KnockoutBracketProps) {
  const [viewMode, setViewMode] = useState<"tree" | "list">("list");
  const [activeRound, setActiveRound] = useState<string>("all");
  const getGroupStandings = useMatchStore((state) => state.getGroupStandings);

  // Filter and resolve knockout matches (Vercel optimization: batch-resolving)
  const knockoutMatchesResolved = useMemo(() => {
    // 1. Create a rapid matches map for resolution lookups of WXX/LXX
    const tempMap = new Map<string, Match>();
    matches.forEach((m) => tempMap.set(m.match_id, m));

    return matches
      .filter((m) => m.phase === "knockout")
      .map((m) => {
        const resolvedHome = resolveTeam(m.home_team_name, tempMap, getGroupStandings);
        const resolvedAway = resolveTeam(m.away_team_name, tempMap, getGroupStandings);
        return {
          ...m,
          home_team_name: resolvedHome.name || m.home_team_name,
          home_team_iso2: resolvedHome.iso2 || m.home_team_iso2,
          away_team_name: resolvedAway.name || m.away_team_name,
          away_team_iso2: resolvedAway.iso2 || m.away_team_iso2,
          home_placeholder: m.home_team_name !== resolvedHome.name ? m.home_team_name : undefined,
          away_placeholder: m.away_team_name !== resolvedAway.name ? m.away_team_name : undefined,
        };
      });
  }, [matches, getGroupStandings]);

  // Index matches by match_id for rapid O(1) lookups
  const matchesMap = useMemo(() => {
    const map = new Map<string, Match>();
    knockoutMatchesResolved.forEach((m) => map.set(m.match_id, m));
    return map;
  }, [knockoutMatchesResolved]);

  // Group by round for list view (retains chronological order)
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

  // Map of specific matches in tree bracket (mathematically ordered to align branch lines)
  const rounds = useMemo(() => {
    // Round of 32 ordered so that match pairs feed exactly into their corresponding Round of 16 match
    const r32Order = [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87];
    const r32 = r32Order.map((i) =>
      getMatchOrFallback(matchesMap, i, "round32", "Vòng 32 Đội", `Thắng trận ${i - 72}`, `Thắng trận ${i - 56}`),
    );

    // Round of 16 ordered to pair matches feeding into Quarterfinals:
    const r16Order = [89, 90, 93, 94, 91, 92, 95, 96];
    const r16 = r16Order.map((i) =>
      getMatchOrFallback(
        matchesMap,
        i,
        "round16",
        "Vòng 16 Đội",
        `Thắng trận ${73 + (i - 89) * 2}`,
        `Thắng trận ${74 + (i - 89) * 2}`,
      ),
    );

    // Quarterfinals ordered to pair matches feeding into Semifinals:
    const qfOrder = [97, 98, 99, 100];
    const qf = qfOrder.map((i) =>
      getMatchOrFallback(
        matchesMap,
        i,
        "quarterfinal",
        "Tứ Kết",
        `Thắng trận ${89 + (i - 97) * 2}`,
        `Thắng trận ${90 + (i - 97) * 2}`,
      ),
    );

    // Semifinals: Match 101 & Match 102 -> feed into Finals (Match 104)
    const sfOrder = [101, 102];
    const sf = sfOrder.map((i) =>
      getMatchOrFallback(matchesMap, i, "semifinal", "Bán Kết", `Thắng trận ${97 + (i - 101) * 2}`, `Thắng trận ${98 + (i - 101) * 2}`),
    );

    // Finals: Match 103 (Third place) and Match 104 (Final)
    const fnOrder = [103, 104];
    const fn = fnOrder.map((i) =>
      getMatchOrFallback(
        matchesMap,
        i,
        i === 103 ? "third_place" : "final",
        i === 103 ? "Tranh Hạng Ba" : "Chung Kết",
        i === 103 ? `Thua trận 101` : `Thắng trận 101`,
        i === 103 ? `Thua trận 102` : `Thắng trận 102`,
      ),
    );

    return {
      round32: { label: "Vòng 32 Đội", matches: r32 },
      round16: { label: "Vòng 16 Đội", matches: r16 },
      quarterfinal: { label: "Tứ Kết", matches: qf },
      semifinal: { label: "Bán Kết", matches: sf },
      finals: { label: "Chung Kết & Tranh Hạng Ba", matches: fn },
    };
  }, [matchesMap]);

  return (
    <div className="space-y-6">
      {/* View Mode & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setViewMode("tree")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              viewMode === "tree"
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-102"
                : "text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            <TreeDeciduous size={14} /> Cấu trúc cây (Sơ đồ nhánh)
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
                    <div key={match.match_id} className="h-[125px]">
                      <MatchCard
                        match={match}
                        showDateHeader={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TREE BRACKET VIEW (Strict Mathematical Layout to ensure perfect horizontal alignment) */
        <div className="w-full overflow-x-auto pb-6 select-none scrollbar-thin animate-slide-up">
          <div className="flex gap-12 min-w-[1400px] justify-between p-4 h-[2180px]">
            {/* 1. Round of 32 (Column 1) */}
            <div className="flex flex-col w-64">
              <div className="text-center font-extrabold text-xs text-secondary border-b border-white/10 pb-2 mb-4 h-[24px]">
                VÒNG 32 ĐỘI (1/16)
              </div>
              <div className="flex flex-col h-[2088px] space-y-6">
                {Array.from({ length: 8 }).map((_, pairIndex) => {
                  const m1 = rounds.round32.matches[pairIndex * 2];
                  const m2 = rounds.round32.matches[pairIndex * 2 + 1];
                  return (
                    <div key={pairIndex} style={{ height: "240px" }} className="relative flex flex-col justify-between">
                      <div className="h-[110px] relative">
                        <MatchCard
                          match={m1}
                          showDateHeader
                        />
                      </div>
                      <div className="h-[110px] relative">
                        <MatchCard
                          match={m2}
                          showDateHeader
                        />
                      </div>
                      {/* Tree Bracket Connector Lines */}
                      <div className="absolute top-[55px] bottom-[55px] right-[-24px] w-[24px] border-y border-r border-slate-300 dark:border-white/15 rounded-r-lg pointer-events-none transition-all duration-300">
                        <div className="absolute top-1/2 right-[-24px] w-[24px] h-[1px] bg-slate-300 dark:bg-white/15" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Round of 16 (Column 2) */}
            <div className="flex flex-col w-64">
              <div className="text-center font-extrabold text-xs text-secondary border-b border-white/10 pb-2 mb-4 h-[24px]">
                VÒNG 16 ĐỘI (1/8)
              </div>
              <div className="flex flex-col h-[2088px] space-y-6">
                {Array.from({ length: 4 }).map((_, pairIndex) => {
                  const m1 = rounds.round16.matches[pairIndex * 2];
                  const m2 = rounds.round16.matches[pairIndex * 2 + 1];
                  return (
                    <div key={pairIndex} style={{ height: "504px" }} className="relative flex flex-col justify-between py-[65px]">
                      <div className="h-[110px] relative">
                        <MatchCard
                          match={m1}
                        />
                      </div>
                      <div className="h-[110px] relative">
                        <MatchCard
                          match={m2}
                        />
                      </div>
                      {/* Tree Bracket Connector Lines */}
                      <div className="absolute top-[120px] bottom-[120px] right-[-24px] w-[24px] border-y border-r border-slate-300 dark:border-white/15 rounded-r-lg pointer-events-none transition-all duration-300">
                        <div className="absolute top-1/2 right-[-24px] w-[24px] h-[1px] bg-slate-300 dark:bg-white/15" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Quarterfinals (Column 3) */}
            <div className="flex flex-col w-64">
              <div className="text-center font-extrabold text-xs text-secondary border-b border-white/10 pb-2 mb-4 h-[24px]">
                TỨ KẾT
              </div>
              <div className="flex flex-col h-[2088px] space-y-6">
                {Array.from({ length: 2 }).map((_, pairIndex) => {
                  const m1 = rounds.quarterfinal.matches[pairIndex * 2];
                  const m2 = rounds.quarterfinal.matches[pairIndex * 2 + 1];
                  return (
                    <div key={pairIndex} style={{ height: "1032px" }} className="relative flex flex-col justify-between py-[197px]">
                      <div className="h-[110px] relative">
                        <MatchCard
                          match={m1}
                        />
                      </div>
                      <div className="h-[110px] relative">
                        <MatchCard
                          match={m2}
                        />
                      </div>
                      {/* Tree Bracket Connector Lines */}
                      <div className="absolute top-[252px] bottom-[252px] right-[-24px] w-[24px] border-y border-r border-slate-300 dark:border-white/15 rounded-r-lg pointer-events-none transition-all duration-300">
                        <div className="absolute top-1/2 right-[-24px] w-[24px] h-[1px] bg-slate-300 dark:bg-white/15" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Semifinals (Column 4) */}
            <div className="flex flex-col w-64">
              <div className="text-center font-extrabold text-xs text-secondary border-b border-white/10 pb-2 mb-4 h-[24px]">
                BÁN KẾT
              </div>
              <div className="flex flex-col h-[2088px]">
                <div style={{ height: "2088px" }} className="relative flex flex-col justify-between py-[461px]">
                  <div className="h-[110px] relative">
                    <MatchCard
                      match={rounds.semifinal.matches[0]}
                    />
                  </div>
                  <div className="h-[110px] relative">
                    <MatchCard
                      match={rounds.semifinal.matches[1]}
                    />
                  </div>
                  {/* Tree Bracket Connector Lines */}
                  <div className="absolute top-[516px] bottom-[516px] right-[-24px] w-[24px] border-y border-r border-slate-300 dark:border-white/15 rounded-r-lg pointer-events-none transition-all duration-300">
                    <div className="absolute top-1/2 right-[-24px] w-[24px] h-[1px] bg-slate-300 dark:bg-white/15" />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Finals (Column 5) */}
            <div className="flex flex-col w-72">
              <div className="text-center font-extrabold text-xs text-secondary border-b border-white/10 pb-2 mb-4 h-[24px]">
                CHUNG KẾT & TRANH HẠNG BA
              </div>
              <div className="relative h-[2088px]">
                {/* Final */}
                {rounds.finals.matches
                  .filter((m) => m.stage_key === "final")
                  .map((match) => (
                    <div
                      key={match.match_id}
                      style={{ top: "1044px", transform: "translateY(-50%)" }}
                      className="absolute left-0 right-0 space-y-2 border-2 border-secondary/20 rounded-2xl p-2 bg-secondary/5 animate-pulse-gold"
                    >
                      <div className="text-[10px] font-black text-secondary text-center uppercase tracking-wider flex items-center justify-center gap-1">
                        🏆 <Trophy size={10} /> Trận Chung Kết
                      </div>
                      <div className="h-[110px]">
                        <MatchCard
                          match={match}
                        />
                      </div>
                    </div>
                  ))}

                {/* Third Place */}
                {rounds.finals.matches
                  .filter((m) => m.stage_key === "third_place")
                  .map((match) => (
                    <div
                      key={match.match_id}
                      style={{ top: "1280px" }}
                      className="absolute left-0 right-0 space-y-2 border border-white/10 rounded-2xl p-2 bg-white/5"
                    >
                      <div className="text-[10px] font-bold text-foreground/50 text-center uppercase tracking-wider">
                        🥉 Trận Tranh Hạng Ba
                      </div>
                      <div className="h-[110px]">
                        <MatchCard
                          match={match}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
