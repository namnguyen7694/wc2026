"use client";

import { useState, useMemo, useEffect } from "react";
import { Match } from "../types/match";
import { usePersistentState } from "../hooks/usePersistentState";
import PremiumToggle from "./ui/PremiumToggle";
import MatchCard from "./MatchCard";
import GroupStandings from "./GroupStandings";
import KnockoutBracket from "./KnockoutBracket";
import CalendarPicker from "./ui/CalendarPicker";
import {
  Calendar,
  Trophy,
  Heart,
  Search,
  Grid,
  Flame,
  Star,
  Users,
  Sparkles,
  Activity,
  ChevronDown,
} from "lucide-react";
import { useMatchStore } from "../hooks/useMatchStore";
import HeroBanner from "./HeroBanner";
import FavoriteTeamsTab from "./FavoriteTeamsTab";
import { resolveTeam } from "../utils/matchUtils";
import { downloadMatchesIcsFile } from "../utils/calendarUtils";

const TABS = [
  { id: "date", label: "Lịch thi đấu theo ngày", icon: Calendar },
  { id: "all", label: "Tất cả trận đấu", icon: Grid },
  { id: "group", label: "Bảng đấu & Xếp hạng", icon: Trophy },
  { id: "knockout", label: "Nhánh đấu Knockout", icon: Flame },
  { id: "favorites", label: "Trận yêu thích", icon: Heart },
  { id: "favorite_teams", label: "Đội yêu thích", icon: Users },
] as const;

export default function ScheduleDashboard() {
  const [activeTab, setActiveTab] = useState<"date" | "all" | "group" | "knockout" | "favorites" | "favorite_teams">(
    "date",
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchMatches = useMatchStore((state) => state.fetchMatches);
  const matches = useMatchStore((state) => state.matches);
  const isLoadedMatches = useMatchStore((state) => state.isLoaded);
  const isSimulated = useMatchStore((state) => state.isSimulated);
  const toggleSimulation = useMatchStore((state) => state.toggleSimulation);
  const getGroupStandings = useMatchStore((state) => state.getGroupStandings);

  // Initialize Zustand global matches store on mount
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Load persistent favorites list (SSR hydration mismatch safe)
  const [favorites, setFavorites, isLoadedFavs] = usePersistentState<string[]>("wc2026_favorites_v1", []);

  const [myTeams, setMyTeams] = useState<string[]>([]);
  const [isLoadedMyTeams, setIsLoadedMyTeams] = useState(false);

  // Index matches by match_id for rapid O(1) lookups
  const matchesMap = useMemo(() => {
    const map = new Map<string, Match>();
    matches.forEach((m) => map.set(m.match_id, m));
    return map;
  }, [matches]);

  // Extract and sort unique dates from all matches (both group and knockout stage)
  const sortedDates = useMemo(() => {
    const allDates = matches.map((m) => m.local_date.split(" ")[0]);

    return Array.from(new Set(allDates)).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split("/").map(Number);
      const [dayB, monthB, yearB] = b.split("/").map(Number);
      return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
    });
  }, [matches]);

  // Initialise selected date to today or the closest match date when mounted
  useEffect(() => {
    if (sortedDates.length > 0 && !selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();

      let closestDate = sortedDates[0];
      let minDiff = Infinity;

      sortedDates.forEach((dateStr) => {
        const [day, month, year] = dateStr.split("/").map(Number);
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        const diff = Math.abs(date.getTime() - todayTime);

        if (diff < minDiff) {
          minDiff = diff;
          closestDate = dateStr;
        }
      });

      setSelectedDate(closestDate);
    }
  }, [sortedDates, selectedDate]);

  // Sync favorites when changed in child MatchCards via CustomEvent
  useEffect(() => {
    const handleUpdate = () => {
      if (typeof window !== "undefined") {
        try {
          const favs = JSON.parse(localStorage.getItem("wc2026_favorites_v1") || "[]");
          setFavorites(Array.isArray(favs) ? favs : []);
        } catch {}
      }
    };
    window.addEventListener("wc2026_favorites_changed", handleUpdate);
    return () => {
      window.removeEventListener("wc2026_favorites_changed", handleUpdate);
    };
  }, [setFavorites]);

  // Sync my favorite teams
  useEffect(() => {
    const handleUpdateMyTeams = () => {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("wc2026_my_teams");
          if (stored) {
            setMyTeams(JSON.parse(stored));
          } else {
            // Migration check
            const single = localStorage.getItem("wc2026_my_team");
            if (single) {
              const migrated = [single.toUpperCase()];
              localStorage.setItem("wc2026_my_teams", JSON.stringify(migrated));
              setMyTeams(migrated);
            } else {
              setMyTeams([]);
            }
          }
        } catch {
          setMyTeams([]);
        }
      }
      setIsLoadedMyTeams(true);
    };

    handleUpdateMyTeams();

    window.addEventListener("wc2026_my_teams_changed", handleUpdateMyTeams);
    window.addEventListener("wc2026_my_team_changed", handleUpdateMyTeams);
    return () => {
      window.removeEventListener("wc2026_my_teams_changed", handleUpdateMyTeams);
      window.removeEventListener("wc2026_my_team_changed", handleUpdateMyTeams);
    };
  }, []);

  // Quick toggle helper for favorite teams right from the dashboard
  const handleToggleFavoriteTeam = (code: string) => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("wc2026_my_teams");
        let list: string[] = stored ? JSON.parse(stored) : [];

        if (list.includes(code)) {
          list = list.filter((c) => c !== code);
        } else {
          list = [...list, code];
        }

        localStorage.setItem("wc2026_my_teams", JSON.stringify(list));

        // Sync compatibility key
        if (list.length > 0) {
          localStorage.setItem("wc2026_my_team", list[0]);
        } else {
          localStorage.removeItem("wc2026_my_team");
        }

        setMyTeams(list);
        window.dispatchEvent(new Event("wc2026_my_teams_changed"));
        window.dispatchEvent(new Event("wc2026_my_team_changed"));
      } catch (err) {
        console.error("Error toggling favorite team:", err);
      }
    }
  };

  // Dynamically extract all 48 unique teams participating in the World Cup from matches list
  const allTeams = useMemo(() => {
    const teamsMap = new Map<string, { name: string; iso2: string; group: string }>();
    matches.forEach((m) => {
      if (m.home_team_iso2 && m.home_team_name && !/^\d[A-L]$|^W\d+|^L\d+|^3[A-L]\//.test(m.home_team_iso2)) {
        const iso = m.home_team_iso2.toUpperCase();
        if (!teamsMap.has(iso)) {
          teamsMap.set(iso, {
            name: m.home_team_name,
            iso2: iso,
            group: m.group || "",
          });
        } else if (m.group && !teamsMap.get(iso)?.group) {
          teamsMap.get(iso)!.group = m.group;
        }
      }
      if (m.away_team_iso2 && m.away_team_name && !/^\d[A-L]$|^W\d+|^L\d+|^3[A-L]\//.test(m.away_team_iso2)) {
        const iso = m.away_team_iso2.toUpperCase();
        if (!teamsMap.has(iso)) {
          teamsMap.set(iso, {
            name: m.away_team_name,
            iso2: iso,
            group: m.group || "",
          });
        } else if (m.group && !teamsMap.get(iso)?.group) {
          teamsMap.get(iso)!.group = m.group;
        }
      }
    });
    return Array.from(teamsMap.values()).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [matches]);

  // Filter and resolve ALL matches (with search query filtering and placeholder resolving)
  const allMatchesResolved = useMemo(() => {
    return matches
      .filter((m) => {
        return (
          searchQuery === "" ||
          m.home_team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.away_team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.stadium_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.stage_label.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .map((m) => {
        if (m.phase === "knockout") {
          const resolvedHome = resolveTeam(m.home_team_name, matchesMap, getGroupStandings);
          const resolvedAway = resolveTeam(m.away_team_name, matchesMap, getGroupStandings);
          return {
            ...m,
            home_team_name: resolvedHome.name || m.home_team_name,
            home_team_iso2: resolvedHome.iso2 || m.home_team_iso2,
            away_team_name: resolvedAway.name || m.away_team_name,
            away_team_iso2: resolvedAway.iso2 || m.away_team_iso2,
            home_placeholder: m.home_team_name !== resolvedHome.name ? m.home_team_name : undefined,
            away_placeholder: m.away_team_name !== resolvedAway.name ? m.away_team_name : undefined,
          };
        }
        return m;
      });
  }, [matches, searchQuery, matchesMap, getGroupStandings]);

  // List of all matches involving any of the user's favorite teams
  const favoriteTeamsMatches = useMemo(() => {
    if (myTeams.length === 0) return [];
    return allMatchesResolved.filter((m) => {
      const homeIso = m.home_team_iso2?.toUpperCase();
      const awayIso = m.away_team_iso2?.toUpperCase();
      return (homeIso && myTeams.includes(homeIso)) || (awayIso && myTeams.includes(awayIso));
    });
  }, [allMatchesResolved, myTeams]);

  const filteredMatchesByDate = useMemo(() => {
    return matches
      .filter((m) => {
        const matchesDate = m.local_date.split(" ")[0] === selectedDate;
        const matchesSearch =
          searchQuery === "" ||
          m.home_team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.away_team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.stadium_city.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesDate && matchesSearch;
      })
      .map((m) => {
        if (m.phase === "knockout") {
          const resolvedHome = resolveTeam(m.home_team_name, matchesMap, getGroupStandings);
          const resolvedAway = resolveTeam(m.away_team_name, matchesMap, getGroupStandings);
          return {
            ...m,
            home_team_name: resolvedHome.name || m.home_team_name,
            home_team_iso2: resolvedHome.iso2 || m.home_team_iso2,
            away_team_name: resolvedAway.name || m.away_team_name,
            away_team_iso2: resolvedAway.iso2 || m.away_team_iso2,
            home_placeholder: m.home_team_name !== resolvedHome.name ? m.home_team_name : undefined,
            away_placeholder: m.away_team_name !== resolvedAway.name ? m.away_team_name : undefined,
          };
        }
        return m;
      });
  }, [matches, selectedDate, searchQuery, matchesMap, getGroupStandings]);

  // Filter matches for the "favorites" tab (resolving placeholder knockout teams dynamically)
  const favoriteMatches = useMemo(() => {
    return matches
      .filter((m) => favorites.includes(m.match_id))
      .filter((m) => {
        return (
          searchQuery === "" ||
          m.home_team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.away_team_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .map((m) => {
        if (m.phase === "knockout") {
          const resolvedHome = resolveTeam(m.home_team_name, matchesMap, getGroupStandings);
          const resolvedAway = resolveTeam(m.away_team_name, matchesMap, getGroupStandings);
          return {
            ...m,
            home_team_name: resolvedHome.name || m.home_team_name,
            home_team_iso2: resolvedHome.iso2 || m.home_team_iso2,
            away_team_name: resolvedAway.name || m.away_team_name,
            away_team_iso2: resolvedAway.iso2 || m.away_team_iso2,
            home_placeholder: m.home_team_name !== resolvedHome.name ? m.home_team_name : undefined,
            away_placeholder: m.away_team_name !== resolvedAway.name ? m.away_team_name : undefined,
          };
        }
        return m;
      });
  }, [matches, favorites, searchQuery, matchesMap, getGroupStandings]);

  // Group all matches by date chronologically
  const groupedMatches = useMemo(() => {
    const groups: { [dateStr: string]: Match[] } = {};
    allMatchesResolved.forEach((match) => {
      const dateStr = match.local_date.split(" ")[0];
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(match);
    });

    const sortedGroupDates = Object.keys(groups).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split("/").map(Number);
      const [dayB, monthB, yearB] = b.split("/").map(Number);
      return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
    });

    return sortedGroupDates.map((dateStr) => ({
      dateStr,
      matches: groups[dateStr],
    }));
  }, [allMatchesResolved]);

  // Format date display (e.g. "12/06/2026" -> "Ngày 12/06")
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [day, month] = dateStr.split("/");
    return `Ngày ${day}/${month}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* 1. Stunning Hero Section */}
      <HeroBanner matches={matches} favorites={favorites} myTeams={myTeams} />

      {/* 1.5. Simulation Control Bar */}
      <div className="w-full glass-panel border border-card-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg bg-card-bg/40 backdrop-blur-md transition-all duration-300">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl transition-all duration-300 ${
              isSimulated
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                : "bg-primary/10 text-primary border border-primary/20"
            }`}
          >
            {isSimulated ? <Sparkles size={20} className="animate-pulse" /> : <Activity size={20} />}
          </div>
          <div className="text-left space-y-0.5">
            <h4 className="text-sm font-black text-foreground flex items-center gap-1.5">
              {isSimulated ? "Chế độ mô phỏng tỷ số" : "Dữ liệu lịch thi đấu thực tế"}
              {isSimulated && (
                <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Simulated
                </span>
              )}
            </h4>
            <p className="text-[11px] text-foreground/50 font-bold max-w-md leading-relaxed">
              {isSimulated
                ? "Đã mô phỏng tỷ số vòng bảng nhằm hiển thị điểm số, hiệu số, và xếp hạng của 12 bảng đấu."
                : "Hiển thị dữ liệu thực tế từ VNExpress. Hiện tại các trận đấu chưa diễn ra (0-0)."}
            </p>
          </div>
        </div>

        <button
          onClick={toggleSimulation}
          className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-102 active:scale-98 shadow-md border cursor-pointer ${
            isSimulated
              ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600/30 shadow-amber-500/20"
              : "bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-foreground border-slate-200 dark:border-white/10"
          }`}
        >
          {isSimulated ? "Reset Dữ liệu thực tế" : "Kích hoạt Mô phỏng"}
        </button>
      </div>

      {/* 2. Dedicated Tab Selectors Bar */}
      <div className="w-full">
        <div className="flex bg-slate-100 gap-2 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-1 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-white scale-100"
                    : "text-foreground/60 hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-white/5"
                }`}
              >
                <Icon size={16} />
                <span>
                  {tab.label}
                  {tab.id === "favorites" && isLoadedFavs && ` (${favorites.length})`}
                  {tab.id === "favorite_teams" && isLoadedMyTeams && ` (${myTeams.length})`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Sub-Controls Bar (Calendar Picker & Search box on its own line) */}
      {activeTab !== "knockout" && activeTab !== "group" && (
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          {/* Calendar Picker (Only visible in "date" tab) */}
          {activeTab === "date" && (
            <div className="w-full sm:w-auto flex-1 sm:flex-initial">
              <CalendarPicker selectedDate={selectedDate} onChange={setSelectedDate} availableDates={sortedDates} />
            </div>
          )}

          {/* Global Search box */}
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
        </div>
      )}

      {/* 5. Main Dashboard Content Area */}
      <main className="min-h-[350px]">
        {!(isLoadedFavs && isLoadedMatches) ? (
          /* Loading Placeholder */
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-secondary/35 border-t-secondary rounded-full animate-spin" />
            <p className="text-xs text-foreground/50 font-bold">Đang tải dữ liệu và cấu hình...</p>
          </div>
        ) : (
          /* Hydrated Content */
          <>
            {activeTab === "date" && (
              <div className="space-y-4 animate-slide-up">
                <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary border-b border-slate-200 dark:border-white/5 pb-2">
                  <Grid size={16} /> Danh sách trận ngày {selectedDate}
                </div>
                {filteredMatchesByDate.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMatchesByDate.map((match) => (
                      <div key={match.match_id} className="h-[125px]">
                        <MatchCard match={match} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 text-sm text-foreground/50">
                    Không tìm thấy trận đấu nào phù hợp.
                  </div>
                )}
              </div>
            )}

            {activeTab === "all" && (
              <div className="space-y-6 animate-slide-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-2">
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary">
                    <Grid size={16} /> Tất Cả Trận Đấu ({allMatchesResolved.length} trận)
                  </div>

                  {/* Bulk Calendar Download Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-foreground/80 hover:text-foreground font-black text-xs transition-all duration-300 cursor-pointer select-none">
                      <Calendar size={13} className="text-secondary" />
                      <span>Tải lịch thi đấu (.ics)</span>
                      <ChevronDown size={12} className="opacity-60 transition-transform group-hover:rotate-180" />
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-card-border bg-card-bg/95 backdrop-blur-md shadow-2xl py-1.5 z-30 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300">
                      <button
                        onClick={() => downloadMatchesIcsFile(matches, "all")}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        📅 Tất cả trận đấu
                      </button>
                      <button
                        onClick={() => downloadMatchesIcsFile(matches, "group")}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        🏆 Vòng bảng
                      </button>
                      <button
                        onClick={() => downloadMatchesIcsFile(matches, "knockout")}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-foreground/80 hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        🔥 Vòng knockout
                      </button>
                    </div>
                  </div>
                </div>
                {groupedMatches.length > 0 ? (
                  <div className="space-y-8">
                    {groupedMatches.map((group) => (
                      <div key={group.dateStr} className="space-y-3">
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
                            <div key={match.match_id} className="h-[125px]">
                              <MatchCard match={match} />
                            </div>
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
            )}

            {activeTab === "group" && (
              <div className="animate-slide-up">
                <GroupStandings matches={matches} />
              </div>
            )}

            {activeTab === "knockout" && (
              <div className="animate-slide-up">
                <KnockoutBracket matches={matches} />
              </div>
            )}

            {activeTab === "favorites" && (
              <div className="space-y-4 animate-slide-up">
                <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary border-b border-slate-200 dark:border-white/5 pb-2">
                  <Star size={16} className="fill-secondary text-secondary" /> Trận Đấu Yêu Thích Của Tôi (
                  {favoriteMatches.length})
                </div>
                {favoriteMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteMatches.map((match) => (
                      <div key={match.match_id} className="h-[125px]">
                        <MatchCard match={match} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 text-sm text-foreground/50 space-y-1">
                    <p className="font-bold text-foreground/75">Danh sách yêu thích trống!</p>
                    <p className="text-xs">Hãy nhấn biểu tượng ngôi sao ở các trận đấu để lưu trữ và nhận thông báo.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "favorite_teams" && (
              <FavoriteTeamsTab
                myTeams={myTeams}
                allTeams={allTeams}
                favoriteTeamsMatches={favoriteTeamsMatches}
                searchQuery={searchQuery}
                handleToggleFavoriteTeam={handleToggleFavoriteTeam}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Theme Toggle (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <PremiumToggle />
      </div>
    </div>
  );
}
