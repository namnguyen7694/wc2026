import { create } from "zustand";
import { Match, GroupTeamStanding } from "../types/match";
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
  getGroupStandings: (group: string) => GroupTeamStanding[];
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

    const url = "/api/matches";
    try {
      const res = await fetch(url);

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
  getGroupStandings: (group: string) => {
    const { matches } = get();
    const groupMatches = matches.filter((m) => m.phase === "group" && m.group?.toUpperCase() === group.toUpperCase());
    const teamsData: Record<string, GroupTeamStanding> = {};

    groupMatches.forEach((m) => {
      if (m.home_team_name) {
        teamsData[m.home_team_name] = teamsData[m.home_team_name] || {
          teamName: m.home_team_name,
          teamIso2: m.home_team_iso2,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        };
      }
      if (m.away_team_name) {
        teamsData[m.away_team_name] = teamsData[m.away_team_name] || {
          teamName: m.away_team_name,
          teamIso2: m.away_team_iso2,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        };
      }
    });

    groupMatches.forEach((m) => {
      const isPlayed = m.finished;
      if (!isPlayed) return;

      const hScore = m.home_score;
      const aScore = m.away_score;

      const homeTeam = teamsData[m.home_team_name];
      const awayTeam = teamsData[m.away_team_name];

      if (homeTeam && awayTeam) {
        homeTeam.played += 1;
        awayTeam.played += 1;

        homeTeam.goalsFor += hScore;
        homeTeam.goalsAgainst += aScore;
        awayTeam.goalsFor += aScore;
        awayTeam.goalsAgainst += hScore;

        if (hScore > aScore) {
          homeTeam.won += 1;
          homeTeam.points += 3;
          awayTeam.lost += 1;
        } else if (hScore < aScore) {
          awayTeam.won += 1;
          awayTeam.points += 3;
          homeTeam.lost += 1;
        } else {
          homeTeam.drawn += 1;
          homeTeam.points += 1;
          awayTeam.drawn += 1;
          awayTeam.points += 1;
        }

        homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
        awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;
      }
    });

    return Object.values(teamsData).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamName.localeCompare(b.teamName);
    });
  },
}));

