"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Match } from "../types/match";
import { usePersistentState } from "../hooks/usePersistentState";
import PremiumToggle from "./ui/PremiumToggle";
import MatchCard from "./MatchCard";
import GroupStandings from "./GroupStandings";
import KnockoutBracket from "./KnockoutBracket";
import CalendarPicker from "./ui/CalendarPicker";
import { Calendar, Trophy, Heart, Search, Grid, Flame, Star, Users } from "lucide-react";
import { useMatchStore } from "../hooks/useMatchStore";
import Link from "next/link";

const TABS = [
  { id: "all", label: "Tất cả trận đấu", icon: Grid },
  { id: "date", label: "Lịch thi đấu theo ngày", icon: Calendar },
  { id: "group", label: "Bảng đấu & Xếp hạng", icon: Trophy },
  { id: "knockout", label: "Nhánh đấu Knockout", icon: Flame },
  { id: "favorites", label: "Trận yêu thích", icon: Heart },
  { id: "favorite_teams", label: "Đội yêu thích", icon: Users },
] as const;

// Recursively resolve placeholders (e.g. W74, L101) into actual team names and ISO2s
function resolveTeam(placeholder: string, matchesMap: Map<string, Match>): { name: string; iso2: string } {
  if (!placeholder) return { name: "", iso2: "" };

  const matchWinner = placeholder.match(/^W(\d+)$/);
  const matchLoser = placeholder.match(/^L(\d+)$/);

  if (!matchWinner && !matchLoser) {
    return { name: placeholder, iso2: "" };
  }

  const refMatchId = matchWinner ? matchWinner[1] : matchLoser![1];
  const refMatch = matchesMap.get(refMatchId);

  if (!refMatch) return { name: placeholder, iso2: "" };

  const isPlayed = refMatch.finished;

  if (!isPlayed) {
    return {
      name: matchWinner ? `Thắng Trận ${refMatchId}` : `Thua Trận ${refMatchId}`,
      iso2: "",
    };
  }

  const hScore = refMatch.home_score;
  const aScore = refMatch.away_score;

  const homeTeamResolved = resolveTeam(refMatch.home_team_name, matchesMap);
  const awayTeamResolved = resolveTeam(refMatch.away_team_name, matchesMap);

  const homeWins = hScore >= aScore;

  if (matchWinner) {
    return homeWins ? homeTeamResolved : awayTeamResolved;
  } else {
    return homeWins ? awayTeamResolved : homeTeamResolved;
  }
}

export default function ScheduleDashboard() {
  const [activeTab, setActiveTab] = useState<"date" | "all" | "group" | "knockout" | "favorites" | "favorite_teams">(
    "all",
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // Extract and sort unique dates from all matches (both group and knockout stage)
  const sortedDates = useMemo(() => {
    const allDates = matches.map((m) => m.local_date.split(" ")[0]);

    return Array.from(new Set(allDates)).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split("/").map(Number);
      const [dayB, monthB, yearB] = b.split("/").map(Number);
      return new Date(yearA, monthA - 1, dayA).getTime() - new Date(yearB, monthB - 1, dayB).getTime();
    });
  }, [matches]);

  // Initialise first date when mounted
  useEffect(() => {
    if (sortedDates.length > 0 && !selectedDate) {
      setSelectedDate(sortedDates[0]);
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
  }, [matches, searchQuery, matchesMap]);

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
  }, [matches, selectedDate, searchQuery, matchesMap]);

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
  }, [matches, favorites, searchQuery, matchesMap]);

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
      {/* 1. Stunning Hero Section (Separated from the dashboard controls) */}
      <section className="relative overflow-hidden rounded-[32px] border border-card-border bg-slate-900 text-white p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black select-none">
        {/* Abstract football field pitch lines (pure CSS art) */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none select-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] border-[2px] border-white rounded-full" />
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[2px] border-white rounded-full" />
        </div>

        {/* Ambient glowing accent light overlays */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

        {/* Left Side: Branding and Title */}
        <div className="relative z-10 space-y-6 max-w-xl text-left">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-rose-400 font-extrabold text-[10px] sm:text-xs uppercase tracking-wider animate-pulse-slow">
              🏆 FIFA WORLD CUP 2026
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-extrabold text-[10px] sm:text-xs uppercase tracking-wider">
              🇺🇸 Mỹ • 🇨🇦 Canada • 🇲🇽 Mexico
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none uppercase">
              Hành Trình <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-secondary animate-pulse-slow">
                Chinh Phục Cúp Vàng
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Trải nghiệm lịch thi đấu bóng đá World Cup 2026 đẳng cấp. Theo dõi sát sao 104 trận cầu đỉnh cao từ vòng
              bảng đến chung kết loại trực tiếp được đồng bộ tự động trực tiếp từ nguồn tin cậy **VNExpress**.
            </p>
          </div>
        </div>

        {/* Right Side: Big Premium Opening Match highlighted card */}
        <div className="relative z-10 w-full md:w-auto flex justify-center">
          <div className="relative p-6 sm:p-8 rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center min-w-[250px] text-center overflow-hidden group hover:border-white/20 transition-all duration-500">
            {/* Ambient gold gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent opacity-50 group-hover:scale-110 transition-transform duration-500" />

            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-4 block animate-pulse">
              ⚡ TRẬN KHAI MẠC ⚡
            </span>

            <div className="space-y-1 mb-4 relative z-10">
              <div className="text-xl sm:text-2xl font-black text-white">11 / 06 / 2026</div>
              <p className="text-[10px] text-slate-400 font-bold">Estadio Azteca, Mexico City</p>
            </div>

            <div className="w-12 h-[1px] bg-white/15 my-1" />

            <div className="mt-4 flex items-center justify-center gap-6 relative z-10">
              <div className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl">Mexico</span>
                <span className="text-[10px] font-extrabold text-slate-300 mt-1">🇲🇽</span>
              </div>
              <span className="text-xs font-black text-amber-400">VS</span>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-slate-400">South Africa</span>
                <span className="text-[10px] font-bold text-slate-500 mt-1">SA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dedicated Tab Selectors Bar */}
      <div className="w-full">
        <div className="flex bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-1 overflow-x-auto scrollbar-none">
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
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary">
                    <Grid size={16} /> Tất Cả Trận Đấu ({allMatchesResolved.length} trận)
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
              <div className="space-y-8 animate-slide-up">
                {/* Section 1: My Favorite Teams list */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary border-b border-slate-200 dark:border-white/5 pb-2">
                    <Heart size={16} className="fill-rose-500 text-rose-500" /> Đội Tuyển Yêu Thích Của Tôi (
                    {myTeams.length})
                  </div>

                  {myTeams.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {allTeams
                        .filter((t) => myTeams.includes(t.iso2))
                        .map((team) => {
                          const flagUrl =
                            team.iso2.toLowerCase() === "eng"
                              ? "https://flagcdn.com/w80/gb-eng.png"
                              : team.iso2.toLowerCase() === "sco"
                                ? "https://flagcdn.com/w80/gb-sct.png"
                                : `https://flagcdn.com/w80/${team.iso2.toLowerCase()}.png`;

                          return (
                            <div
                              key={team.iso2}
                              className="glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col items-center justify-between border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.04)] relative group text-center h-[170px]"
                            >
                              {/* Quick heart toggle inside dashboard */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavoriteTeam(team.iso2);
                                }}
                                className="absolute top-2 right-2 text-rose-500 hover:scale-110 p-1.5 rounded-lg transition-transform cursor-pointer"
                                aria-label="Bỏ thích"
                              >
                                <Heart size={15} className="fill-rose-500 text-rose-500" />
                              </button>

                              <Link
                                href={`/teams/${team.iso2.toLowerCase()}`}
                                className="flex-1 flex flex-col items-center justify-center space-y-2.5 w-full"
                              >
                                <div className="w-14 h-9 sm:w-16 sm:h-10 rounded-md overflow-hidden shadow-sm border border-slate-200 dark:border-white/10 group-hover:border-rose-500/40 transition-colors">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={flagUrl} alt={team.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="w-full">
                                  <h4 className="text-xs sm:text-sm font-black text-foreground truncate w-full group-hover:text-rose-500 transition-colors">
                                    {team.name}
                                  </h4>
                                  {team.group && (
                                    <span className="text-[10px] text-foreground/45 font-bold uppercase tracking-wider">
                                      Bảng {team.group}
                                    </span>
                                  )}
                                </div>
                              </Link>

                              <Link
                                href={`/teams/${team.iso2.toLowerCase()}`}
                                className="mt-2 text-[10px] font-black text-secondary uppercase tracking-widest hover:underline hover:text-rose-500 transition-colors"
                              >
                                Xem Hồ Sơ &rarr;
                              </Link>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 text-sm text-foreground/50 space-y-2 max-w-xl mx-auto">
                      <p className="font-bold text-foreground/75 text-base">Bạn chưa chọn đội tuyển yêu thích nào!</p>
                      <p className="text-xs px-6 leading-relaxed max-w-md mx-auto">
                        Hãy kéo xuống phần **Khám phá 48 quốc gia** bên dưới và nhấn biểu tượng ❤️ để bắt đầu cá nhân
                        hóa hành trình World Cup 2026 của riêng bạn.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 2: Fixtures of Favorite Teams */}
                {myTeams.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary border-b border-slate-200 dark:border-white/5 pb-2">
                      <Calendar size={16} className="text-secondary" /> Lịch Thi Đấu Đội Yêu Thích (
                      {favoriteTeamsMatches.length} trận)
                    </div>
                    {favoriteTeamsMatches.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favoriteTeamsMatches.map((match) => (
                          <div key={match.match_id} className="h-[125px]">
                            <MatchCard match={match} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 text-xs text-foreground/45">
                        Không tìm thấy lịch đấu nào phù hợp của các đội tuyển yêu thích.
                      </div>
                    )}
                  </div>
                )}

                {/* Section 3: Explore 48 Countries */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-white/5 pb-2">
                    <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary">
                      <Grid size={16} /> Khám Phá 48 Quốc Gia Tham Dự
                    </div>
                    <span className="text-[10px] text-foreground/45 font-bold uppercase tracking-wider">
                      FIFA World Cup 2026
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {allTeams
                      .filter(
                        (t) =>
                          searchQuery === "" ||
                          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.iso2.toLowerCase().includes(searchQuery.toLowerCase()),
                      )
                      .map((team) => {
                        const isFav = myTeams.includes(team.iso2);
                        const flagUrl =
                          team.iso2.toLowerCase() === "eng"
                            ? "https://flagcdn.com/w80/gb-eng.png"
                            : team.iso2.toLowerCase() === "sco"
                              ? "https://flagcdn.com/w80/gb-sct.png"
                              : `https://flagcdn.com/w80/${team.iso2.toLowerCase()}.png`;

                        return (
                          <div
                            key={team.iso2}
                            className={`glass-panel glass-panel-hover rounded-2xl p-4 flex flex-col items-center justify-between relative group text-center h-[170px] border ${
                              isFav ? "border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.04)]" : "border-card-border"
                            }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavoriteTeam(team.iso2);
                              }}
                              className="absolute top-2 right-2 hover:scale-110 p-1.5 rounded-lg transition-transform cursor-pointer"
                              aria-label={isFav ? "Bỏ thích" : "Thích"}
                            >
                              <Heart
                                size={15}
                                className={`${isFav ? "fill-rose-500 text-rose-500" : "text-foreground/30 hover:text-rose-500"}`}
                              />
                            </button>

                            <Link
                              href={`/teams/${team.iso2.toLowerCase()}`}
                              className="flex-1 flex flex-col items-center justify-center space-y-2.5 w-full"
                            >
                              <div className="w-14 h-9 sm:w-16 sm:h-10 rounded-md overflow-hidden shadow-sm border border-slate-200 dark:border-white/10 group-hover:border-secondary transition-colors">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={flagUrl} alt={team.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="w-full">
                                <h4 className="text-xs sm:text-sm font-black text-foreground truncate w-full group-hover:text-rose-500 transition-colors">
                                  {team.name}
                                </h4>
                                {team.group && (
                                  <span className="text-[10px] text-foreground/45 font-bold uppercase tracking-wider">
                                    Bảng {team.group}
                                  </span>
                                )}
                              </div>
                            </Link>

                            <Link
                              href={`/teams/${team.iso2.toLowerCase()}`}
                              className="mt-2 text-[10px] font-black text-secondary uppercase tracking-widest hover:underline hover:text-rose-500 transition-colors"
                            >
                              Xem Hồ Sơ &rarr;
                            </Link>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
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
