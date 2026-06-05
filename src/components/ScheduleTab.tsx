"use client";

import React, { useState } from "react";
import { Match } from "../types/match";
import { Calendar, Grid, Flame, Search } from "lucide-react";
import AllMatch from "./AllMatch";
import KnockoutBracket from "./KnockoutBracket";
import MatchCard from "./MatchCard";
import CalendarPicker from "./ui/CalendarPicker";

const SUB_TABS = [
  { id: "all", label: "Tất cả trận đấu", icon: Grid },
  { id: "date", label: "Lịch theo ngày", icon: Calendar },
  { id: "knockout", label: "Nhánh Knockout", icon: Flame },
] as const;

export type SubTabId = (typeof SUB_TABS)[number]["id"];

interface ScheduleTabProps {
  matches: Match[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  sortedDates: string[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredMatchesByDate: Match[];
  allMatchesResolved: Match[];
  groupedMatches: { dateStr: string; matches: Match[] }[];
  viewMode: "table" | "grid";
  setViewMode: (mode: "table" | "grid") => void;
}

export default function ScheduleTab({
  matches,
  selectedDate,
  setSelectedDate,
  sortedDates,
  searchQuery,
  setSearchQuery,
  filteredMatchesByDate,
  allMatchesResolved,
  groupedMatches,
  viewMode,
  setViewMode,
}: ScheduleTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>("all");

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="flex border-b border-slate-200 dark:border-white/5 pb-0.5">
        <div className="flex gap-6">
          {SUB_TABS.map((subTab) => {
            const Icon = subTab.icon;
            const isActive = activeSubTab === subTab.id;
            return (
              <button
                key={subTab.id}
                onClick={() => setActiveSubTab(subTab.id)}
                className={`relative pb-3 flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "text-primary dark:text-rose-400 font-extrabold"
                    : "text-foreground/50 hover:text-foreground"
                }`}
              >
                <Icon size={15} />
                <span>{subTab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary dark:bg-rose-400 rounded-full animate-fade-in" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Controls Bar (Calendar Picker & Search box on its own line) */}
      {activeSubTab !== "knockout" && (
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          {/* Calendar Picker (Only visible when date subtab is active) */}
          {activeSubTab === "date" && (
            <div className="w-full sm:w-auto flex-1 sm:flex-initial">
              <CalendarPicker selectedDate={selectedDate} onChange={setSelectedDate} availableDates={sortedDates} />
            </div>
          )}

          {/* Search box */}
          {activeSubTab === "all" && (
            <div className="relative w-full flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm quốc gia, SVĐ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-card-border bg-card-bg text-sm focus:outline-none focus:border-secondary transition-colors text-foreground"
              />
              <Search className="absolute left-3.5 top-3.5 text-foreground/45" size={16} />
            </div>
          )}
        </div>
      )}

      {/* Render Sub tab content */}
      <div className="mt-4">
        {activeSubTab === "date" && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary border-b border-slate-200 dark:border-white/5 pb-2">
              <Grid size={16} /> Danh sách trận ngày {selectedDate}
            </div>
            {filteredMatchesByDate.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMatchesByDate.map((match) => (
                  <MatchCard key={match.match_id} match={match} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 text-sm text-foreground/50">
                Không tìm thấy trận đấu nào phù hợp.
              </div>
            )}
          </div>
        )}

        {activeSubTab === "all" && (
          <AllMatch
            allMatchesResolved={allMatchesResolved}
            groupedMatches={groupedMatches}
            matches={matches}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}

        {activeSubTab === "knockout" && (
          <div className="animate-slide-up">
            <KnockoutBracket matches={matches} />
          </div>
        )}
      </div>
    </div>
  );
}
