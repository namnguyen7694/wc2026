"use client";

import { useState, useMemo, useEffect } from "react";
import { Match } from "../types/match";
import { usePersistentState } from "../hooks/usePersistentState";
import PremiumToggle from "./ui/PremiumToggle";
import MatchCard from "./MatchCard";
import GroupStandings from "./GroupStandings";
import { Calendar, Trophy, Heart, Search, Star, Users } from "lucide-react";
import { useMatchStore } from "../hooks/useMatchStore";
import HeroBanner from "./HeroBanner";
import FavoriteTeamsTab from "./FavoriteTeamsTab";
import ScheduleTab from "./ScheduleTab";
import { resolveTeam } from "../utils/matchUtils";

const TABS = [
  { id: "schedule", label: "Lịch thi đấu", icon: Calendar },
  { id: "group", label: "Bảng đấu & Xếp hạng", icon: Trophy },
  { id: "favorites", label: "Trận yêu thích", icon: Heart },
  { id: "favorite_teams", label: "Đội yêu thích", icon: Users },
] as const;

export type TabId = (typeof TABS)[number]["id"];

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
  const [activeTab, setActiveTab] = useState<TabId>("schedule");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);
  const [viewMode, setViewMode] = usePersistentState<"grid" | "table">("wc2026_all_matches_view_mode", "table");
  const [hideGroupStage, setHideGroupStage] = usePersistentState<boolean>("wc2026_hide_group_stage", true);

  const fetchMatches = useMatchStore((state) => state.fetchMatches);
  const matches = useMatchStore((state) => state.matches);
  const isLoadedMatches = useMatchStore((state) => state.isLoaded);

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

  // Filter matches based on group stage visibility toggle
  const displayMatches = useMemo(() => {
    if (hideGroupStage) {
      return matches.filter((m) => m.phase !== "group");
    }
    return matches;
  }, [matches, hideGroupStage]);

  // Extract and sort unique dates from displayed matches
  const sortedDates = useMemo(() => getSortedDates(displayMatches), [displayMatches]);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  // Save selectedDate to localStorage when changed
  useEffect(() => {
    if (typeof window !== "undefined" && selectedDate) {
      localStorage.setItem("wc2026_selected_date", selectedDate);
    }
  }, [selectedDate]);

  // Initialise selected date to localStorage, today, or the closest match date when mounted (or adjust if selected date becomes hidden)
  useEffect(() => {
    if (isLoadedMatches && sortedDates.length > 0) {
      if (!selectedDate || !sortedDates.includes(selectedDate)) {
        let initialDate = "";
        if (typeof window !== "undefined" && !selectedDate) {
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
    return displayMatches
      .filter((m) => {
        return (
          debouncedSearchQuery === "" ||
          m.home_team_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          m.away_team_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          m.stadium_city.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          m.stage_label.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
      })
      .map((m) => {
        if (m.phase === "knockout") {
          const resolvedHome = resolveTeam(m.home_team_name, matchesMap);
          const resolvedAway = resolveTeam(m.away_team_name, matchesMap);
          return {
            ...m,
            home_team_name: resolvedHome.name || m.home_team_name,
            home_team_iso2: resolvedHome.iso2 || m.home_team_iso2,
            away_team_name: resolvedAway.name || m.away_team_name,
            away_team_iso2: resolvedAway.iso2 || m.away_team_iso2,
          };
        }
        return m;
      });
  }, [displayMatches, debouncedSearchQuery, matchesMap]);

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
    return displayMatches
      .filter((m) => m.local_date.split(" ")[0] === selectedDate)
      .map((m) => {
        if (m.phase === "knockout") {
          const resolvedHome = resolveTeam(m.home_team_name, matchesMap);
          const resolvedAway = resolveTeam(m.away_team_name, matchesMap);
          return {
            ...m,
            home_team_name: resolvedHome.name || m.home_team_name,
            home_team_iso2: resolvedHome.iso2 || m.home_team_iso2,
            away_team_name: resolvedAway.name || m.away_team_name,
            away_team_iso2: resolvedAway.iso2 || m.away_team_iso2,
          };
        }
        return m;
      });
  }, [displayMatches, selectedDate, matchesMap]);

  // Filter matches for the "favorites" tab (resolving placeholder knockout teams dynamically)
  const favoriteMatches = useMemo(() => {
    return matches
      .filter((m) => favorites.includes(m.match_id))
      .filter((m) => {
        return (
          debouncedSearchQuery === "" ||
          m.home_team_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          m.away_team_name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
      })
      .map((m) => {
        if (m.phase === "knockout") {
          const resolvedHome = resolveTeam(m.home_team_name, matchesMap);
          const resolvedAway = resolveTeam(m.away_team_name, matchesMap);
          return {
            ...m,
            home_team_name: resolvedHome.name || m.home_team_name,
            home_team_iso2: resolvedHome.iso2 || m.home_team_iso2,
            away_team_name: resolvedAway.name || m.away_team_name,
            away_team_iso2: resolvedAway.iso2 || m.away_team_iso2,
          };
        }
        return m;
      });
  }, [matches, favorites, debouncedSearchQuery, matchesMap]);

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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 space-y-6">
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

      {/* 4. Sub-Controls Bar (Search box on its own line) */}
      {(activeTab === "favorites" || activeTab === "favorite_teams") && (
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
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
            {activeTab === "schedule" && (
              <ScheduleTab
                matches={matches}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                sortedDates={sortedDates}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredMatchesByDate={filteredMatchesByDate}
                allMatchesResolved={allMatchesResolved}
                groupedMatches={groupedMatches}
                viewMode={viewMode}
                setViewMode={setViewMode}
                hideGroupStage={hideGroupStage}
                setHideGroupStage={setHideGroupStage}
              />
            )}

            {activeTab === "group" && (
              <div className="animate-slide-up">
                <GroupStandings matches={matches} />
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
                searchQuery={debouncedSearchQuery}
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
