"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Match } from "../types/match";
import { Star, MapPin, Trophy, Clock, Heart, Calendar, Download } from "lucide-react";
import Modal from "./ui/Modal";
import { getGoogleCalendarUrl, downloadIcsFile } from "../utils/calendarUtils";

interface MatchCardProps {
  match: Match;
  showDateHeader?: boolean;
  size?: "sm" | "md";
}

export default React.memo(function MatchCard({ match, showDateHeader = false, size = "md" }: MatchCardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [myTeams, setMyTeams] = useState<string[]>([]);

  // Navigate to country profile page (excluding placeholder team names)
  const handleTeamClick = (e: React.MouseEvent, iso2: string) => {
    e.stopPropagation();
    if (iso2 && iso2.length >= 2 && !/^\d[A-L]$|^W\d+|^L\d+|^3[A-L]\//.test(iso2)) {
      router.push(`/teams/${iso2.toLowerCase()}`);
    }
  };

  const homeScore = match.home_score;
  const awayScore = match.away_score;

  // React to persistent favorites changes in localStorage
  useEffect(() => {
    const checkFavorite = () => {
      if (typeof window !== "undefined") {
        try {
          const favs = JSON.parse(localStorage.getItem("wc2026_favorites_v1") || "[]");
          setIsFavorite(Array.isArray(favs) && favs.includes(match.match_id));
        } catch {
          setIsFavorite(false);
        }
      }
    };

    checkFavorite();

    window.addEventListener("wc2026_favorites_changed", checkFavorite);
    return () => {
      window.removeEventListener("wc2026_favorites_changed", checkFavorite);
    };
  }, [match.match_id]);

  // Sync "Đội bóng tôi yêu" list and listen to events
  useEffect(() => {
    const checkMyTeams = () => {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("wc2026_my_teams");
          if (stored) {
            setMyTeams(JSON.parse(stored));
          } else {
            // Migration fallback
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
    };

    checkMyTeams();

    window.addEventListener("wc2026_my_teams_changed", checkMyTeams);
    window.addEventListener("wc2026_my_team_changed", checkMyTeams);
    return () => {
      window.removeEventListener("wc2026_my_teams_changed", checkMyTeams);
      window.removeEventListener("wc2026_my_team_changed", checkMyTeams);
    };
  }, []);

  const isHomeFavorite = match.home_team_iso2 && myTeams.includes(match.home_team_iso2.toUpperCase());
  const isAwayFavorite = match.away_team_iso2 && myTeams.includes(match.away_team_iso2.toUpperCase());

  // Handle local toggle and dispatch window event to synchronize all cards and tabs
  const handleToggleFavoriteInternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      try {
        const favs = JSON.parse(localStorage.getItem("wc2026_favorites_v1") || "[]");
        let newFavs: string[] = Array.isArray(favs) ? favs : [];

        if (newFavs.includes(match.match_id)) {
          newFavs = newFavs.filter((id) => id !== match.match_id);
        } else {
          newFavs = [...newFavs, match.match_id];
        }

        localStorage.setItem("wc2026_favorites_v1", JSON.stringify(newFavs));
        setIsFavorite(newFavs.includes(match.match_id));
        window.dispatchEvent(new Event("wc2026_favorites_changed"));
      } catch (err) {
        console.error("Failed to toggle favorite:", err);
      }
    }
  };

  const getFlagUrl = (iso2: string) => {
    if (!iso2) return null;
    const code = iso2.toLowerCase();
    if (code === "eng") return "https://flagcdn.com/w40/gb-eng.png";
    if (code === "sco") return "https://flagcdn.com/w40/gb-sct.png";
    return `https://flagcdn.com/w40/${code}.png`;
  };

  // Check if team is placeholder (e.g. "1A", "2B", "W74")
  const isPlaceholderTeam = (name: string) => {
    return !name || /^\d[A-L]$|^W\d+|^L\d+|^3[A-L]\//.test(name);
  };

  const isSm = size === "sm";

  // Size mapping variables
  const cardPadding = isSm ? "p-2 sm:p-2.5" : "p-3.5 sm:p-4.5";
  const metaText = isSm ? "text-[9px] sm:text-[10px]" : "text-xs sm:text-sm";
  const metaMargin = isSm ? "mb-1 sm:mb-1.5" : "mb-2.5 sm:mb-3.5";
  const flagWrapper = isSm ? "w-8 h-5 sm:w-10 sm:h-7 mb-1" : "w-12 h-8 sm:w-16 sm:h-10 mb-1.5 sm:mb-2";
  const flagIconSize = isSm ? 12 : 18;
  const teamText = isSm ? "text-[9px] sm:text-[10px]" : "text-xs sm:text-[13px] md:text-sm";
  const placeholderText = isSm ? "text-[7px]" : "text-[8px] sm:text-[9px]";
  const heartIconSize = isSm ? 8 : 10;
  
  const scorePadding = isSm ? "px-2 py-0.5 sm:px-2.5 sm:py-1" : "px-3.5 py-1.5 sm:px-5 sm:py-2.5";
  const scoreText = isSm ? "text-xs sm:text-sm md:text-base" : "text-base sm:text-lg md:text-xl";
  const scoreColonText = isSm ? "text-[10px]" : "text-xs";
  const timeText = isSm ? "text-[7px] sm:text-[8px]" : "text-[9px] sm:text-[10px]";
  
  const footerMargin = isSm ? "mt-1 sm:mt-1.5 pt-1" : "mt-2.5 sm:mt-3.5 pt-2";
  const footerText = isSm ? "text-[8px] sm:text-[9px]" : "text-[10px] sm:text-xs";
  const mapPinSize = isSm ? 9 : 11;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={`glass-panel glass-panel-hover rounded-2xl overflow-hidden ${cardPadding} relative flex flex-col justify-between h-full group text-foreground transition-all duration-300 cursor-pointer select-none border border-card-border`}
      >
        {/* Top Meta info */}
        <div className={`flex items-center justify-between ${metaMargin} ${metaText}`}>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-foreground/70 font-bold tracking-tight">
            {showDateHeader
              ? match.local_date.split(" ")[0]
              : `${match.stage_label}${match.group ? ` • Bảng ${match.group}` : ""}`}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-foreground/40 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-white/5 select-none font-mono">
              #{match.match_id}
            </span>
            <button
              onClick={handleToggleFavoriteInternal}
              className="text-foreground/40 hover:text-amber-400 p-1 rounded-lg transition-colors cursor-pointer"
              aria-label={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
            >
              <Star size={isSm ? 12 : 14} className={isFavorite ? "fill-amber-400 text-amber-400" : ""} />
            </button>
          </div>
        </div>

        {/* Main Teams Match Area */}
        <div className="flex items-center justify-between gap-1 py-0.5 sm:py-1.5">
          {/* Home Team */}
          <div
            onClick={(e) => handleTeamClick(e, match.home_team_iso2)}
            className={`flex flex-col items-center text-center flex-1 min-w-0 relative ${
              match.home_team_iso2 && !isPlaceholderTeam(match.home_team_name)
                ? "cursor-pointer group/team hover:scale-102 transition-transform"
                : ""
            }`}
          >
            <div className={`relative ${flagWrapper} rounded shadow-sm overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover/team:border-secondary transition-colors`}>
              {getFlagUrl(match.home_team_iso2) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getFlagUrl(match.home_team_iso2)!}
                  alt={match.home_team_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <Trophy size={flagIconSize} className="text-secondary/55" />
              )}
            </div>
            <span
              className={`font-bold w-full group-hover/team:text-secondary transition-colors flex flex-col items-center justify-center gap-0.5 min-w-0 ${teamText} ${
                isPlaceholderTeam(match.home_team_name)
                  ? "text-secondary/80 italic font-medium"
                  : isHomeFavorite
                    ? "text-rose-600 dark:text-rose-400 font-extrabold"
                    : "text-foreground"
              }`}
            >
              <div className="flex items-center justify-center gap-0.5 w-full min-w-0">
                {isHomeFavorite && <Heart size={heartIconSize} className="fill-rose-500 text-rose-500 flex-shrink-0" />}
                <span className="truncate pr-1 min-w-0">{match.home_team_name}</span>
              </div>
              {match.home_placeholder && (
                <span className={`opacity-40 font-mono tracking-tight block select-none uppercase mt-0.5 ${placeholderText}`}>
                  ({match.home_placeholder})
                </span>
              )}
            </span>
          </div>

          {/* Center Score / State Indicator */}
          <div className={`flex flex-col items-center ${scorePadding} rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 select-none`}>
            {match.status === "notstarted" ? (
              <span className={`font-black text-foreground/44 tracking-widest py-0.5 sm:py-1 block ${scoreText}`}>
                - - -
              </span>
            ) : (
              <div className={`flex items-center gap-1 font-black tracking-wider text-foreground ${scoreText}`}>
                <span>{homeScore}</span>
                <span className={`text-foreground/45 font-medium ${scoreColonText}`}>:</span>
                <span>{awayScore}</span>
              </div>
            )}
            {match.status === "notstarted" ? (
              <span className={`text-secondary font-extrabold mt-0.5 ${timeText}`}>
                {match.local_date.split(" ")[1]}
              </span>
            ) : (
              <span className={`text-emerald-500 dark:text-emerald-400 font-extrabold mt-0.5 uppercase tracking-tighter ${timeText}`}>
                {match.status === "finished" ? "Xong" : "Live"}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div
            onClick={(e) => handleTeamClick(e, match.away_team_iso2)}
            className={`flex flex-col items-center text-center flex-1 min-w-0 relative ${
              match.away_team_iso2 && !isPlaceholderTeam(match.away_team_name)
                ? "cursor-pointer group/team hover:scale-102 transition-transform"
                : ""
            }`}
          >
            <div className={`relative ${flagWrapper} rounded shadow-sm overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover/team:border-secondary transition-colors`}>
              {getFlagUrl(match.away_team_iso2) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getFlagUrl(match.away_team_iso2)!}
                  alt={match.away_team_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <Trophy size={flagIconSize} className="text-secondary/55" />
              )}
            </div>
            <span
              className={`font-bold w-full group-hover/team:text-secondary transition-colors flex flex-col items-center justify-center gap-0.5 min-w-0 ${teamText} ${
                isPlaceholderTeam(match.away_team_name)
                  ? "text-secondary/80 italic font-medium"
                  : isAwayFavorite
                    ? "text-rose-600 dark:text-rose-400 font-extrabold"
                    : "text-foreground"
              }`}
            >
              <div className="flex items-center justify-center gap-0.5 w-full min-w-0">
                {isAwayFavorite && <Heart size={heartIconSize} className="fill-rose-500 text-rose-500 flex-shrink-0" />}
                <span className="truncate pr-1 min-w-0">{match.away_team_name}</span>
              </div>
              {match.away_placeholder && (
                <span className={`opacity-40 font-mono tracking-tight block select-none uppercase mt-0.5 ${placeholderText}`}>
                  ({match.away_placeholder})
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Stadium / Location footer */}
        <div className={`${footerMargin} border-t border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 text-foreground/50 ${footerText}`}>
          <MapPin size={mapPinSize} className="text-secondary" />
          <span className="truncate flex-1 font-bold">{match.stadium_city}</span>
          {!showDateHeader && (
            <span className="text-right whitespace-nowrap opacity-85">
              {match.local_date.split(" ")[0].slice(0, 5)}
            </span>
          )}
        </div>
      </div>

      {/* Match Detail Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`🏆 ${match.stage_label}${match.group ? ` • Bảng ${match.group}` : ""}`}
      >
        <div className="space-y-6 text-foreground">
          {/* Main Scoreboard Layout */}
          <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-200/60 dark:border-white/5 pb-6">
            {/* Home Team */}
            <div
              onClick={(e) => handleTeamClick(e, match.home_team_iso2)}
              className={`flex flex-col items-center text-center flex-1 min-w-0 ${
                match.home_team_iso2 && !isPlaceholderTeam(match.home_team_name)
                  ? "cursor-pointer group/modal-team hover:scale-102 transition-transform"
                  : ""
              }`}
            >
              <div className="relative w-12 h-8 sm:w-16 sm:h-10 rounded-lg shadow overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-2 group-hover/modal-team:border-secondary transition-colors">
                {getFlagUrl(match.home_team_iso2) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getFlagUrl(match.home_team_iso2)!.replace("w40", "w80")}
                    alt={match.home_team_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy size={20} className="text-secondary/55" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-black truncate w-full text-foreground group-hover/modal-team:text-secondary transition-colors flex flex-col items-center">
                <span>{match.home_team_name}</span>
                {match.home_placeholder && (
                  <span className="text-[9px] opacity-45 font-mono uppercase font-medium mt-0.5">
                    ({match.home_placeholder})
                  </span>
                )}
              </span>
            </div>

            {/* Center Score */}
            <div className="flex flex-col items-center px-4 py-2 sm:px-6 sm:py-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 select-none min-w-[100px]">
              {match.status === "notstarted" ? (
                <span className="text-sm sm:text-base font-black text-foreground/45 tracking-widest">- - -</span>
              ) : (
                <div className="flex items-center gap-1.5 text-xl sm:text-2xl font-black tracking-wider text-foreground">
                  <span>{homeScore}</span>
                  <span className="text-foreground/40 font-medium text-sm">:</span>
                  <span>{awayScore}</span>
                </div>
              )}
              {match.status === "notstarted" ? (
                <span className="text-[10px] text-secondary font-extrabold mt-1 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={10} /> {match.local_date.split(" ")[1]}
                </span>
              ) : (
                <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-extrabold mt-1 uppercase tracking-wider">
                  {match.status === "finished" ? "Đã xong" : "Đang đá"}
                </span>
              )}
            </div>

            {/* Away Team */}
            <div
              onClick={(e) => handleTeamClick(e, match.away_team_iso2)}
              className={`flex flex-col items-center text-center flex-1 min-w-0 ${
                match.away_team_iso2 && !isPlaceholderTeam(match.away_team_name)
                  ? "cursor-pointer group/modal-team hover:scale-102 transition-transform"
                  : ""
              }`}
            >
              <div className="relative w-12 h-8 sm:w-16 sm:h-10 rounded-lg shadow overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-2 group-hover/modal-team:border-secondary transition-colors">
                {getFlagUrl(match.away_team_iso2) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getFlagUrl(match.away_team_iso2)!.replace("w40", "w80")}
                    alt={match.away_team_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy size={20} className="text-secondary/55" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-black truncate w-full text-foreground group-hover/modal-team:text-secondary transition-colors flex flex-col items-center">
                <span>{match.away_team_name}</span>
                {match.away_placeholder && (
                  <span className="text-[9px] opacity-45 font-mono uppercase font-medium mt-0.5">
                    ({match.away_placeholder})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="space-y-4">
            {/* Scorers Section */}
            {(match.home_scorers || match.away_scorers) && (
              <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl p-3.5 space-y-2">
                <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-1">
                  ⚽ DANH SÁCH GHI BÀN
                </h4>
                <div className="grid grid-cols-2 gap-3 text-[11px] sm:text-xs">
                  {/* Home scorers */}
                  <div className="space-y-1 pr-2 border-r border-slate-200/60 dark:border-white/5">
                    <p className="font-extrabold text-foreground/80 truncate">{match.home_team_name}</p>
                    <p className="text-foreground/60 leading-relaxed font-medium">{match.home_scorers || "—"}</p>
                  </div>
                  {/* Away scorers */}
                  <div className="space-y-1 pl-2">
                    <p className="font-extrabold text-foreground/80 truncate">{match.away_team_name}</p>
                    <p className="text-foreground/60 leading-relaxed font-medium">{match.away_scorers || "—"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* General Metadata Info */}
            <div className="grid grid-cols-2 gap-3.5 text-xs bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 p-4 rounded-2xl">
              <div>
                <span className="text-[10px] text-foreground/45 font-bold uppercase tracking-wider block mb-0.5">
                  Thời Gian (Địa Phương)
                </span>
                <span className="font-extrabold text-foreground/90">{match.local_date}</span>
              </div>
              <div>
                <span className="text-[10px] text-foreground/45 font-bold uppercase tracking-wider block mb-0.5">
                  Trạng Thái Trận Đấu
                </span>
                <span className="font-extrabold text-foreground/90 flex items-center gap-1">
                  {match.status === "finished" ? (
                    <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
                  ) : match.status === "live" ? (
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                  )}
                  {match.status === "finished"
                    ? "Đã kết thúc"
                    : match.status === "live"
                      ? "Đang trực tiếp"
                      : "Chưa diễn ra"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-foreground/45 font-bold uppercase tracking-wider block mb-0.5">
                  Sân Vận Động & Thành Phố
                </span>
                <span className="font-extrabold text-foreground/90">
                  {match.stadium_name} ({match.stadium_city}, {match.stadium_country})
                </span>
              </div>
            </div>

            {/* Calendar Integration Section */}
            <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 space-y-3">
              <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-1.5 select-none">
                <Calendar size={12} className="text-secondary" /> ĐỒNG BỘ LỊCH THI ĐẤU
              </h4>
              <p className="text-[11px] text-foreground/60 leading-relaxed font-medium">
                Thêm trận đấu này vào Google Calendar hoặc tải file (.ics) cho Apple Calendar, Outlook để nhận nhắc hẹn và không bỏ lỡ trận cầu!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <a
                  href={getGoogleCalendarUrl(match)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-xs transition-all duration-300 cursor-pointer select-none"
                >
                  <Calendar size={14} />
                  <span>Google Calendar</span>
                </a>
                <button
                  onClick={() => downloadIcsFile(match)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs cursor-pointer transition-all duration-300 select-none"
                >
                  <Download size={14} />
                  <span>Apple / Outlook (.ics)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </Modal>
    </>
  );
});
