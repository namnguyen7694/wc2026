import { Match } from "../types/match";

/**
 * Parses match local_date and its utc_offset into a standard JavaScript Date object.
 * Format for local_date is "DD/MM/YYYY HH:mm", and utc_offset is typically "UTC+7".
 */
export function getMatchDate(localDate: string, utcOffset: string): Date {
  try {
    if (!localDate) return new Date();
    
    const [dateStr, timeStr] = localDate.split(" ");
    const dateParts = dateStr.split("/");
    const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // YYYY-MM-DD
    
    // Normalize utcOffset from "UTC+7" to "+07:00"
    let offset = "+00:00";
    if (utcOffset) {
      const matchOffset = utcOffset.match(/UTC([+-])(\d+)(?::(\d+))?/i);
      if (matchOffset) {
        const sign = matchOffset[1];
        const hours = matchOffset[2].padStart(2, "0");
        const minutes = (matchOffset[3] || "00").padStart(2, "0");
        offset = `${sign}${hours}:${minutes}`;
      } else if (utcOffset.match(/^[+-]\d{2}:\d{2}$/)) {
        offset = utcOffset;
      }
    }
    
    const isoString = `${formattedDate}T${timeStr}:00${offset}`;
    const parsedDate = new Date(isoString);
    
    if (isNaN(parsedDate.getTime())) {
      // Fallback if parsing ISO string fails
      return new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[0]),
        ...timeStr.split(":").map(Number)
      );
    }
    return parsedDate;
  } catch (err) {
    console.error("Error parsing match date:", err);
    return new Date();
  }
}

/**
 * Generates Google Calendar event link.
 */
export function getGoogleCalendarUrl(match: Match): string {
  const start = getMatchDate(match.local_date, match.utc_offset);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // Standard match duration of 2 hours
  
  const formatUTC = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  
  const dates = `${formatUTC(start)}/${formatUTC(end)}`;
  
  const title = `🏆 ${match.stage_label}${match.group ? ` • Bảng ${match.group}` : ""}: ${match.home_team_name} vs ${match.away_team_name} | World Cup 2026`;
  const location = `${match.stadium_name}, ${match.stadium_city}, ${match.stadium_country}`;
  
  let details = `Trận đấu thuộc ${match.stage_label}${match.group ? ` - Bảng ${match.group}` : ""}.\n`;
  details += `Mã trận đấu: #${match.match_id}\n`;
  details += `Sân vận động: ${match.stadium_name} (${match.stadium_city}, ${match.stadium_country})\n`;
  details += `\nTheo dõi và cập nhật kết quả tại Lịch thi đấu World Cup 2026 Dashboard!`;
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: dates,
    details: details,
    location: location,
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Triggers direct browser download of the standard .ics file for Apple/Outlook.
 */
export function downloadIcsFile(match: Match): void {
  const start = getMatchDate(match.local_date, match.utc_offset);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  
  const formatUTC = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  
  const title = `🏆 ${match.stage_label}${match.group ? ` • Bảng ${match.group}` : ""}: ${match.home_team_name} vs ${match.away_team_name} | World Cup 2026`;
  const location = `${match.stadium_name}, ${match.stadium_city}, ${match.stadium_country}`;
  
  let details = `Trận đấu thuộc ${match.stage_label}${match.group ? ` - Bảng ${match.group}` : ""}.\n`;
  details += `Mã trận đấu: #${match.match_id}\n`;
  details += `Sân vận động: ${match.stadium_name} (${match.stadium_city}, ${match.stadium_country})\n`;
  details += `\nTheo dõi và cập nhật kết quả tại Lịch thi đấu World Cup 2026 Dashboard!`;

  const escapeIcs = (str: string) => {
    return str
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");
  };

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Antigravity WC2026//NONSGML v1.0//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:wc2026-match-${match.match_id}@wc2026.app`,
    `DTSTAMP:${formatUTC(new Date())}`,
    `DTSTART:${formatUTC(start)}`,
    `DTEND:${formatUTC(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    `LOCATION:${escapeIcs(location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  
  const icsContent = icsLines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `worldcup2026_match_${match.match_id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Filters and downloads a bulk .ics file containing multiple matches.
 */
export function downloadMatchesIcsFile(matches: Match[], filterType: "all" | "group" | "knockout"): void {
  try {
    const filteredMatches = matches.filter((match) => {
      if (filterType === "group") return match.phase === "group";
      if (filterType === "knockout") return match.phase === "knockout";
      return true;
    });

    if (filteredMatches.length === 0) return;

    const formatUTC = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const escapeIcs = (str: string) => {
      return str
        .replace(/\\/g, "\\\\")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;")
        .replace(/\n/g, "\\n");
    };

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Antigravity WC2026//NONSGML v1.0//EN",
      "CALSCALE:GREGORIAN",
    ];

    filteredMatches.forEach((match) => {
      const start = getMatchDate(match.local_date, match.utc_offset);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // Standard match duration of 2 hours

      const title = `🏆 ${match.stage_label}${match.group ? ` • Bảng ${match.group}` : ""}: ${match.home_team_name} vs ${match.away_team_name} | World Cup 2026`;
      const location = `${match.stadium_name}, ${match.stadium_city}, ${match.stadium_country}`;

      let details = `Trận đấu thuộc ${match.stage_label}${match.group ? ` - Bảng ${match.group}` : ""}.\n`;
      details += `Mã trận đấu: #${match.match_id}\n`;
      details += `Sân vận động: ${match.stadium_name} (${match.stadium_city}, ${match.stadium_country})\n`;
      details += `\nTheo dõi và cập nhật kết quả tại Lịch thi đấu World Cup 2026 Dashboard!`;

      icsLines.push("BEGIN:VEVENT");
      icsLines.push(`UID:wc2026-match-${match.match_id}@wc2026.app`);
      icsLines.push(`DTSTAMP:${formatUTC(new Date())}`);
      icsLines.push(`DTSTART:${formatUTC(start)}`);
      icsLines.push(`DTEND:${formatUTC(end)}`);
      icsLines.push(`SUMMARY:${escapeIcs(title)}`);
      icsLines.push(`DESCRIPTION:${escapeIcs(details)}`);
      icsLines.push(`LOCATION:${escapeIcs(location)}`);
      icsLines.push("END:VEVENT");
    });

    icsLines.push("END:VCALENDAR");

    const icsContent = icsLines.join("\r\n");
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    let fileName = "worldcup2026_lich_thi_dau_all.ics";
    if (filterType === "group") fileName = "worldcup2026_lich_thi_dau_vong_bang.ics";
    if (filterType === "knockout") fileName = "worldcup2026_lich_thi_dau_knockout.ics";

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error generating bulk calendar file:", err);
  }
}

