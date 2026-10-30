"use client";

import React, { useState, useEffect } from "react";
import { Activity, BarChart3, FileSpreadsheet, ShieldCheck, Cpu, Clock, Stethoscope } from "lucide-react";

interface NavbarProps {
  currentMode: "mode1" | "mode2" | "mode3";
  onSelectMode: (mode: "mode1" | "mode2" | "mode3") => void;
  apiOnline?: boolean;
}

export default function Navbar({
  currentMode,
  onSelectMode,
  apiOnline = true,
}: NavbarProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " UTC"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#06080D]/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 py-2.5">
      <div className="max-w-[1680px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & FDA Medical Compliance Badge */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-purple-600/20 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <Stethoscope className="w-5 h-5 text-cyan-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#06080D] animate-ping" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#06080D]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-white font-mono">
                AGENTIC DERMAGUARD™
              </span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-mono text-cyan-300 font-bold">
                FDA SaMD CLASS II
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 tracking-tight">
              Clinical Multi-Agent Triage Workstation • Track 2 Healthcare
            </p>
          </div>
        </div>

        {/* 3 Switchable View Mode Tabs */}
        <div className="flex items-center bg-[#090d16] p-1 rounded-xl border border-white/10 shadow-inner">
          <button
            onClick={() => onSelectMode("mode1")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 ${
              currentMode === "mode1"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mode 1: 6-Agent Live Diagnostic</span>
          </button>

          <button
            onClick={() => onSelectMode("mode2")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 ${
              currentMode === "mode2"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-500/10 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Mode 2: Cohort Analytics &amp; Matrix</span>
          </button>

          <button
            onClick={() => onSelectMode("mode3")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 ${
              currentMode === "mode3"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/10 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mode 3: Batch Runner &amp; CSV Exporter</span>
          </button>
        </div>

        {/* Telemetry Strip: Backend Status, Latency & Clock */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10">
            <div className={`w-2 h-2 rounded-full ${apiOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span className={apiOnline ? "text-emerald-300" : "text-amber-300"}>
              {apiOnline ? "FASTAPI :8000 LIVE" : "CLIENT CACHE READY"}
            </span>
          </div>

          <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>M4 MPS ACCEL</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeStr || "12:00:00 UTC"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
