"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Match } from "../types/match";
import MatchCard from "./MatchCard";
import { Grid, Calendar, ChevronDown, LayoutList } from "lucide-react";
import { downloadMatchesIcsFile } from "../utils/calendarUtils";

interface AllMatchProps {
  allMatchesResolved: Match[];
  groupedMatches: { dateStr: string; matches: Match[] }[];
  matches: Match[];
  viewMode: "table" | "grid";
  setViewMode: (mode: "table" | "grid") => void;
}

export default function AllMatch({
  allMatchesResolved,
  groupedMatches,
  matches,
  viewMode,
  setViewMode,
}: AllMatchProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanHover(window.matchMedia("(hover: hover)").matches);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Flatten groupedMatches to reuse chronological date sorting but render in a single list
  const allMatchesSortedByDate = useMemo(() => {
    return groupedMatches.flatMap((group) => group.matches);
  }, [groupedMatches]);

  // Precompute row span and show date flag info for the table view
  const tableRowConfig = useMemo(() => {
    const configs: { [matchId: string]: { showDate: boolean; rowSpan: number } } = {};
    let lastDate = "";

    allMatchesSortedByDate.forEach((match, index) => {
      const currentDate = match.local_date.split(" ")[0];
      if (currentDate !== lastDate) {
        lastDate = currentDate;
        // Count how many matches share this date
        let count = 0;
        for (let i = index; i < allMatchesSortedByDate.length; i++) {
          if (allMatchesSortedByDate[i].local_date.split(" ")[0] === currentDate) {
            count++;
          } else {
            break;
          }
        }
        configs[match.match_id] = { showDate: true, rowSpan: count };
      } else {
        configs[match.match_id] = { showDate: false, rowSpan: 0 };
      }
    });

    return configs;
  }, [allMatchesSortedByDate]);

  // Format date display (e.g. "12/06/2026" -> "Ngày 12/06")
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [day, month] = dateStr.split("/");
    return `Ngày ${day}/${month}`;
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-2">
        <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary">
          <Grid size={16} /> Tất Cả Trận Đấu ({allMatchesResolved.length} trận)
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200/50 dark:border-white/10 select-none">
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "table"
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground/60 hover:text-foreground hover:bg-slate-200/40 dark:hover:bg-white/5"
              }`}
              title="Giao diện bảng"
            >
              <LayoutList size={13} />
              <span className="hidden sm:inline">Bảng</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground/60 hover:text-foreground hover:bg-slate-200/40 dark:hover:bg-white/5"
              }`}
              title="Giao diện lưới"
            >
              <Grid size={13} />
              <span className="hidden sm:inline">Lưới</span>
            </button>
          </div>

          {/* Bulk Calendar Download Dropdown */}
          <div className="relative group" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-foreground/80 hover:text-foreground font-black text-xs transition-all duration-300 cursor-pointer select-none"
            >
              <Calendar size={13} className="text-secondary" />
              <span>Tải lịch thi đấu (.ics)</span>
              <ChevronDown
                size={12}
                className={`opacity-60 transition-transform ${
                  isDropdownOpen ? "rotate-180" : canHover ? "group-hover:rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            <div
              className={`absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-48 rounded-xl border border-card-border bg-card-bg/95 backdrop-blur-md shadow-2xl py-1.5 z-30 transition-all duration-300 ${
                isDropdownOpen
                  ? "opacity-100 visible translate-y-0"
                  : `opacity-0 invisible translate-y-1 ${
                      canHover ? "group-hover:opacity-100 group-hover:visible group-hover:translate-y-0" : ""
                    }`
              }`}
            >
              <button
                onClick={() => {
                  downloadMatchesIcsFile(matches, "all");
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                📅 <span className="ml-2">Tất cả trận đấu</span>
              </button>
              <button
                onClick={() => {
                  downloadMatchesIcsFile(matches, "group");
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                🏆 <span className="ml-2">Vòng bảng</span>
              </button>
              <button
                onClick={() => {
                  downloadMatchesIcsFile(matches, "knockout");
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                🔥 <span className="ml-2"></span>Vòng knockout
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewMode === "table" ? (
        allMatchesSortedByDate.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-card-bg shadow-sm scrollbar-thin animate-fade-in">
              <table className="w-full border-collapse text-left text-sm text-foreground">
                <thead className="bg-slate-50 dark:bg-white/[0.02] text-xs font-black text-foreground/50 uppercase tracking-wider border-b border-slate-200 dark:border-white/5 select-none">
                  <tr>
                    <th className="px-4 py-3 w-[60px]">ID</th>
                    <th className="px-4 py-3 w-[100px] text-center">Ngày</th>
                    <th className="px-4 py-3 w-[80px]">Giờ</th>
                    <th className="px-4 py-3 hidden md:table-cell w-[180px]">Vòng đấu</th>
                    <th className="px-4 py-3 text-right">Đội 1</th>
                    <th className="px-2 py-3 text-center w-[90px]">Tỉ số</th>
                    <th className="px-4 py-3 text-left">Đội 2</th>
                    <th className="px-4 py-3 text-right w-[100px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                  {allMatchesSortedByDate.map((match) => {
                    const config = tableRowConfig[match.match_id] || { showDate: true, rowSpan: 1 };
                    return (
                      <MatchCard
                        key={match.match_id}
                        match={match}
                        variant="row"
                        showDate={config.showDate}
                        dateRowSpan={config.rowSpan}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Row View (Grouped by Date for compactness) */}
            <div className="block md:hidden space-y-5 animate-fade-in">
              {groupedMatches.map((group) => (
                <div key={group.dateStr} className="space-y-2">
                  {/* Section Date Header */}
                  <div className="flex items-center justify-between text-xs font-black text-primary border-b border-slate-200 dark:border-white/5 pb-1 select-none">
                    <span className="bg-primary/10 border border-primary/20 text-primary dark:text-rose-400 px-2.5 py-0.5 rounded-lg font-bold">
                      {formatDateDisplay(group.dateStr)}
                    </span>
                    <span className="text-[10px] text-foreground/40 font-bold uppercase">
                      {group.matches.length} trận
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.matches.map((match) => (
                      <MatchCard key={match.match_id} match={match} variant="mobile-row" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 text-sm text-foreground/50">
            Không tìm thấy trận đấu nào phù hợp.
          </div>
        )
      ) : groupedMatches.length > 0 ? (
        <div className="space-y-8">
          {groupedMatches.map((group) => (
            <div key={group.dateStr} className="space-y-3 animate-fade-in">
              {/* Section Date Header */}
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-primary border-b border-slate-200 dark:border-white/5 pb-1 select-none">
                <span className="bg-primary/10 border border-primary/20 text-primary dark:text-rose-400 px-2.5 py-0.5 rounded-lg font-bold">
                  {formatDateDisplay(group.dateStr)}
                </span>
                <span className="text-[11px] text-foreground/40 font-bold uppercase">
                  ({group.matches.length} trận)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.matches.map((match) => (
                  <MatchCard key={match.match_id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 text-sm text-foreground/50">
          Không tìm thấy trận đấu nào phù hợp.
        </div>
      )}
    </div>
  );
}
