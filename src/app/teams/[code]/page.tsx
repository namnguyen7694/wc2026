"use client";

import React, { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Trophy, Users, Calendar, Info, Search, Shield, Award, Sparkles, Clock, Globe } from "lucide-react";
import PremiumToggle from "../../../components/ui/PremiumToggle";
import MatchCard from "../../../components/MatchCard";
import { useMatchStore } from "../../../hooks/useMatchStore";
import { TEAM_WIKI_MAP, generateSquadForTeam } from "../../../constants/teamWikiData";

interface PageProps {
  params: Promise<{
    code: string;
  }>;
}

const SECTION_CONFIGS = {
  GK: { title: "Thủ môn (Goalkeepers)", bulletBg: "bg-slate-500", posBg: "bg-slate-500/10 text-slate-500 border-slate-500/25" },
  DF: { title: "Hậu vệ (Defenders)", bulletBg: "bg-blue-500", posBg: "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20" },
  MF: { title: "Tiền vệ (Midfielders)", bulletBg: "bg-emerald-500", posBg: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20" },
  FW: { title: "Tiền đạo (Forwards)", bulletBg: "bg-rose-500", posBg: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20" }
} as const;

export default function TeamProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const rawCode = resolvedParams.code;
  const code = (rawCode || "").toUpperCase();

  const [isMyTeam, setIsMyTeam] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "squad" | "fixtures">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [positionFilter, setPositionFilter] = useState<"ALL" | "GK" | "DF" | "MF" | "FW">("ALL");

  // Zustand Store Integration
  const isLoaded = useMatchStore((state) => state.isLoaded);
  const fetchMatches = useMatchStore((state) => state.fetchMatches);
  const matchesByTeam = useMatchStore((state) => state.matchesByTeam);

  // Fetch matches fallback if navigated to directly
  useEffect(() => {
    if (!isLoaded) {
      fetchMatches();
    }
  }, [isLoaded, fetchMatches]);

  const teamMatches = useMemo(() => {
    return matchesByTeam[code.toLowerCase()] || [];
  }, [matchesByTeam, code]);

  // Resolve actual country name and group dynamically from matches
  const teamName = useMemo(() => {
    const match = teamMatches.find(
      (m) => m.home_team_iso2?.toUpperCase() === code || m.away_team_iso2?.toUpperCase() === code,
    );
    if (match) {
      return match.home_team_iso2?.toUpperCase() === code ? match.home_team_name : match.away_team_name;
    }
    // Fallback names for known codes if not yet loaded in matches
    const nameMap: Record<string, string> = {
      MX: "Mexico", ZA: "Nam Phi", KR: "Hàn Quốc", CZ: "Cộng hòa Séc",
      CA: "Canada", BA: "Bosnia-Herzegovina", QA: "Qatar", CH: "Thụy Sĩ",
      BR: "Brazil", MA: "Maroc", HT: "Haiti", SCO: "Scotland",
      US: "Hoa Kỳ", PY: "Paraguay", AU: "Úc", TR: "Thổ Nhĩ Kỳ",
      DE: "Đức", CW: "Curaçao", CI: "Bờ Biển Ngà", EC: "Ecuador",
      NL: "Hà Lan", JP: "Nhật Bản", SE: "Thụy Điển", TN: "Tunisia",
      BE: "Bỉ", EG: "Ai Cập", IR: "Iran", NZ: "New Zealand",
      ES: "Tây Ban Nha", CV: "Cape Verde", SA: "Ả Rập Xê Út", UY: "Uruguay",
      FR: "Pháp", SN: "Senegal", IQ: "Iraq", NO: "Na Uy",
      AR: "Argentina", DZ: "Algeria", AT: "Áo", JO: "Jordan",
      PT: "Bồ Đào Nha", CD: "Cộng hòa Dân chủ Congo", UZ: "Uzbekistan", CO: "Colombia",
      ENG: "Anh", HR: "Croatia", GH: "Ghana", PA: "Panama"
    };
    return nameMap[code] || code;
  }, [teamMatches, code]);

  const teamGroup = useMemo(() => {
    const match = teamMatches.find((m) => m.phase === "group" && m.group);
    return match ? match.group.toUpperCase() : "";
  }, [teamMatches]);

  // Sync favorited team from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        let teamsList: string[] = [];
        const stored = localStorage.getItem("wc2026_my_teams");
        if (stored) {
          teamsList = JSON.parse(stored);
        } else {
          const single = localStorage.getItem("wc2026_my_team") || "";
          if (single) {
            teamsList = [single.toUpperCase()];
            localStorage.setItem("wc2026_my_teams", JSON.stringify(teamsList));
          }
        }
        setIsMyTeam(teamsList.includes(code));
      } catch (err) {
        console.error("Error loading favorite teams:", err);
      }
    }
  }, [code]);

  const handleToggleMyTeam = () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("wc2026_my_teams");
        let teamsList: string[] = stored ? JSON.parse(stored) : [];

        if (teamsList.includes(code)) {
          teamsList = teamsList.filter((c) => c !== code);
          setIsMyTeam(false);
        } else {
          teamsList = [...teamsList, code];
          setIsMyTeam(true);
        }

        localStorage.setItem("wc2026_my_teams", JSON.stringify(teamsList));

        if (teamsList.length > 0) {
          localStorage.setItem("wc2026_my_team", teamsList[0]);
        } else {
          localStorage.removeItem("wc2026_my_team");
        }

        window.dispatchEvent(new Event("wc2026_my_teams_changed"));
        window.dispatchEvent(new Event("wc2026_my_team_changed"));
      } catch (err) {
        console.error("Error toggling favorite team:", err);
      }
    }
  };

  const getFlagUrl = (iso2: string) => {
    if (!iso2) return null;
    const lowerCode = iso2.toLowerCase();
    if (lowerCode === "eng") return "https://flagcdn.com/w160/gb-eng.png";
    if (lowerCode === "sco") return "https://flagcdn.com/w160/gb-sct.png";
    return `https://flagcdn.com/w160/${lowerCode}.png`;
  };

  // Get Wiki metadata and generate high-fidelity squad list
  const wikiInfo = useMemo(() => {
    return TEAM_WIKI_MAP[code] || {
      coach: "Đang cập nhật",
      fifaRanking: 99,
      federation: "Đang cập nhật",
      bestResult: "Đang cập nhật",
      description: `Đội tuyển quốc gia ${teamName} đang tích cực chuẩn bị cho chiến dịch lịch sử tại VCK FIFA World Cup 2026. Hồ sơ đội hình và dữ liệu chi tiết sẽ được tự động đồng bộ hóa.`,
      achievements: []
    };
  }, [code, teamName]);

  const teamSquad = useMemo(() => {
    return generateSquadForTeam(code);
  }, [code]);

  const filteredSquad = useMemo(() => {
    return teamSquad.filter((player) => {
      const matchesSearch =
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.club.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPosition = positionFilter === "ALL" || player.position === positionFilter;
      return matchesSearch && matchesPosition;
    });
  }, [teamSquad, searchQuery, positionFilter]);

  const squadByPosition = useMemo(() => {
    const gk = filteredSquad.filter((p) => p.position === "GK");
    const df = filteredSquad.filter((p) => p.position === "DF");
    const mf = filteredSquad.filter((p) => p.position === "MF");
    const fw = filteredSquad.filter((p) => p.position === "FW");
    return [
      { key: "GK", title: "Thủ môn (Goalkeepers)", players: gk },
      { key: "DF", title: "Hậu vệ (Defenders)", players: df },
      { key: "MF", title: "Tiền vệ (Midfielders)", players: mf },
      { key: "FW", title: "Tiền đạo (Forwards)", players: fw }
    ];
  }, [filteredSquad]);

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

        {/* Hero Section */}
        <div className="glass-panel border border-card-border rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
            <Trophy size={180} className="text-secondary" />
          </div>

          <div className="relative w-36 h-24 rounded-2xl shadow-md overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
            {getFlagUrl(code) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getFlagUrl(code)!}
                alt={`Đội tuyển ${teamName}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <Trophy size={40} className="text-secondary/55 animate-bounce" />
            )}
          </div>

          <div className="text-center md:text-left space-y-2.5 flex-1 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 justify-center md:justify-start">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                Đội tuyển {teamName}
              </h1>
              <span className="inline-flex self-center md:self-auto px-3 py-1 rounded-full text-xs font-extrabold bg-primary/10 border border-primary/20 text-primary dark:text-rose-400">
                Mã Quốc gia: #{code}
              </span>
              {teamGroup && (
                <span className="inline-flex self-center md:self-auto px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  Bảng {teamGroup}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground/60 font-medium max-w-2xl leading-relaxed">
              Hồ sơ thông tin chi tiết, lịch sử cúp thế giới và danh sách cầu thủ chính thức được đăng ký cho chiến dịch FIFA World Cup 2026.
            </p>
          </div>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="glass-panel border border-card-border rounded-2xl p-2 shadow-md">
          <div className="flex flex-wrap border-b border-card-border/30 gap-1 pb-1">
            <button
              id="tab-overview-btn"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "overview"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-foreground/50 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Info size={15} /> Tổng quan & Wiki
            </button>
            <button
              id="tab-squad-btn"
              onClick={() => setActiveTab("squad")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "squad"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-foreground/50 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Users size={15} /> Đội hình tuyển thủ
            </button>
            <button
              id="tab-fixtures-btn"
              onClick={() => setActiveTab("fixtures")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "fixtures"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-foreground/50 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <Calendar size={15} /> Lịch đấu giải đấu
            </button>
          </div>
        </div>

        {/* Tab Content Rendering */}
        <div className="animate-slide-up">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Key Stats & Coach Card */}
              <div className="space-y-6">
                {/* Coach Profile Card */}
                <div className="glass-panel border border-card-border rounded-2xl p-5 shadow-lg relative overflow-hidden bg-gradient-to-br from-card-bg to-primary/5">
                  <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />
                  <h3 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-card-border/50">
                    <Users size={14} className="text-secondary" /> Huấn luyện viên trưởng
                  </h3>
                  <div className="pt-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary dark:text-rose-400 font-extrabold text-lg shadow-inner">
                      {wikiInfo.coach.split(" ").pop()?.[0] || "HLV"}
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-foreground">{wikiInfo.coach}</h4>
                      <p className="text-xs text-foreground/45 font-bold">Thuyền trưởng chính thức</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed font-bold mt-4 pt-3 border-t border-card-border/20">
                    Chịu trách nhiệm tối cao trong việc xây dựng lối chơi, lên sơ đồ chiến thuật và tuyển chọn danh sách 26 cầu thủ tham gia chiến dịch Cup Thế giới 2026.
                  </p>
                </div>

                {/* Team Wiki Specs Panel */}
                <div className="glass-panel border border-card-border rounded-2xl p-5 shadow-lg space-y-4">
                  <h3 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-card-border/50">
                    <Shield size={14} /> Thông số Wiki Đội tuyển
                  </h3>
                  <div className="space-y-3.5 text-xs py-2">
                    <div className="flex justify-between border-b border-card-border/30 pb-2">
                      <span className="text-foreground/45 font-bold flex items-center gap-1.5"><Globe size={12} /> Liên đoàn</span>
                      <span className="font-extrabold text-foreground/95 text-right">{wikiInfo.federation}</span>
                    </div>
                    <div className="flex justify-between border-b border-card-border/30 pb-2">
                      <span className="text-foreground/45 font-bold flex items-center gap-1.5"><Award size={12} /> Thứ hạng FIFA</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 font-black text-emerald-600 dark:text-emerald-400">
                        #{wikiInfo.fifaRanking}
                      </span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-foreground/45 font-bold flex items-center gap-1.5"><Trophy size={12} /> Thành tích tốt nhất</span>
                      <span className="font-black text-primary dark:text-rose-400 text-right">{wikiInfo.bestResult}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl p-3.5 text-[11px] text-foreground/50 leading-relaxed font-bold">
                      ⚠️ <span className="text-secondary">Lưu ý:</span> Hồ sơ của các quốc gia được lấy từ dữ liệu hệ thống khi giải đấu khởi tranh để cung cấp trải nghiệm tuyệt vời nhất.
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Columns: Description & World Cup History */}
              <div className="lg:col-span-2 space-y-6">
                {/* Introduction details */}
                <div className="glass-panel border border-card-border rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
                  <h3 className="text-sm font-black text-foreground flex items-center gap-2 pb-2 border-b border-card-border/50">
                    <Sparkles size={16} className="text-secondary" /> Tổng quan về Đội bóng
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed font-bold">
                    {wikiInfo.description}
                  </p>
                </div>

                {/* Historic Achievements Timeline */}
                <div className="glass-panel border border-card-border rounded-2xl p-5 sm:p-6 shadow-lg space-y-5">
                  <h3 className="text-sm font-black text-foreground flex items-center gap-2 pb-2 border-b border-card-border/50">
                    <Clock size={16} className="text-secondary" /> Lịch sử & Thành tích qua các kỳ World Cup
                  </h3>

                  {wikiInfo.achievements.length > 0 ? (
                    <div className="relative border-l-2 border-primary/20 ml-2.5 pl-6 space-y-6 py-2">
                      {wikiInfo.achievements.map((item, idx) => (
                        <div key={idx} className="relative group">
                          {/* Dot Marker */}
                          <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-primary bg-background shadow-md shadow-primary/20 group-hover:scale-120 transition-all" />
                          <div className="space-y-1.5">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 font-black text-[10px] text-primary dark:text-rose-400">
                              Năm {item.year}
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <h4 className="text-xs sm:text-sm font-extrabold text-foreground/90">
                                Chủ nhà: {item.host}
                              </h4>
                              <span className="text-xs font-black text-secondary flex items-center gap-1">
                                <Trophy size={11} className="fill-secondary/20" /> {item.result}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Newcomer Spotlight Layout for first-time nations
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4 bg-amber-500/[0.02] border border-amber-500/10 rounded-xl p-6">
                      <Trophy size={40} className="text-secondary animate-bounce" />
                      <div className="space-y-2">
                        <h4 className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          Chào đón Tân binh lịch sử!
                        </h4>
                        <p className="text-xs text-foreground/60 max-w-md font-bold leading-relaxed">
                          Đây là lần đầu tiên trong lịch sử bóng đá quốc gia, đại diện này giành quyền góp mặt tại một vòng chung kết cúp thế giới. World Cup 2026 sẽ là cột mốc lịch sử vĩ đại của họ!
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "squad" && (
            <div className="space-y-6">
              {/* Search & Filters Controller */}
              <div className="glass-panel border border-card-border rounded-2xl p-4 shadow-md space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  {/* Search input container */}
                  <div className="relative w-full md:max-w-xs">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-foreground/35">
                      <Search size={16} />
                    </span>
                    <input
                      id="player-search-input"
                      type="text"
                      placeholder="Tìm cầu thủ, số áo, clb..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 transition-all"
                    />
                  </div>

                  {/* Position Filter Pills */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {(["ALL", "GK", "DF", "MF", "FW"] as const).map((pos) => {
                      const posLabel =
                        pos === "ALL"
                          ? `Tất cả (${teamSquad.length})`
                          : pos === "GK"
                          ? "Thủ môn"
                          : pos === "DF"
                          ? "Hậu vệ"
                          : pos === "MF"
                          ? "Tiền vệ"
                          : "Tiền đạo";
                      return (
                        <button
                          key={pos}
                          onClick={() => setPositionFilter(pos)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            positionFilter === pos
                              ? "bg-primary text-white shadow-sm shadow-primary/20 scale-102"
                              : "bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-foreground/60 hover:bg-slate-200 dark:hover:bg-white/10"
                          }`}
                        >
                          {posLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Player Cards Grid by Position Section */}
              {filteredSquad.length > 0 ? (
                <div className="space-y-10">
                  {squadByPosition.map((section) => {
                    if (section.players.length === 0) return null;
                    const config = SECTION_CONFIGS[section.key as keyof typeof SECTION_CONFIGS];

                    return (
                      <div key={section.key} className="space-y-4 animate-slide-up">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-card-border/30">
                          <span className={`w-3 h-3 rounded-full ${config.bulletBg} shadow-sm`} />
                          <h3 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wider">
                            {config.title} ({section.players.length})
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                          {section.players.map((player) => {
                            return (
                              <div
                                key={player.name}
                                className="glass-panel border border-card-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-md relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 group"
                              >
                                {/* Faded Large Position Background */}
                                <div className="absolute -bottom-6 -right-6 text-7xl font-black text-foreground/5 opacity-[0.03] select-none pointer-events-none group-hover:scale-110 transition-transform duration-300">
                                  {player.position}
                                </div>

                                {/* Card Top Section: Icon & Position */}
                                <div className="flex items-center justify-between pb-3 border-b border-card-border/30">
                                  <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 flex items-center justify-center text-xs font-black text-foreground/45">
                                    <Users size={12} />
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${config.posBg}`}>
                                    {player.position}
                                  </span>
                                </div>

                                {/* Card Middle Section: Name & Club */}
                                <div className="py-4 space-y-1 z-10">
                                  <h4 className="text-sm sm:text-base font-black text-foreground group-hover:text-primary dark:group-hover:text-rose-400 transition-colors">
                                    {player.name}
                                  </h4>
                                  <p className="text-[10px] sm:text-xs text-foreground/45 font-bold truncate">
                                    {player.club}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-2xl">
                  <Users size={32} className="text-foreground/30" />
                  <div>
                    <p className="text-xs font-black text-foreground/50 uppercase tracking-wider">
                      Không tìm thấy cầu thủ
                    </p>
                    <p className="text-[11px] text-foreground/40 mt-1">
                      Thử nhập từ khóa tìm kiếm khác hoặc chuyển đổi bộ lọc vị trí.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "fixtures" && (
            <div className="glass-panel border border-card-border rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-card-border/50">
                <Calendar size={16} className="text-secondary" /> Lịch thi đấu sắp diễn ra (Fixtures)
              </h3>

              {teamMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamMatches.map((match) => (
                    <MatchCard key={match.match_id} match={match} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-2.5 bg-slate-50 dark:bg-white/[0.01] border border-slate-200/50 dark:border-white/5 rounded-xl">
                  <Calendar size={24} className="text-foreground/30 animate-pulse" />
                  <p className="text-xs font-black text-foreground/50">
                    Không tìm thấy lịch thi đấu sắp tới cho #{code}...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Theme Toggle (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <PremiumToggle />
      </div>
    </main>
  );
}
