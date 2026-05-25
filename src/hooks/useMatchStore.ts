import { create } from "zustand";
import { Match } from "../types/match";
import { parseCSV } from "../utils/csvParser";
import { FALLBACK_CSV } from "../constants/fallbackData";

interface MatchState {
  matches: Match[];
  allMatches: Match[];
  matchesByDay: Record<string, Match[]>;
  groups: Record<string, Match[]>;
  matchesByTeam: Record<string, Match[]>;
  isLoaded: boolean;
  setMatches: (matches: Match[]) => void;
  fetchMatches: () => Promise<void>;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  allMatches: [],
  matchesByDay: {},
  groups: {},
  matchesByTeam: {},
  isLoaded: false,
  setMatches: (matches: Match[]) => {
    const matchesByDay: Record<string, Match[]> = {};
    const groups: Record<string, Match[]> = {};
    const matchesByTeam: Record<string, Match[]> = {};

    matches.forEach((match) => {
      // 1. Group by Day (extracting date string portion YYYY-MM-DD or similar)
      if (match.local_date) {
        const dateStr = match.local_date.split(" ")[0];
        if (!matchesByDay[dateStr]) {
          matchesByDay[dateStr] = [];
        }
        matchesByDay[dateStr].push(match);
      }

      // 2. Group by Group Letter (A - L)
      if (match.phase === "group" && match.group) {
        const groupKey = match.group.toUpperCase();
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(match);
      }

      // 3. Group by Team Code (both Home & Away ISO2 in lowercase)
      if (match.home_team_iso2) {
        const teamKey = match.home_team_iso2.toLowerCase();
        if (!matchesByTeam[teamKey]) {
          matchesByTeam[teamKey] = [];
        }
        // Avoid duplicate matches for same team under corner cases
        if (!matchesByTeam[teamKey].some((m) => m.match_id === match.match_id)) {
          matchesByTeam[teamKey].push(match);
        }
      }
      if (match.away_team_iso2) {
        const teamKey = match.away_team_iso2.toLowerCase();
        if (!matchesByTeam[teamKey]) {
          matchesByTeam[teamKey] = [];
        }
        if (!matchesByTeam[teamKey].some((m) => m.match_id === match.match_id)) {
          matchesByTeam[teamKey].push(match);
        }
      }
    });

    set({
      matches,
      allMatches: matches,
      matchesByDay,
      groups,
      matchesByTeam,
      isLoaded: true,
    });
  },
  fetchMatches: async () => {
    // Avoid double fetching if already successfully loaded
    if (get().isLoaded && get().matches.length > 0) return;

    const url = "https://vnexpress.net/the-thao/microservice/wc2026-score?t=1779112205024";
    try {
      const res = await fetch(url, {
        headers: {
          "Accept": "text/csv,text/plain,application/csv",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const text = await res.text();
      if (text && text.trim().startsWith('"match_id"')) {
        console.log("Successfully fetched live World Cup 2026 schedule from VNExpress via store!");
        get().setMatches(parseCSV(text));
      } else {
        throw new Error("Invalid CSV format returned from live API");
      }
    } catch (error) {
      console.warn(
        "Unable to fetch live World Cup 2026 data from VNExpress (Using offline fallback data):",
        error instanceof Error ? error.message : error
      );
      get().setMatches(parseCSV(FALLBACK_CSV));
    }
  },
}));

