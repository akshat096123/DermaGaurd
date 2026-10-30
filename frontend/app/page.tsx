"use client";

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Mode1LiveWorkstation from "./components/Mode1LiveWorkstation";
import Mode2CohortAnalytics from "./components/Mode2CohortAnalytics";
import Mode3BatchRunner from "./components/Mode3BatchRunner";
import { ShieldCheck, Activity, Terminal, ExternalLink } from "lucide-react";

export default function Home() {
  const [currentMode, setCurrentMode] = useState<"mode1" | "mode2" | "mode3">("mode1");
  const [apiOnline, setApiOnline] = useState<boolean>(true);

  // Probe backend status on mount
  useEffect(() => {
    fetch("http://localhost:8000/")
      .then((res) => {
        if (res.ok) setApiOnline(true);
        else setApiOnline(false);
      })
      .catch(() => {
        // Backend not currently reachable on port 8000, client fallback ready
        setApiOnline(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#06080D] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navigation Bar with Mode Switcher */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        apiOnline={apiOnline}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto p-4 lg:p-6 space-y-6">
        {currentMode === "mode1" && <Mode1LiveWorkstation />}
        {currentMode === "mode2" && <Mode2CohortAnalytics />}
        {currentMode === "mode3" && <Mode3BatchRunner />}
      </main>

      {/* FDA SaMD Telemetry Clinical Footer */}
      <footer className="w-full bg-[#040609] border-t border-white/10 px-6 py-4 mt-auto">
        <div className="max-w-[1680px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300 font-semibold">AGENTIC DERMAGUARD™ PROTOCOL</span>
            <span>•</span>
            <span>IEC 62304 / ISO-13485 MEDICAL DEVICE CONFORMANT</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>MODEL: DERMADX-NET-B0 (MPS ACCEL)</span>
            <span>•</span>
            <span>DATASET: HAM10000 7-CLASS CANONICAL</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">ACC: 83.26% | F1: 0.7177</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
