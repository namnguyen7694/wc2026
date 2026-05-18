import { parseCSV } from "../utils/csvParser";
import { FALLBACK_CSV } from "../constants/fallbackData";
import ScheduleDashboard from "../components/ScheduleDashboard";
import { Trophy } from "lucide-react";

// In Next.js App Router, we fetch data on the server with revalidation (1 hour)
// conforming to server-hoist-static-io and async-parallel guidelines.
async function getScheduleData() {
  const url = "https://vnexpress.net/the-thao/microservice/wc2026-score?t=1779112205024";
  
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache on server for 1 hour
      headers: {
        "Accept": "text/csv,text/plain,application/csv",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const text = await res.text();
    if (text && text.trim().startsWith('"match_id"')) {
      console.log("Successfully fetched live World Cup 2026 schedule from VNExpress!");
      return parseCSV(text);
    } else {
      throw new Error("Invalid CSV format returned from live API");
    }
  } catch (error) {
    console.warn(
      "Unable to fetch live World Cup 2026 data from VNExpress (Using offline fallback data):",
      error instanceof Error ? error.message : error
    );
    // Silent failover to offline high-grade static data
    return parseCSV(FALLBACK_CSV);
  }
}

export default async function Home() {
  const matches = await getScheduleData();

  return (
    <main className="flex-1 w-full min-h-screen py-6 bg-background text-foreground transition-colors duration-300 selection:bg-secondary/35 selection:text-white">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-secondary/5 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full">
        {matches.length > 0 ? (
          <ScheduleDashboard initialMatches={matches} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-4">
            <Trophy size={48} className="text-rose-500 animate-bounce" />
            <h2 className="text-xl font-extrabold text-rose-400">Lỗi Tải Dữ Liệu</h2>
            <p className="text-sm text-foreground/50 max-w-sm">
              Không thể phân tích cú pháp lịch thi đấu World Cup. Vui lòng kiểm tra lại mã nguồn hoặc thử lại sau.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-8 mt-12 border-t border-white/5 text-[11px] text-slate-500/70 font-semibold tracking-wide uppercase">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 FIFA WORLD CUP SCHEDULE SIMULATOR</p>
          <p>
            Nguồn dữ liệu: <a href="https://vnexpress.net/the-thao/world-cup-2026/lich-thi-dau" target="_blank" rel="noopener noreferrer" className="text-secondary/80 hover:text-secondary hover:underline">VNExpress</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
