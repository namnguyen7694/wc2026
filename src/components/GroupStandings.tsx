"use client";

import React, { useState, useMemo } from "react";
import { Match } from "../types/match";
import MatchCard from "./MatchCard";

import { useMatchStore } from "../hooks/useMatchStore";

interface GroupStandingsProps {
  matches: Match[];
}

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export default function GroupStandings({ matches }: GroupStandingsProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>("A");
  const getGroupStandings = useMatchStore((state) => state.getGroupStandings);

  // Get all group-stage matches
  const groupMatches = useMemo(() => {
    return matches.filter((m) => m.phase === "group");
  }, [matches]);

  // Compute standings for the selected group dynamically from the store
  const standings = useMemo(() => {
    return getGroupStandings(selectedGroup);
  }, [getGroupStandings, selectedGroup]);

  // Selected group's fixtures
  const selectedGroupFixtures = useMemo(() => {
    return groupMatches.filter((m) => m.group === selectedGroup);
  }, [groupMatches, selectedGroup]);

  const getFlagUrl = (iso2: string) => {
    if (!iso2) return null;
    const code = iso2.toLowerCase();
    if (code === "eng") return "https://flagcdn.com/w20/gb-eng.png";
    if (code === "sco") return "https://flagcdn.com/w20/gb-sct.png";
    return `https://flagcdn.com/w20/${code}.png`;
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Horizontal Group Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
              selectedGroup === g
                ? "bg-primary border-primary text-white scale-100"
                : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-foreground"
            }`}
          >
            Bảng {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Standings Table */}
        <div className="lg:col-span-2 glass-panel border border-card-border rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-hidden">
          <div>
            <h3 className="text-md font-extrabold text-secondary mb-4 flex items-center gap-2">
              🏆 Bảng Xếp Hạng Bảng {selectedGroup}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-foreground/50 font-semibold">
                    <th className="py-2 px-1 text-center w-8">#</th>
                    <th className="py-2 px-2">Đội tuyển</th>
                    <th className="py-2 px-2 text-center w-10">T</th>
                    <th className="py-2 px-2 text-center w-8">Th</th>
                    <th className="py-2 px-2 text-center w-8">H</th>
                    <th className="py-2 px-2 text-center w-8">B</th>
                    <th className="py-2 px-2 text-center w-12 hidden sm:table-cell">BT/BB</th>
                    <th className="py-2 px-2 text-center w-10">HS</th>
                    <th className="py-2 px-2 text-center font-bold w-12 text-secondary">Đ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                  {standings.map((team, index) => {
                    const isTopTwo = index < 2 && team.played > 0;
                    return (
                      <tr
                        key={team.teamName}
                        className={`hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors ${
                          isTopTwo ? "bg-emerald-500/5" : ""
                        }`}
                      >
                        <td className="py-3 px-1 text-center font-bold">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] ${
                              index === 0
                                ? "bg-amber-400 text-slate-900"
                                : index === 1
                                  ? "bg-slate-300 text-slate-900"
                                  : "bg-slate-100 dark:bg-white/10 text-foreground/70"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3 px-2 max-w-[150px] sm:max-w-none">
                          <div className="flex items-center gap-2 font-bold min-w-0">
                            {getFlagUrl(team.teamIso2) && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={getFlagUrl(team.teamIso2)!}
                                alt={team.teamName}
                                className="w-5 h-3.5 object-cover rounded shadow-sm border border-slate-200 dark:border-white/10"
                              />
                            )}
                            <span className="truncate pr-1 min-w-0">{team.teamName}</span>
                            {isTopTwo && (
                              <span className="text-[9px] text-emerald-400 font-bold hidden sm:inline px-1 py-0.2 bg-emerald-500/10 border border-emerald-500/20 rounded">
                                Đi tiếp
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">{team.played}</td>
                        <td className="py-3 px-2 text-center text-emerald-400">{team.won}</td>
                        <td className="py-3 px-2 text-center text-foreground/60">{team.drawn}</td>
                        <td className="py-3 px-2 text-center text-rose-400">{team.lost}</td>
                        <td className="py-3 px-2 text-center text-foreground/60 hidden sm:table-cell">
                          {team.goalsFor}-{team.goalsAgainst}
                        </td>
                        <td
                          className={`py-3 px-2 text-center font-semibold ${
                            team.goalDifference > 0
                              ? "text-emerald-400"
                              : team.goalDifference < 0
                                ? "text-rose-400"
                                : ""
                          }`}
                        >
                          {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                        </td>
                        <td className="py-3 px-2 text-center font-extrabold text-secondary text-sm">{team.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/5 text-[10px] text-foreground/40 flex justify-between">
            <span>* Cách xếp hạng: Điểm &rarr; Hiệu số (HS) &rarr; Bàn thắng (BT)</span>
            <span className="text-emerald-400 font-medium">Xanh: Đủ điều kiện đi tiếp</span>
          </div>
        </div>

        {/* Selected Group Fixtures */}
        <div className="space-y-4">
          <h3 className="text-md font-extrabold text-secondary flex items-center gap-2">📅 Trận Đấu</h3>
          <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
            {selectedGroupFixtures.map((match) => (
              <div key={match.match_id} className="h-[125px]">
                <MatchCard match={match} showDateHeader={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
