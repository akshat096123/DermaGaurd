"use client";

import React from "react";
import { Shield, Sparkles, Activity, Award, CheckCircle2, ChevronRight, Stethoscope } from "lucide-react";
import { ActiveStage } from "../types";

interface HeaderProps {
  activeStage: ActiveStage;
  onSelectStage: (stage: ActiveStage) => void;
  hasActiveReport: boolean;
  isBackendConnected: boolean;
}

export default function Header({
  activeStage,
  onSelectStage,
  hasActiveReport,
  isBackendConnected,
}: HeaderProps) {
  const steps = [
    {
      id: "intake" as ActiveStage,
      num: "1",
      label: "Patient Intake & Smart Scan",
      desc: "Demographics & Camera",
      badge: "Stage 1",
    },
    {
      id: "report" as ActiveStage,
      num: "2",
      label: "6-Agent Diagnostic Report",
      desc: "Analysis & Safety Veto",
      badge: hasActiveReport ? "Verified" : "Scan to Unlock",
      locked: !hasActiveReport,
    },
    {
      id: "benchmark" as ActiveStage,
      num: "3",
      label: "Judge Benchmark & Cohort",
      desc: "Metrics & 7x7 Matrix",
      badge: "83.3% Acc",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3 bg-white/80 backdrop-blur-xl border-b border-[#F3EAE3] shadow-[0_4px_24px_rgba(28,25,23,0.03)] transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Mark */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectStage("intake")}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E85D44] via-[#F27059] to-[#D4472E] text-white shadow-md shadow-[#E85D44]/25">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#18181B]">DermaGuard</span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-[#E85D44]/10 text-[#E85D44]">
                AI 6-Agent
              </span>
            </div>
            <p className="text-[11px] text-[#71717A] font-medium leading-none mt-0.5">
              Autonomous Clinical Dermatology & Safety Triage
            </p>
          </div>
        </div>

        {/* 3 Step Navigation Pills */}
        <nav className="flex items-center p-1 bg-[#FAF5F0] rounded-2xl border border-[#F3EAE3] shadow-inner">
          {steps.map((s, idx) => {
            const isActive = activeStage === s.id;
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelectStage(s.id)}
                  className={`relative flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none ${
                    isActive
                      ? "bg-white text-[#18181B] shadow-sm shadow-[#18181B]/5 border border-[#E4D8CF]"
                      : "text-[#71717A] hover:text-[#18181B] hover:bg-white/50"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                      isActive
                        ? "bg-[#E85D44] text-white"
                        : "bg-[#EFE5DC] text-[#71717A]"
                    }`}
                  >
                    {s.num}
                  </span>
                  <div className="text-left hidden sm:block">
                    <span className="block leading-tight">{s.label}</span>
                  </div>
                  {s.badge && (
                    <span
                      className={`hidden lg:inline-block px-1.5 py-0.2 text-[9px] font-bold uppercase rounded ${
                        isActive
                          ? "bg-[#E85D44]/10 text-[#E85D44]"
                          : hasActiveReport && s.id === "report"
                          ? "bg-[#10B981]/15 text-[#047857]"
                          : "bg-[#E5DCD4] text-[#8A817C]"
                      }`}
                    >
                      {s.badge}
                    </span>
                  )}
                </button>
                {idx < steps.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#C4B7AC] mx-0.5 hidden sm:block" />
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right Telemetry / Connectivity */}
        <div className="hidden xl:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF5F0] rounded-full border border-[#F3EAE3] text-[11px] font-medium text-[#71717A]">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendConnected ? "bg-[#10B981] animate-pulse" : "bg-[#F59E0B]"
              }`}
            />
            <span>{isBackendConnected ? "FastAPI Live :8000" : "Connecting..."}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D9488]/10 text-[#0F766E] rounded-full border border-[#0D9488]/20 text-[11px] font-bold">
            <Activity className="w-3.5 h-3.5" />
            <span>EfficientNet-B0 Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
