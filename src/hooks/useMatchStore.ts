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

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  allMatches: [],
  matchesByDay: {},
  groups: {},
  matchesByTeam: {},
  isLoaded: false,
  setMatches: (matches: Match[]) => {
    const processedMatches = matches.map((match) => {
      const timestamp = getMatchTimestamp(match.local_date);
      return {
        ...match,
        id: `${timestamp}_${match.match_id}`,
      };
    });

    // Sort all matches chronologically (earliest to latest)
    processedMatches.sort((a, b) => {
      const [tsA, mIdA] = (a.id || "").split("_");
      const [tsB, mIdB] = (b.id || "").split("_");
      const timeDiff = (Number(tsA) || 0) - (Number(tsB) || 0);
      if (timeDiff !== 0) return timeDiff;
      return (Number(mIdA) || 0) - (Number(mIdB) || 0);
    });

    const matchesByDay: Record<string, Match[]> = {};
    const groups: Record<string, Match[]> = {};
    const matchesByTeam: Record<string, Match[]> = {};

    processedMatches.forEach((match) => {
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
      matches: processedMatches,
      allMatches: processedMatches,
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

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        get().setMatches(data);
      } else {
        throw new Error("Invalid JSON format returned from live API");
      }
    } catch (error) {
      console.warn(
        "Unable to fetch enriched live World Cup 2026 data from API proxy, falling back to local CSV:",
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
      const isPlayed = m.status !== "notstarted";
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

    const initialSorted = Object.values(teamsData).sort((a, b) => b.points - a.points);

    // Helper to rank teams that have the same overall points using H2H rules
    const rankTiedTeams = (tiedTeams: GroupTeamStanding[], matches: Match[]): GroupTeamStanding[] => {
      if (tiedTeams.length <= 1) return tiedTeams;

      const teamNames = new Set(tiedTeams.map((t) => t.teamName));
      const h2hMatches = matches.filter(
        (m) =>
          m.status !== "notstarted" &&
          teamNames.has(m.home_team_name) &&
          teamNames.has(m.away_team_name)
      );

      // Initialize H2H stats
      const h2hStats: Record<string, { points: number; gd: number; gs: number }> = {};
      tiedTeams.forEach((t) => {
        h2hStats[t.teamName] = { points: 0, gd: 0, gs: 0 };
      });

      h2hMatches.forEach((m) => {
        const h = m.home_score;
        const a = m.away_score;
        const homeStats = h2hStats[m.home_team_name];
        const awayStats = h2hStats[m.away_team_name];

        if (homeStats && awayStats) {
          homeStats.gs += h;
          homeStats.gd += (h - a);
          awayStats.gs += a;
          awayStats.gd += (a - h);

          if (h > a) {
            homeStats.points += 3;
          } else if (h < a) {
            awayStats.points += 3;
          } else {
            homeStats.points += 1;
            awayStats.points += 1;
          }
        }
      });

      return [...tiedTeams].sort((a, b) => {
        const aStats = h2hStats[a.teamName];
        const bStats = h2hStats[b.teamName];

        if (bStats.points !== aStats.points) return bStats.points - aStats.points;
        if (bStats.gd !== aStats.gd) return bStats.gd - aStats.gd;
        if (bStats.gs !== aStats.gs) return bStats.gs - aStats.gs;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.teamName.localeCompare(b.teamName);
      });
    };

    // Group teams by their points to resolve ties
    const groupsOfTied: Record<number, GroupTeamStanding[]> = {};
    initialSorted.forEach((team) => {
      groupsOfTied[team.points] = groupsOfTied[team.points] || [];
      groupsOfTied[team.points].push(team);
    });

    const finalStandings: GroupTeamStanding[] = [];
    const sortedPointsKeys = Object.keys(groupsOfTied)
      .map(Number)
      .sort((a, b) => b - a);

    sortedPointsKeys.forEach((pts) => {
      const tied = groupsOfTied[pts];
      const ranked = rankTiedTeams(tied, groupMatches);
      finalStandings.push(...ranked);
    });

    return finalStandings;
  },
}));

