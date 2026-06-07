"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function PremiumToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.add("disable-transitions");

    const nextTheme = theme === "dark" ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setTheme(nextTheme);

    try {
      sessionStorage.setItem("wc2026_theme", nextTheme);
    } catch (e) {
      console.error(e);
    }

    // Force reflow/repaint
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    window.getComputedStyle(document.body).opacity;

    requestAnimationFrame(() => {
      document.documentElement.classList.remove("disable-transitions");
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-full border border-white/10 dark:border-white/5 bg-white/10 dark:bg-white/5 backdrop-blur-md hover:bg-white/20 hover:scale-105 active:scale-95 transition-all shadow-lg text-foreground cursor-pointer"
      aria-label="Chuyển đổi giao diện"
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-amber-400 animate-spin-slow" />
      ) : (
        <Moon size={18} className="text-indigo-600 dark:text-indigo-400" />
      )}
    </button>
  );
}
