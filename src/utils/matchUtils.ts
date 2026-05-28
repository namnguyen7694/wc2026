import { Match, GroupTeamStanding } from "../types/match";

/**
 * Retrieves a match by numeric ID from the provided map, or generates
 * a standard knockout stage fallback Match placeholder if not found.
 */
export function getMatchOrFallback(
  matchesMap: Map<string, Match>,
  id: number,
  stageKey: string,
  stageLabel: string,
  homeTeamName: string,
  awayTeamName: string,
): Match {
  const matchId = String(id);
  return (
    matchesMap.get(matchId) ||
    ({
      match_id: matchId,
      stage_key: stageKey,
      stage_label: stageLabel,
      phase: "knockout",
      group: "",
      local_date: "",
      home_team_name: homeTeamName,
      away_team_name: awayTeamName,
      home_team_iso2: "",
      away_team_iso2: "",
      home_score: 0,
      away_score: 0,
      status: "notstarted",
      stadium_name: "",
      stadium_city: "",
      stadium_country: "",
      home_scorers: "",
      away_scorers: "",
    } as unknown as Match)
  );
}

export // Recursively resolve placeholders (e.g. W74, L101, 1A, 2B) into actual team names and ISO2s
function resolveTeam(
  placeholder: string,
  matchesMap: Map<string, Match>,
  getGroupStandings?: (group: string) => GroupTeamStanding[],
): { name: string; iso2: string } {
  if (!placeholder) return { name: "", iso2: "" };

  // 1. Resolve group standing placeholders like "1A", "2B", etc.
  const groupMatch = placeholder.match(/^([12])([A-L])$/i);
  if (groupMatch && getGroupStandings) {
    const rank = parseInt(groupMatch[1], 10);
    const groupLetter = groupMatch[2].toUpperCase();
    try {
      const standings = getGroupStandings(groupLetter);
      // Only resolve if every team in this group has completed all 3 matches
      const isGroupComplete = standings.length > 0 && standings.every((t) => t.played === 3);
      if (isGroupComplete) {
        const team = standings[rank - 1];
        if (team) {
          return {
            name: team.teamName,
            iso2: team.teamIso2.toUpperCase(),
          };
        }
      }
    } catch (err) {
      console.warn(`Failed to resolve group standing placeholder ${placeholder}:`, err);
    }
  }

  // 2. Resolve knockout winner/loser placeholders like "W74", "L101"
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

  const homeTeamResolved = resolveTeam(refMatch.home_team_name, matchesMap, getGroupStandings);
  const awayTeamResolved = resolveTeam(refMatch.away_team_name, matchesMap, getGroupStandings);

  const homeWins = hScore >= aScore;

  if (matchWinner) {
    return homeWins ? homeTeamResolved : awayTeamResolved;
  } else {
    return homeWins ? awayTeamResolved : homeTeamResolved;
  }
}
