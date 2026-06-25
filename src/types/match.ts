export interface Match {
  match_id: string;
  id?: string;
  phase: "group" | "knockout";
  stage_key: string;
  stage_label: string;
  group: string;
  matchday: string;
  local_date: string; // Định dạng DD/MM/YYYY HH:mm
  utc_offset: string;
  stadium_id: string;
  stadium_name: string;
  stadium_city: string;
  stadium_country: string;
  home_team_id: string;
  home_team_name: string;
  home_team_iso2: string;
  home_team_logo: string;
  away_team_id: string;
  away_team_name: string;
  away_team_iso2: string;
  away_team_logo: string;
  home_score: number;
  away_score: number;
  status: string;
  finished: boolean;
  time_elapsed: string;
  home_scorers: string;
  away_scorers: string;
  match_score?: {
    halftime: string | null;
    fulltime: string | null;
  } | null;
}

export interface UserScore {
  home_score: number;
  away_score: number;
}

export interface SimScores {
  [match_id: string]: UserScore;
}

export interface GroupTeamStanding {
  teamName: string;
  teamIso2: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface ApiTeam {
  team_id: number;
  team_name: string;
  team_name_full: string;
  logo: string;
}

export interface ApiMatch {
  fixture_id: number;
  event_timestamp: number;
  status_short: string;
  goals_home_team: number | null;
  goals_away_team: number | null;
  elapsed: number | null;
  away_team: ApiTeam;
  home_team: ApiTeam;
  score?: {
    halftime: string | null;
    fulltime: string | null;
  } | null;
}

export interface ApiResponse {
  code: number;
  data: Record<string, { data: ApiMatch[] }>;
}
