import ScheduleDashboard from "../components/ScheduleDashboard";

export default function Home() {
  return (
    <main className="flex-1 w-full min-h-screen bg-background text-foreground transition-colors duration-300 selection:bg-secondary/35 selection:text-white">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-secondary/5 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full">
        <ScheduleDashboard />
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-8 mt-12 border-t border-white/5 text-[11px] text-slate-500/70 font-semibold tracking-wide uppercase">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center">
          <p>© 2026 FIFA WORLD CUP SCHEDULE DASHBOARD</p>
        </div>
      </footer>
    </main>
  );
}

