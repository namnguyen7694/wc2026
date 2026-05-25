"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Match } from "../types/match";
import { Star, MapPin, Trophy, Clock } from "lucide-react";
import Modal from "./ui/Modal";

interface MatchCardProps {
  match: Match;
  showDateHeader?: boolean;
}

export default React.memo(function MatchCard({
  match,
  showDateHeader = false,
}: MatchCardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

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

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="glass-panel glass-panel-hover rounded-2xl overflow-hidden p-2.5 sm:p-3.5 relative border border-card-border flex flex-col justify-between h-full group text-foreground transition-all duration-300 cursor-pointer select-none"
      >
        {/* Top Meta info */}
        <div className="flex items-center justify-between mb-1.5 sm:mb-2.5 text-[10px] sm:text-xs">
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
              <Star size={14} className={isFavorite ? "fill-amber-400 text-amber-400" : ""} />
            </button>
          </div>
        </div>

        {/* Main Teams Match Area */}
        <div className="flex items-center justify-between gap-1 py-0.5 sm:py-1.5">
          {/* Home Team */}
          <div
            onClick={(e) => handleTeamClick(e, match.home_team_iso2)}
            className={`flex flex-col items-center text-center flex-1 min-w-0 ${
              match.home_team_iso2 && !isPlaceholderTeam(match.home_team_name)
                ? "cursor-pointer group/team hover:scale-102 transition-transform"
                : ""
            }`}
          >
            <div className="relative w-9 h-6 sm:w-11 sm:h-8 rounded shadow-sm overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-1 sm:mb-2 group-hover/team:border-secondary transition-colors">
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
                <Trophy size={14} className="text-secondary/55" />
              )}
            </div>
            <span
              className={`text-[10px] sm:text-xs font-bold truncate w-full group-hover/team:text-secondary transition-colors ${
                isPlaceholderTeam(match.home_team_name) ? "text-secondary/80 italic font-medium" : "text-foreground"
              }`}
            >
              {match.home_team_name}
            </span>
          </div>

          {/* Center Score / State Indicator */}
          <div className="flex flex-col items-center px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 select-none">
            {match.status === "notstarted" ? (
              <span className="text-xs sm:text-sm font-black text-foreground/44 tracking-widest py-0.5 sm:py-1 block">- - -</span>
            ) : (
              <div className="flex items-center gap-1 text-sm sm:text-base md:text-lg font-black tracking-wider text-foreground">
                <span>{homeScore}</span>
                <span className="text-foreground/45 font-medium text-xs">:</span>
                <span>{awayScore}</span>
              </div>
            )}
            {match.status === "notstarted" ? (
              <span className="text-[8px] sm:text-[9px] text-secondary font-extrabold mt-0.5">
                {match.local_date.split(" ")[1]}
              </span>
            ) : (
              <span className="text-[8px] sm:text-[9px] text-emerald-500 dark:text-emerald-400 font-extrabold mt-0.5 uppercase tracking-tighter">
                {match.status === "finished" ? "Xong" : "Live"}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div
            onClick={(e) => handleTeamClick(e, match.away_team_iso2)}
            className={`flex flex-col items-center text-center flex-1 min-w-0 ${
              match.away_team_iso2 && !isPlaceholderTeam(match.away_team_name)
                ? "cursor-pointer group/team hover:scale-102 transition-transform"
                : ""
            }`}
          >
            <div className="relative w-9 h-6 sm:w-11 sm:h-8 rounded shadow-sm overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-1 sm:mb-2 group-hover/team:border-secondary transition-colors">
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
                <Trophy size={14} className="text-secondary/55" />
              )}
            </div>
            <span
              className={`text-[10px] sm:text-xs font-bold truncate w-full group-hover/team:text-secondary transition-colors ${
                isPlaceholderTeam(match.away_team_name) ? "text-secondary/80 italic font-medium" : "text-foreground"
              }`}
            >
              {match.away_team_name}
            </span>
          </div>
        </div>

        {/* Stadium / Location footer */}
        <div className="mt-1.5 sm:mt-2.5 pt-1.5 border-t border-slate-200/60 dark:border-white/5 flex items-center gap-1.5 text-[9px] sm:text-[10px] text-foreground/50">
          <MapPin size={10} className="text-secondary" />
          <span className="truncate flex-1 font-bold">{match.stadium_city}</span>
          {!showDateHeader && (
            <span className="text-right whitespace-nowrap opacity-85">{match.local_date.split(" ")[0].slice(0, 5)}</span>
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
                  <img
                    src={getFlagUrl(match.home_team_iso2)!.replace("w40", "w80")}
                    alt={match.home_team_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy size={20} className="text-secondary/55" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-black truncate w-full text-foreground group-hover/modal-team:text-secondary transition-colors">
                {match.home_team_name}
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
                  <img
                    src={getFlagUrl(match.away_team_iso2)!.replace("w40", "w80")}
                    alt={match.away_team_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy size={20} className="text-secondary/55" />
                )}
              </div>
              <span className="text-xs sm:text-sm font-black truncate w-full text-foreground group-hover/modal-team:text-secondary transition-colors">
                {match.away_team_name}
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
                    <p className="text-foreground/60 leading-relaxed font-medium">
                      {match.home_scorers || "—"}
                    </p>
                  </div>
                  {/* Away scorers */}
                  <div className="space-y-1 pl-2">
                    <p className="font-extrabold text-foreground/80 truncate">{match.away_team_name}</p>
                    <p className="text-foreground/60 leading-relaxed font-medium">
                      {match.away_scorers || "—"}
                    </p>
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
          </div>
        </div>
      </Modal>
    </>
  );
});
