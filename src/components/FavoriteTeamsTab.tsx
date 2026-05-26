"use client";

import React from "react";
import { Match } from "../types/match";
import { Heart, Calendar, Grid } from "lucide-react";
import Link from "next/link";
import MatchCard from "./MatchCard";

interface TeamInfo {
  name: string;
  iso2: string;
  group: string;
}

interface FavoriteTeamsTabProps {
  myTeams: string[];
  allTeams: TeamInfo[];
  favoriteTeamsMatches: Match[];
  searchQuery: string;
  handleToggleFavoriteTeam: (code: string) => void;
}

export default function FavoriteTeamsTab({
  myTeams,
  allTeams,
  favoriteTeamsMatches,
  searchQuery,
  handleToggleFavoriteTeam,
}: FavoriteTeamsTabProps) {
  return (
    <div className="space-y-8 animate-slide-up">
      {/* Section 1: My Favorite Teams list */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary border-b border-slate-200 dark:border-white/5 pb-2">
          <Heart size={16} className="fill-rose-500 text-rose-500" /> Đội Tuyển Yêu Thích Của Tôi ({myTeams.length})
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
              Hãy kéo xuống phần **Khám phá 48 quốc gia** bên dưới và nhấn biểu tượng ❤️ để bắt đầu cá nhân hóa hành
              trình World Cup 2026 của riêng bạn.
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Fixtures of Favorite Teams */}
      {myTeams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-sm font-extrabold text-secondary border-b border-slate-200 dark:border-white/5 pb-2">
            <Calendar size={16} className="text-secondary" /> Lịch Thi Đấu Đội Yêu Thích ({favoriteTeamsMatches.length}{" "}
            trận)
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
          <span className="text-[10px] text-foreground/45 font-bold uppercase tracking-wider">FIFA World Cup 2026</span>
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
  );
}
