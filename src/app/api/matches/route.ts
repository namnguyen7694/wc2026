import { NextResponse } from "next/server";
import { parseCSV } from "../../../utils/csvParser";
import { getMatchDate } from "../../../utils/calendarUtils";

export const dynamic = "force-dynamic";

interface ApiTeam {
  team_id: number;
  team_name: string;
  team_name_full: string;
  logo: string;
}

interface ApiMatch {
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

interface ApiResponse {
  code: number;
  data: Record<string, { data: ApiMatch[] }>;
}

const normalizeName = (name?: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

const matchName = (localName: string, apiAwayTeam: ApiTeam | undefined): boolean => {
  const normLocal = normalizeName(localName);
  const normApiShort = normalizeName(apiAwayTeam?.team_name);
  const normApiFull = normalizeName(apiAwayTeam?.team_name_full);
  
  // USA / United States handling
  const isUsaLocal = normLocal === "unitedstates" || normLocal === "usa" || normLocal === "my";
  const isUsaApi = normApiShort === "usa" || normApiFull === "usa" || normApiShort === "unitedstates" || normApiFull === "unitedstates";
  if (isUsaLocal && isUsaApi) return true;

  // South Korea / Republic of Korea / Korea Republic handling
  const isKoreaLocal = normLocal === "southkorea" || normLocal === "republicofkorea" || normLocal === "korearepublic" || normLocal === "hanquoc";
  const isKoreaApi = normApiShort === "southkorea" || normApiFull === "southkorea" || normApiShort === "republicofkorea" || normApiFull === "republicofkorea" || normApiShort === "korearepublic" || normApiFull === "korearepublic";
  if (isKoreaLocal && isKoreaApi) return true;

  return (
    normLocal === normApiFull ||
    normLocal === normApiShort ||
    normLocal.includes(normApiFull) ||
    normLocal.includes(normApiShort) ||
    normApiFull.includes(normLocal) ||
    normApiShort.includes(normLocal)
  );
};

export async function GET() {
  const csvUrl = "https://vnexpress.net/the-thao/microservice/wc2026-score?t=" + Date.now();
  const jsonUrl = "https://gw.vnexpress.net/football/fixture?league_id=1";

  try {
    // 1. Fetch CSV Schedule
    const csvRes = await fetch(csvUrl, {
      headers: {
        "Accept": "text/csv,text/plain,application/csv",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 60 },
    });

    if (!csvRes.ok) {
      throw new Error(`Failed to fetch CSV schedule: ${csvRes.status}`);
    }

    const csvText = await csvRes.text();
    const matches = parseCSV(csvText);

    // 2. Fetch live JSON fixtures
    let apiMatches: ApiMatch[] = [];
    try {
      const jsonRes = await fetch(jsonUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 60 },
      });

      if (jsonRes.ok) {
        const json = (await jsonRes.json()) as ApiResponse;
        if (json && json.data) {
          for (const key of Object.keys(json.data)) {
            const item = json.data[key];
            if (item && Array.isArray(item.data)) {
              apiMatches = item.data;
              break;
            }
          }
        }
      }
    } catch (err) {
      console.warn("Unable to fetch live JSON fixtures from VnExpress Gateway:", err);
    }

    // 3. Map & Enrich Group Stage Matches
    if (apiMatches.length > 0) {
      matches.forEach((match) => {
        if (match.phase === "group") {
          const matchTimeMs = getMatchDate(match.local_date, match.utc_offset).getTime();
          
          // Find candidates by timestamp
          const candidates = apiMatches.filter(apiM => apiM.event_timestamp * 1000 === matchTimeMs);
          let matchedApi = null;
          if (candidates.length === 1) {
            matchedApi = candidates[0];
          } else if (candidates.length > 1) {
            matchedApi = candidates.find(apiM => matchName(match.away_team_name, apiM.away_team));
          }

          if (matchedApi) {
            // Enrich score
            if (typeof matchedApi.goals_home_team === "number" && !isNaN(matchedApi.goals_home_team)) {
              match.home_score = matchedApi.goals_home_team;
            }
            if (typeof matchedApi.goals_away_team === "number" && !isNaN(matchedApi.goals_away_team)) {
              match.away_score = matchedApi.goals_away_team;
            }
            
            // Enrich detailed match score
            if (matchedApi.score) {
              match.match_score = {
                halftime: matchedApi.score.halftime || null,
                fulltime: matchedApi.score.fulltime || null,
              };
            }
            
            // Enrich status
            const apiStatus = (matchedApi.status_short || "").toUpperCase();
            if (apiStatus === "FT" || apiStatus === "AET" || apiStatus === "PEN") {
              match.status = "finished";
              match.finished = true;
            } else if (apiStatus === "NS") {
              match.status = "notstarted";
              match.finished = false;
            } else if (apiStatus) {
              match.status = apiStatus.toLowerCase();
              match.finished = false;
            }
            
            // Enrich time elapsed
            if (matchedApi.elapsed) {
              match.time_elapsed = String(matchedApi.elapsed);
            }
          }
        }
      });
    }

    // 4. Return as JSON
    return NextResponse.json(matches, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
