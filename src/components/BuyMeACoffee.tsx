"use client";

import { useEffect, useState } from "react";
import { Coffee, X } from "lucide-react";
import { useMatchStore } from "../hooks/useMatchStore";
import { Match } from "../types/match";
import { sendTelegramMessage } from "../utils/telegram";

const getMatchTimestamp = (localDate?: string): number => {
  if (!localDate) return 0;
  try {
    const [dateStr, timeStr] = localDate.split(" ");
    if (!dateStr || !timeStr) return 0;
    const [day, month, year] = dateStr.split("/");
    const [hours, minutes] = timeStr.split(":");
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes)).getTime();
  } catch {
    return 0;
  }
};

export default function BuyMeACoffee() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasClosed, setHasClosed] = useState(false);
  const [winningTeam, setWinningTeam] = useState("");
  const matches = useMatchStore((state) => state.matches);
  const [content, setContent] = useState({
    title: "Buy me a coffee ☕",
    subtitle: "Ủng hộ tác giả duy trì dự án nhé!",
  });

  useEffect(() => {
    // Check if the user has already closed the badge in the current session
    if (typeof window !== "undefined") {
      const isHidden = sessionStorage.getItem("wc2026_bmac_hidden");
      if (isHidden === "true") {
        setHasClosed(true);
        return;
      }
    }

    // Set a timer to show the badge after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (matches.length === 0) return;

    // Load user's favorite teams
    let myTeams: string[] = [];
    try {
      const stored = localStorage.getItem("wc2026_my_teams");
      if (stored) {
        myTeams = JSON.parse(stored).map((t: string) => t.toUpperCase());
      }
    } catch {}

    const finishedMatches = [...matches]
      .filter((m) => m.finished)
      .sort((a, b) => getMatchTimestamp(b.local_date) - getMatchTimestamp(a.local_date));

    if (finishedMatches.length === 0) return;

    const getWinner = (m: Match): "home" | "away" | null => {
      if (m.home_score > m.away_score) return "home";
      if (m.away_score > m.home_score) return "away";

      // If draw, check penalties
      if (m.match_score?.penalty) {
        const parts = m.match_score.penalty.split("-").map((p) => parseInt(p.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          if (parts[0] > parts[1]) return "home";
          if (parts[1] > parts[0]) return "away";
        }
      }

      // Check extra time score (fallback)
      if (m.match_score?.extratime) {
        const parts = m.match_score.extratime.split("-").map((p) => parseInt(p.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          if (parts[0] > parts[1]) return "home";
          if (parts[1] > parts[0]) return "away";
        }
      }

      return null;
    };

    let winningTeamName = "";

    // 1. Try to find a match where the user's favorite team won (must be within the last 24 hours)
    if (myTeams.length > 0) {
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const nowMs = Date.now();

      for (const match of finishedMatches) {
        const matchTime = getMatchTimestamp(match.local_date);
        // Skip matches played more than 24 hours ago
        if (nowMs - matchTime > oneDayInMs) {
          continue;
        }

        const homeIso = match.home_team_iso2?.toUpperCase();
        const awayIso = match.away_team_iso2?.toUpperCase();

        const winner = getWinner(match);
        if (winner === "home" && myTeams.includes(homeIso)) {
          winningTeamName = match.home_team_name;
          break;
        }
        if (winner === "away" && myTeams.includes(awayIso)) {
          winningTeamName = match.away_team_name;
          break;
        }
      }
    }

    // 2. If no favorite team win found, get the winner of the most recent finished match overall
    if (!winningTeamName) {
      const latestMatch = finishedMatches[0];
      const winner = getWinner(latestMatch);
      if (winner === "home") {
        winningTeamName = latestMatch.home_team_name;
      } else if (winner === "away") {
        winningTeamName = latestMatch.away_team_name;
      }
    }

    if (winningTeamName) {
      setWinningTeam(winningTeamName);
      setContent({
        title: `Chúc mừng ${winningTeamName} vừa chiến thắng! 🎉`,
        subtitle: "Ủng hộ tác giả một ly cà phê duy trì dự án nhé! ☕",
      });
    }
  }, [matches]);

  const handleClose = () => {
    setIsVisible(false);
    setHasClosed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("wc2026_bmac_hidden", "true");
    }
  };

  if (hasClosed || !isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-slide-up">
      <div className="relative flex items-center gap-3 pl-4 pr-12 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none max-w-sm transition-all duration-300 hover:scale-105">
        {/* Coffee Icon Indicator */}
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Coffee size={20} className="animate-bounce" />
        </div>

        {/* Text Details */}
        <div className="flex flex-col pr-2">
          <span className="text-xs font-black text-slate-800 dark:text-slate-100">{content.title}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{content.subtitle}</span>
        </div>

        {/* Action Link overlaying the content */}
        <a
          href="https://me.momo.vn/laixehub" // You can change this to your actual link
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            sendTelegramMessage(winningTeam).catch((err) => {
              console.error("Error sending Telegram notification:", err);
            });
          }}
          className="absolute inset-0 rounded-2xl cursor-pointer"
          title="Buy me a coffee"
        />

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            sendTelegramMessage("dismiss").catch((err) => {
              console.error("Error sending Telegram dismiss notification:", err);
            });
            handleClose();
          }}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all z-10 cursor-pointer"
          aria-label="Đóng"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
