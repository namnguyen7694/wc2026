import { Match } from "../types/match";

function translateStageLabel(label: string): string {
  const clean = (label || "").trim().toLowerCase();
  switch (clean) {
    case "vong bang":
      return "Vòng bảng";
    case "vong 1/16":
      return "Vòng 1/16";
    case "vong 1/8":
      return "Vòng 1/8";
    case "tu ket":
      return "Tứ kết";
    case "ban ket":
      return "Bán kết";
    case "tranh hang ba":
      return "Tranh hạng ba";
    case "chung ket":
      return "Chung kết";
    default:
      return label;
  }
}

/**
 * Parses CSV data format into Match objects.
 * All fields are wrapped in double quotes and separated by commas, e.g.:
 * "1","group","group","Vong bang","A","1","12/06/2026 02:00",...
 */
export function parseCSV(csvText: string): Match[] {
  if (!csvText) return [];
  
  const lines = csvText.split(/\r?\n/);
  if (lines.length <= 1) return [];

  // Remove the surrounding double quotes and split headers
  const headers = lines[0].slice(1, -1).split('","');
  const matches: Match[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Splitting by "," is highly reliable as the data source wraps every single cell in quotes.
    // e.g. "value1","value2","value3"
    // By slicing off the first and last quote, we can split perfectly by `","`
    const fields = line.slice(1, -1).split('","');
    if (fields.length < headers.length) continue;

    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      const val = fields[index];
      record[header] = val === "null" ? "" : val;
    });

    const match: Match = {
      match_id: record.match_id || "",
      phase: record.phase === "knockout" ? "knockout" : "group",
      stage_key: record.stage_key || "",
      stage_label: translateStageLabel(record.stage_label || ""),
      group: record.group || "",
      matchday: record.matchday || "",
      local_date: record.local_date || "",
      utc_offset: record.utc_offset || "",
      stadium_id: record.stadium_id || "",
      stadium_name: record.stadium_name || "",
      stadium_city: record.stadium_city || "",
      stadium_country: record.stadium_country || "",
      home_team_id: record.home_team_id || "",
      home_team_name: record.home_team_name || "",
      home_team_iso2: record.home_team_iso2 || "",
      away_team_id: record.away_team_id || "",
      away_team_name: record.away_team_name || "",
      away_team_iso2: record.away_team_iso2 || "",
      home_score: parseInt(record.home_score, 10) || 0,
      away_score: parseInt(record.away_score, 10) || 0,
      status: record.status || "notstarted",
      finished: record.finished === "TRUE",
      time_elapsed: record.time_elapsed || "",
      home_scorers: record.home_scorers || "",
      away_scorers: record.away_scorers || "",
    };

    matches.push(match);
  }

  return matches;
}
