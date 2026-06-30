import { NextResponse } from "next/server";
import { parseCSV } from "../../../utils/csvParser";
import { getMatchDate } from "../../../utils/calendarUtils";
import { FALLBACK_CSV } from "../../../constants/fallbackData";
import { ApiMatch, ApiTeam, ApiResponse } from "../../../types/match";

export const dynamic = "force-dynamic";

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
  const isUsaApi =
    normApiShort === "usa" ||
    normApiFull === "usa" ||
    normApiShort === "unitedstates" ||
    normApiFull === "unitedstates";
  if (isUsaLocal && isUsaApi) return true;

  // South Korea / Republic of Korea / Korea Republic handling
  const isKoreaLocal =
    normLocal === "southkorea" ||
    normLocal === "republicofkorea" ||
    normLocal === "korearepublic" ||
    normLocal === "hanquoc";
  const isKoreaApi =
    normApiShort === "southkorea" ||
    normApiFull === "southkorea" ||
    normApiShort === "republicofkorea" ||
    normApiFull === "republicofkorea" ||
    normApiShort === "korearepublic" ||
    normApiFull === "korearepublic";
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
  const now = new Date();

  // Format current time precisely in Asia/Ho_Chi_Minh timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const vnHour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const vnMinute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const vnSecond = parseInt(parts.find((p) => p.type === "second")?.value || "0", 10);

  // From 13h to 22h, no matches are played.
  // We cache for up to 1 hour (3600s), but ensure it expires exactly at 22:00:00 VN time
  let revalidateVal = 60;
  if (vnHour >= 13 && vnHour < 22) {
    const secondsRemaining = (22 - vnHour) * 3600 - vnMinute * 60 - vnSecond;
    revalidateVal = Math.min(3600, Math.max(60, secondsRemaining));
  }

  const vnTimeStr = now.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  console.log(`revalidateVal: ${revalidateVal} for VN Time: ${vnTimeStr}, VN hour: ${vnHour}`);

  const jsonUrl = "https://gw.vnexpress.net/football/fixture?league_id=1";

  try {
    const matches = parseCSV(FALLBACK_CSV);

    // 2. Fetch live JSON fixtures
    let apiMatches: ApiMatch[] = [];
    try {
      const jsonRes = await fetch(jsonUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: revalidateVal },
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

    // 3. Map & Enrich Matches
    if (apiMatches.length > 0) {
      matches.forEach((match) => {
        const matchTimeMs = getMatchDate(match.local_date, match.utc_offset).getTime();

        // Find candidates by timestamp
        const candidates = apiMatches.filter((apiM) => apiM.event_timestamp * 1000 === matchTimeMs);
        let matchedApi = null;
        if (candidates.length === 1) {
          matchedApi = candidates[0];
        } else if (candidates.length > 1) {
          matchedApi = candidates.find((apiM) => matchName(match.away_team_name, apiM.away_team));
        }

        if (matchedApi) {
          // Enrich home & away team info
          if (matchedApi.home_team) {
            match.home_team_name = matchedApi.home_team.team_name || match.home_team_name;
            match.home_team_logo = matchedApi.home_team.logo;
            if (matchedApi.home_team.team_id) {
              match.home_team_id = String(matchedApi.home_team.team_id);
            }
          }
          if (matchedApi.away_team) {
            match.away_team_name = matchedApi.away_team.team_name || match.away_team_name;
            match.away_team_logo = matchedApi.away_team.logo;
            if (matchedApi.away_team.team_id) {
              match.away_team_id = String(matchedApi.away_team.team_id);
            }
          }

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
              extratime: matchedApi.score.extratime || null,
              penalty: matchedApi.score.penalty || null,
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
      });
    }

    // 4. Return as JSON
    return NextResponse.json(matches, {
      status: 200,
      headers: {
        "Cache-Control": `public, s-maxage=${revalidateVal}, stale-while-revalidate=${revalidateVal / 2}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}
