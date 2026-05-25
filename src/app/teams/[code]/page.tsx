"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Trophy, Users, Calendar, MapPin, Sparkles } from "lucide-react";
import PremiumToggle from "../../../components/ui/PremiumToggle";
import MatchCard from "../../../components/MatchCard";
import { useMatchStore } from "../../../hooks/useMatchStore";

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

export default function TeamProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const rawCode = resolvedParams.code;
  const code = (rawCode || "").toUpperCase();

  const [isMyTeam, setIsMyTeam] = useState(false);

  // Zustand Store Integration
  const isLoaded = useMatchStore((state) => state.isLoaded);
  const setMatches = useMatchStore((state) => state.setMatches);
  const matchesByTeam = useMatchStore((state) => state.matchesByTeam);

  // Fetch matches fallback if navigated to directly
  useEffect(() => {
    if (!isLoaded) {
      // Dynamic import to keep page lightweight
      Promise.all([
        import("../../../constants/fallbackData"),
        import("../../../utils/csvParser")
      ]).then(([{ FALLBACK_CSV }, { parseCSV }]) => {
        const parsed = parseCSV(FALLBACK_CSV);
        setMatches(parsed);
      }).catch((err) => {
        console.error("Failed to load fallback match data in store:", err);
      });
    }
  }, [isLoaded, setMatches]);

  const teamMatches = matchesByTeam[code.toLowerCase()] || [];

  // Sync "Đội bóng tôi yêu" from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const myTeam = localStorage.getItem("wc2026_my_team") || "";
      setIsMyTeam(myTeam.toUpperCase() === code);
    }
  }, [code]);

  const handleToggleMyTeam = () => {
    if (typeof window !== "undefined") {
      const currentMyTeam = localStorage.getItem("wc2026_my_team") || "";
      if (currentMyTeam.toUpperCase() === code) {
        localStorage.removeItem("wc2026_my_team");
        setIsMyTeam(false);
      } else {
        localStorage.setItem("wc2026_my_team", code);
        setIsMyTeam(true);
      }
      // Broadcast change event to synchronize all cards immediately
      window.dispatchEvent(new Event("wc2026_my_team_changed"));
    }
  };

  const getFlagUrl = (iso2: string) => {
    if (!iso2) return null;
    const lowerCode = iso2.toLowerCase();
    if (lowerCode === "eng") return "https://flagcdn.com/w160/gb-eng.png";
    if (lowerCode === "sco") return "https://flagcdn.com/w160/gb-sct.png";
    return `https://flagcdn.com/w160/${lowerCode}.png`;
  };

  return (
    <main className="flex-1 w-full min-h-screen py-6 bg-background text-foreground transition-colors duration-300 relative selection:bg-secondary/35 selection:text-white">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-secondary/5 blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10 space-y-8">
        {/* Top bar back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-foreground transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> Quay lại Lịch thi đấu
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleMyTeam}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                isMyTeam
                  ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/25 scale-102"
                  : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-foreground hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30"
              }`}
            >
              <Heart size={14} className={isMyTeam ? "fill-white" : ""} />
              {isMyTeam ? "Đội tuyển tôi yêu" : "Đặt làm Đội tuyển tôi yêu"}
            </button>
          </div>
        </div>

        {/* Hero Section of the team */}
        <div className="glass-panel border border-card-border rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="relative w-36 h-24 rounded-2xl shadow-md overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
            {getFlagUrl(code) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getFlagUrl(code)!}
                alt={`Đội tuyển ${code}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Trophy size={40} className="text-secondary/55 animate-bounce" />
            )}
          </div>

          <div className="text-center md:text-left space-y-2 flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                Đội tuyển {code}
              </h1>
              <span className="inline-flex self-center md:self-auto px-3 py-1 rounded-full text-xs font-extrabold bg-primary/10 border border-primary/20 text-primary dark:text-rose-400">
                Mã Quốc gia: #{code}
              </span>
            </div>
            <p className="text-sm text-foreground/50 font-bold max-w-xl">
              Hồ sơ Wiki thông tin chi tiết và danh sách cầu thủ chính thức tham dự chiến dịch FIFA World Cup 2026.
            </p>
          </div>
        </div>

        {/* Tabs Grid Placeholder Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Wiki Profile details */}
          <div className="glass-panel border border-card-border rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-extrabold text-secondary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/5">
              🏆 Thông tin Đội tuyển (Wiki)
            </h3>
            <div className="space-y-3.5 text-xs py-2">
              <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="text-foreground/45 font-bold">Huấn luyện viên</span>
                <span className="font-extrabold text-foreground/95">— (Đang cập nhật)</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="text-foreground/45 font-bold">Thứ hạng FIFA</span>
                <span className="font-extrabold text-foreground/95">— (Sẽ fetch sau)</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="text-foreground/45 font-bold">Liên đoàn bóng đá</span>
                <span className="font-extrabold text-foreground/95">—</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                <span className="text-foreground/45 font-bold">Thành tích tốt nhất</span>
                <span className="font-extrabold text-foreground/95">—</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-foreground/45 font-bold">Bảng đấu World Cup 2026</span>
                <span className="font-extrabold text-secondary">Đang lấy dữ liệu...</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl p-3.5 text-[11px] text-foreground/50 leading-relaxed font-bold">
                ⚠️ <span className="text-secondary">Lưu ý:</span> Toàn bộ hồ sơ của 48 quốc gia sẽ được tự động đồng bộ hóa thông tin và số liệu thực tế từ dữ liệu VNExpress API khi bắt đầu giải đấu chính thức.
              </div>
            </div>
          </div>

          {/* Col 2 & 3: Squad List & Matches schedule placeholders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Squad List Section */}
            <div className="glass-panel border border-card-border rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-extrabold text-secondary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/5">
                <Users size={16} /> Danh sách Cầu thủ (Squad List)
              </h3>
              
              {/* Squad placeholder */}
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-xl">
                <Users size={32} className="text-foreground/30 animate-pulse" />
                <div>
                  <p className="text-xs font-black text-foreground/60 uppercase tracking-widest">Đội hình sơ bộ đang được cập nhật</p>
                  <p className="text-[11px] text-foreground/40 mt-1 max-w-sm px-4">
                    Danh sách chính thức 26 cầu thủ của #{code} tham dự FIFA World Cup 2026 sẽ được tải tự động trong các phiên bản cập nhật tiếp theo.
                  </p>
                </div>
              </div>
            </div>

            {/* Fixtures list for this team */}
            <div className="glass-panel border border-card-border rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-extrabold text-secondary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/5">
                <Calendar size={16} /> Lịch thi đấu sắp diễn ra (Fixtures)
              </h3>

              {teamMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamMatches.map((match) => (
                    <MatchCard key={match.match_id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-xl">
                  <Calendar size={24} className="text-foreground/30" />
                  <p className="text-xs font-black text-foreground/50">Đang tìm kiếm lịch đấu của #{code}...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Theme Toggle (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <PremiumToggle />
      </div>
    </main>
  );
}
