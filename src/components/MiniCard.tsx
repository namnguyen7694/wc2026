"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Match } from "../types/match";
import { Trophy, Heart, Clock } from "lucide-react";
import Modal from "./ui/Modal";

interface MiniCardProps {
  match: Match;
}

export default React.memo(function MiniCard({ match }: MiniCardProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myTeams, setMyTeams] = useState<string[]>([]);

  const handleTeamClick = (e: React.MouseEvent, iso2: string) => {
    e.stopPropagation();
    if (iso2 && iso2.length >= 2 && !/^\d[A-L]$|^W\d+|^L\d+|^3[A-L]\//.test(iso2)) {
      router.push(`/teams/${iso2.toLowerCase()}`);
    }
  };

  useEffect(() => {
    const checkMyTeams = () => {
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("wc2026_my_teams");
          if (stored) {
            setMyTeams(JSON.parse(stored));
          } else {
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

  const getFlagUrl = (iso2: string, teamLogo: string) => {
    if (!teamLogo && !iso2) return null;
    if (!iso2 && !!teamLogo) return teamLogo;
    const code = iso2.toLowerCase();
    if (code === "eng") return "https://flagcdn.com/w80/gb-eng.png";
    if (code === "sco") return "https://flagcdn.com/w80/gb-sct.png";
    return `https://flagcdn.com/w80/${code}.png`;
  };

  const isPlaceholderTeam = (name: string) => {
    return !name || /^\d[A-L]$|^W\d+|^L\d+|^3[A-L]\//.test(name);
  };

  const homeScore = match.home_score;
  const awayScore = match.away_score;

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="glass-panel glass-panel-hover rounded border border-card-border/60 px-1.5 py-0.5 relative flex flex-col justify-center h-full group text-foreground transition-all duration-300 cursor-pointer select-none text-[9px]"
      >
        {/* Match ID badge - extremely small */}
        <div className="absolute top-0 right-1 text-[6px] font-mono text-foreground/25 font-black">
          #{match.match_id}
        </div>

        {/* Main Teams Match Area */}
        <div className="flex flex-col gap-0.5 mt-0.5">
          {/* Home Team */}
          <div
            className="flex items-center justify-between gap-1 w-full min-w-0"
          >
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <div className="w-3.5 h-2.5 rounded-sm overflow-hidden shadow-sm bg-slate-100 dark:bg-white/5 border border-slate-200/50 flex items-center justify-center flex-shrink-0">
                {getFlagUrl(match.home_team_iso2, match.home_team_logo) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getFlagUrl(match.home_team_iso2, match.home_team_logo)!}
                    alt={match.home_team_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy size={4} className="text-secondary/55" />
                )}
              </div>
              <span
                className={`font-semibold truncate min-w-0 flex-1 ${
                  isPlaceholderTeam(match.home_team_name)
                    ? "text-secondary/70 italic font-medium"
                    : isHomeFavorite
                      ? "text-rose-600 dark:text-rose-400 font-bold"
                      : "text-foreground"
                }`}
              >
                {match.home_team_name}
              </span>
              {isHomeFavorite && <Heart size={5} className="fill-rose-500 text-rose-500 flex-shrink-0" />}
            </div>
            
            {/* Score Home */}
            {match.status !== "notstarted" && (
              <span className="font-bold text-foreground text-right pl-0.5 flex-shrink-0">
                {homeScore}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div
            className="flex items-center justify-between gap-1 w-full min-w-0"
          >
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <div className="w-3.5 h-2.5 rounded-sm overflow-hidden shadow-sm bg-slate-100 dark:bg-white/5 border border-slate-200/50 flex items-center justify-center flex-shrink-0">
                {getFlagUrl(match.away_team_iso2, match.away_team_logo) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getFlagUrl(match.away_team_iso2, match.away_team_logo)!}
                    alt={match.away_team_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy size={4} className="text-secondary/55" />
                )}
              </div>
              <span
                className={`font-semibold truncate min-w-0 flex-1 ${
                  isPlaceholderTeam(match.away_team_name)
                    ? "text-secondary/70 italic font-medium"
                    : isAwayFavorite
                      ? "text-rose-600 dark:text-rose-400 font-bold"
                      : "text-foreground"
                }`}
              >
                {match.away_team_name}
              </span>
              {isAwayFavorite && <Heart size={5} className="fill-rose-500 text-rose-500 flex-shrink-0" />}
            </div>

            {/* Score Away */}
            {match.status !== "notstarted" && (
              <span className="font-bold text-foreground text-right pl-0.5 flex-shrink-0">
                {awayScore}
              </span>
            )}
          </div>
        </div>

        {/* Live Indicator */}
        {match.status !== "notstarted" && match.status !== "finished" && (
          <div className="absolute top-[0.5px] left-1 scale-75 origin-top-left">
            <span className="text-[5px] font-black text-red-500 dark:text-red-400 inline-flex items-center gap-0.5 select-none animate-pulse">
              <span className="relative flex h-0.5 w-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-0.5 w-0.5 bg-red-500"></span>
              </span>
              LIVE
            </span>
          </div>
        )}
      </div>

      {/* Match Detail Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`🏆 ${match.stage_label}${match.group ? ` • Bảng ${match.group}` : ""}`}
      >
        <div className="space-y-6 text-foreground text-xs sm:text-sm">
          {/* Main Scoreboard Layout */}
          <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-200/60 dark:border-white/5 pb-6">
            <div
              onClick={(e) => handleTeamClick(e, match.home_team_iso2)}
              className={`flex flex-col items-center text-center flex-1 min-w-0 ${
                match.home_team_iso2 && !isPlaceholderTeam(match.home_team_name)
                  ? "cursor-pointer group/modal-team hover:scale-102 transition-transform"
                  : ""
              }`}
            >
              <div className="relative w-12 h-8 sm:w-16 sm:h-10 rounded-lg shadow overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-2 group-hover/modal-team:border-secondary transition-colors">
                {getFlagUrl(match.home_team_iso2, match.home_team_logo) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getFlagUrl(match.home_team_iso2, match.home_team_logo)!.replace("w40", "w80")}
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
                <span
                  className={`text-[10px] font-extrabold mt-1 uppercase tracking-wider ${
                    match.status === "finished"
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {match.status === "finished"
                    ? "Đã xong"
                    : match.status === "live"
                      ? "Đang đá"
                      : `Live - ${match.status.toUpperCase()}`}
                </span>
              )}
            </div>

            <div
              onClick={(e) => handleTeamClick(e, match.away_team_iso2)}
              className={`flex flex-col items-center text-center flex-1 min-w-0 ${
                match.away_team_iso2 && !isPlaceholderTeam(match.away_team_name)
                  ? "cursor-pointer group/modal-team hover:scale-102 transition-transform"
                  : ""
              }`}
            >
              <div className="relative w-12 h-8 sm:w-16 sm:h-10 rounded-lg shadow overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-2 group-hover/modal-team:border-secondary transition-colors">
                {getFlagUrl(match.away_team_iso2, match.away_team_logo) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getFlagUrl(match.away_team_iso2, match.away_team_logo)!.replace("w40", "w80")}
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

          {/* Details */}
          <div className="space-y-4">
            {(match.home_scorers || match.away_scorers) && (
              <div className="bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl p-3.5 space-y-2">
                <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">
                  ⚽ DANH SÁCH GHI BÀN
                </h4>
                <div className="grid grid-cols-2 gap-3 text-[11px] sm:text-xs">
                  <div className="space-y-1 pr-2 border-r border-slate-200/60 dark:border-white/5">
                    <p className="font-extrabold text-foreground/80 truncate">{match.home_team_name}</p>
                    <p className="text-foreground/60 leading-relaxed font-medium">{match.home_scorers || "—"}</p>
                  </div>
                  <div className="space-y-1 pl-2">
                    <p className="font-extrabold text-foreground/80 truncate">{match.away_team_name}</p>
                    <p className="text-foreground/60 leading-relaxed font-medium">{match.away_scorers || "—"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3.5 text-xs bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 p-4 rounded-2xl">
              <div>
                <span className="text-[10px] text-foreground/45 font-bold uppercase tracking-wider block mb-0.5">
                  Thời Gian
                </span>
                <span className="font-extrabold text-foreground/90">{match.local_date}</span>
              </div>
              <div>
                <span className="text-[10px] text-foreground/45 font-bold uppercase tracking-wider block mb-0.5">
                  Địa Điểm
                </span>
                <span className="font-extrabold text-foreground/90">{match.stadium_city || "Stadia"}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
});
