"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Match } from "../types/match";
import { usePersistentState } from "../hooks/usePersistentState";
import PremiumToggle from "./ui/PremiumToggle";
import MatchCard from "./MatchCard";
import GroupStandings from "./GroupStandings";
import KnockoutBracket from "./KnockoutBracket";
import CalendarPicker from "./ui/CalendarPicker";
import { Calendar, Trophy, Heart, Search, Grid, Flame, Star, Users, ChevronDown, LayoutList } from "lucide-react";
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

export type TabId = (typeof TABS)[number]["id"];

const VALID_TABS = TABS.map((tab) => tab.id) as readonly TabId[];

// Helper function to extract and sort unique dates (defined at module level to satisfy React Compiler purity checks)
function getSortedDates(matches: Match[]): string[] {
  const allDates = matches.map((m) => m.local_date.split(" ")[0]);
  const uniqueDates = Array.from(new Set(allDates));

  return uniqueDates.sort((a, b) => {
    const [dayA, monthA, yearA] = a.split("/").map(Number);
    const [dayB, monthB, yearB] = b.split("/").map(Number);
    if (yearA !== yearB) return yearA - yearB;
    if (monthA !== monthB) return monthA - monthB;
    return dayA - dayB;
  });
}

// Helper function to find the match date closest to today (defined at module level to satisfy React Compiler purity checks)
function getClosestDate(sortedDates: string[]): string {
  if (sortedDates.length === 0) return "";
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

  return closestDate;
}

export default function ScheduleDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("date");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = usePersistentState<"grid" | "table">("wc2026_all_matches_view_mode", "table");

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

  const fetchMatches = useMatchStore((state) => state.fetchMatches);
  const matches = useMatchStore((state) => state.matches);
  const isLoadedMatches = useMatchStore((state) => state.isLoaded);
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
  const sortedDates = useMemo(() => getSortedDates(matches), [matches]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  // Sync tab with URL search parameters
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as TabId | null;

      let nextTab: TabId = "date";
      if (tabParam && (VALID_TABS as readonly string[]).includes(tabParam)) {
        nextTab = tabParam;
      }
      setActiveTab(nextTab);
    };

    // Run once on mount to restore state
    handlePopState();

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Synchronize activeTab changes to URL search parameters
  useEffect(() => {
    if (typeof window === "undefined" || !isLoadedMatches) return;

    const url = new URL(window.location.href);
    const currentTab = url.searchParams.get("tab");

    let changed = false;

    // Synchronize tab: default tab "date" remains clean (no ?tab=date)
    if (activeTab === "date") {
      if (url.searchParams.has("tab")) {
        url.searchParams.delete("tab");
        changed = true;
      }
    } else {
      if (currentTab !== activeTab) {
        url.searchParams.set("tab", activeTab);
        changed = true;
      }
    }

    if (changed) {
      window.history.pushState({}, "", url.pathname + url.search);
    }
  }, [activeTab, isLoadedMatches]);

  // Save selectedDate to localStorage when changed
  useEffect(() => {
    if (typeof window !== "undefined" && selectedDate) {
      localStorage.setItem("wc2026_selected_date", selectedDate);
    }
  }, [selectedDate]);

  // Initialise selected date to localStorage, today, or the closest match date when mounted
  useEffect(() => {
    if (isLoadedMatches && sortedDates.length > 0 && !selectedDate) {
      let initialDate = "";
      if (typeof window !== "undefined") {
        try {
          const savedDate = localStorage.getItem("wc2026_selected_date");
          if (savedDate && sortedDates.includes(savedDate)) {
            initialDate = savedDate;
          }
        } catch {}
      }

      if (initialDate) {
        setSelectedDate(initialDate);
      } else {
        setSelectedDate(getClosestDate(sortedDates));
      }
    }
  }, [isLoadedMatches, sortedDates, selectedDate]);

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

  // Flatten groupedMatches to reuse chronological date sorting but render in a single list
  const allMatchesSortedByDate = useMemo(() => {
    return groupedMatches.flatMap((group) => group.matches);
  }, [groupedMatches]);

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

      {/* 2. Dedicated Tab Selectors Bar */}
      <div className="w-full">
        <div className="flex bg-slate-100 gap-2 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-1 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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

            {activeTab === "all" && (
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
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-card-bg shadow-sm scrollbar-thin animate-fade-in">
                      <table className="w-full border-collapse text-left text-sm text-foreground">
                        <thead className="bg-slate-50 dark:bg-white/[0.02] text-xs font-black text-foreground/50 uppercase tracking-wider border-b border-slate-200 dark:border-white/5 select-none">
                          <tr>
                            <th className="px-4 py-3 w-[60px]">ID</th>
                            <th className="px-4 py-3 w-[130px]">Thời gian</th>
                            <th className="px-4 py-3 hidden md:table-cell w-[180px]">Vòng đấu</th>
                            <th className="px-4 py-3 text-right">Đội 1</th>
                            <th className="px-2 py-3 text-center w-[90px]">Tỉ số</th>
                            <th className="px-4 py-3 text-left">Đội 2</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Sân vận động</th>
                            <th className="px-4 py-3 text-right w-[100px]">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                          {allMatchesSortedByDate.map((match) => (
                            <MatchCard key={match.match_id} match={match} variant="row" />
                          ))}
                        </tbody>
                      </table>
                    </div>
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
                      <MatchCard key={match.match_id} match={match} />
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
