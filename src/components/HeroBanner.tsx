"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Match } from "../types/match";
import { Clock, Trophy } from "lucide-react";

interface HeroBannerProps {
  matches: Match[];
  favorites: string[];
  myTeams: string[];
}

// Flags CDN helper
const getFlagUrl = (iso2: string) => {
  if (!iso2) return null;
  const code = iso2.toLowerCase();
  if (code === "eng") return "https://flagcdn.com/w40/gb-eng.png";
  if (code === "sco") return "https://flagcdn.com/w40/gb-sct.png";
  return `https://flagcdn.com/w40/${code}.png`;
};

// Helper to parse "dd/mm/yyyy hh:mm" date string into a timestamp
const getMatchTimestamp = (localDate: string): number => {
  try {
    const [dateStr, timeStr] = localDate.split(" ");
    const formattedDate = dateStr.split("/").reverse().join("-");
    return new Date(`${formattedDate}T${timeStr}`).getTime();
  } catch {
    return 0;
  }
};

export default function HeroBanner({ matches, myTeams }: HeroBannerProps) {
  const [heroTabIndex, setHeroTabIndex] = useState<0 | 1 | 2>(0);

  // SEED_TEAMS_ISO for Top 10 seeded teams
  const SEED_TEAMS_ISO = useMemo(() => ["BR", "AR", "FR", "ENG", "DE", "ES", "PT", "BE", "NL", "UY", "HR"], []);

  // 1. Slot 1: Hot match
  const hotMatch = useMemo(() => {
    const now = new Date().getTime();
    const found = matches.find((m) => {
      const homeIso = m.home_team_iso2?.toUpperCase();
      const awayIso = m.away_team_iso2?.toUpperCase();
      if (m.status !== "notstarted" || !(SEED_TEAMS_ISO.includes(homeIso) || SEED_TEAMS_ISO.includes(awayIso)))
        return false;
      return getMatchTimestamp(m.local_date) > now;
    });
    return found || matches.find((m) => m.match_id === "104") || matches[0];
  }, [matches, SEED_TEAMS_ISO]);

  // 2. Slot 2: Next match (closest upcoming notstarted match chronologically)
  const nextMatch = useMemo(() => {
    const now = new Date().getTime();
    const allUpcoming = matches.filter((m) => {
      if (m.status !== "notstarted") return false;
      return getMatchTimestamp(m.local_date) > now;
    });

    if (allUpcoming.length > 0) {
      return allUpcoming.sort((a, b) => getMatchTimestamp(a.local_date) - getMatchTimestamp(b.local_date))[0];
    }

    return matches.find((m) => m.match_id === "1") || matches[0];
  }, [matches]);

  // 3. Slot 3: Favorite team match (upcoming match of my favorite teams)
  const myTeamMatch = useMemo(() => {
    if (myTeams.length === 0) return null;
    const now = new Date().getTime();
    const upcomingFavTeam = matches.filter((m) => {
      const homeIso = m.home_team_iso2?.toUpperCase();
      const awayIso = m.away_team_iso2?.toUpperCase();
      if (
        m.status !== "notstarted" ||
        !((homeIso && myTeams.includes(homeIso)) || (awayIso && myTeams.includes(awayIso)))
      )
        return false;
      return getMatchTimestamp(m.local_date) > now;
    });

    if (upcomingFavTeam.length > 0) {
      return upcomingFavTeam.sort((a, b) => getMatchTimestamp(a.local_date) - getMatchTimestamp(b.local_date))[0];
    }
    return null;
  }, [matches, myTeams]);

  // Fallback for slot 3: Final match
  const finalMatch = useMemo(() => {
    return matches.find((m) => m.match_id === "104") || matches[0];
  }, [matches]);

  // Active match currently selected by heroTabIndex
  const activeHeroMatch = useMemo(() => {
    if (heroTabIndex === 0) return hotMatch;
    if (heroTabIndex === 1) return nextMatch;
    return myTeamMatch || finalMatch;
  }, [heroTabIndex, hotMatch, nextMatch, myTeamMatch, finalMatch]);

  // Auto cycle hero banner tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroTabIndex((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
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

      {/* Right Side: Big Premium Dynamic Hero Match Card */}
      <div className="relative z-10 w-full md:w-auto flex flex-col items-center gap-4">
        <div
          className={`relative p-6 sm:p-8 rounded-[24px] border bg-white/5 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center min-w-[280px] sm:min-w-[320px] text-center overflow-hidden group hover:border-white/20 transition-all duration-500 select-none ${
            heroTabIndex === 2 && myTeamMatch
              ? "border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.15)] bg-rose-500/[0.02]"
              : "border-white/10"
          }`}
        >
          {/* Ambient glowing overlays */}
          <div
            className={`absolute inset-0 bg-gradient-to-b via-transparent to-transparent opacity-50 group-hover:scale-110 transition-transform duration-500 ${
              heroTabIndex === 0 ? "from-amber-500/10" : heroTabIndex === 1 ? "from-sky-500/10" : "from-rose-500/10"
            }`}
          />

          <span
            className={`text-[10px] font-black uppercase tracking-widest mb-4 block ${
              heroTabIndex === 0 ? "text-amber-400" : heroTabIndex === 1 ? "text-sky-400" : "text-rose-400"
            }`}
          >
            {heroTabIndex === 0 && "🔥 TRẬN ĐẤU HOT NHẤT 🔥"}
            {heroTabIndex === 1 && "⏳ SẮP DIỄN RA ⏳"}
            {heroTabIndex === 2 && (myTeamMatch ? "❤️ ĐỘI TUYỂN YÊU THÍCH ❤️" : "🏆 CHUNG KẾT TRONG MƠ 🏆")}
          </span>

          {activeHeroMatch ? (
            <div className="w-full space-y-4 relative z-10">
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-black text-white">
                  {activeHeroMatch.local_date.split(" ")[0]}
                </div>
                <p className="text-[10px] text-slate-400 font-extrabold flex items-center justify-center gap-1">
                  <Clock size={10} className="text-secondary" /> {activeHeroMatch.local_date.split(" ")[1]}
                </p>
                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[250px] mx-auto">
                  {activeHeroMatch.stadium_name}
                </p>
              </div>

              <div className="w-16 h-[1.5px] bg-white/15 mx-auto" />

              <div className="flex items-center justify-between gap-3 px-2">
                {/* Home Team */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="relative w-12 h-8 rounded shadow-md overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                    {getFlagUrl(activeHeroMatch.home_team_iso2) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getFlagUrl(activeHeroMatch.home_team_iso2)!}
                        alt={activeHeroMatch.home_team_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Trophy size={14} className="text-secondary/55" />
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-black text-white truncate w-full">
                    {activeHeroMatch.home_team_name}
                  </span>
                </div>

                {/* VS */}
                <span
                  className={`text-xs font-black px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 ${
                    heroTabIndex === 0 ? "text-amber-400" : heroTabIndex === 1 ? "text-sky-400" : "text-rose-400"
                  }`}
                >
                  VS
                </span>

                {/* Away Team */}
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className="relative w-12 h-8 rounded shadow-md overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                    {getFlagUrl(activeHeroMatch.away_team_iso2) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getFlagUrl(activeHeroMatch.away_team_iso2)!}
                        alt={activeHeroMatch.away_team_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Trophy size={14} className="text-secondary/55" />
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs font-black text-white truncate w-full">
                    {activeHeroMatch.away_team_name}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-bold py-6">Đang cập nhật lịch thi đấu...</div>
          )}
        </div>

        {/* Interactive Dynamic Tabs Indicators */}
        <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1 shadow-md">
          {[
            { id: 0, label: "Hot nhất" },
            { id: 1, label: "Cận kề" },
            { id: 2, label: "Yêu thích" },
          ].map((item) => {
            const isActive = heroTabIndex === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setHeroTabIndex(item.id as 0 | 1 | 2)}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? item.id === 0
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                      : item.id === 1
                        ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20"
                        : "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
