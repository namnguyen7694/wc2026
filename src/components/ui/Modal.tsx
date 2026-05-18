"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll and handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    // Lock scroll
    document.body.style.overflow = "hidden";

    // ESC key handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop blur overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* Modal Content container card */}
      <div className="relative w-full max-w-lg bg-card-bg border border-card-border rounded-[28px] shadow-2xl p-5 sm:p-6 overflow-hidden animate-scale-up text-foreground z-10">
        <div className="flex items-center justify-between mb-4">
          {title ? (
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 text-xs text-foreground/70 font-extrabold uppercase tracking-wider">
              {title}
            </span>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="text-foreground/45 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 p-1.5 rounded-full transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
}
