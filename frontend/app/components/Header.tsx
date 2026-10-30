"use client";

import React from "react";
import { Shield, Stethoscope, Activity } from "lucide-react";
import { ActiveView } from "../types";

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  isBackendConnected?: boolean;
}

export default function Header({
  activeView,
  onSelectView,
  isBackendConnected = true,
}: HeaderProps) {
  const navItems = [
    {
      id: "screening" as ActiveView,
      label: "New Patient Screening",
      desc: "Intake & 6-Agent Report",
      icon: Stethoscope,
    },
    {
      id: "analytics" as ActiveView,
      label: "Clinical Audit & Analytics",
      desc: "Hospital QA & Validation",
      icon: Activity,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 bg-white/85 backdrop-blur-xl border-b border-[#F2E8E3] shadow-[0_4px_24px_rgba(28,25,23,0.03)] transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Mark */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => onSelectView("screening")}
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E85D44] via-[#F27059] to-[#D4472E] text-white shadow-md shadow-[#E85D44]/25 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-[#18181B]">
                DermaGuard <span className="text-[#E85D44] font-bold">Clinical</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-[#E85D44]/10 text-[#E85D44]">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-[#78716C] font-medium leading-none mt-0.5">
              Autonomous Dermatology & Multi-Agent Triage Platform
            </p>
          </div>
        </div>

        {/* 2 Clean Real-World Product Views */}
        <nav className="flex items-center p-1 bg-[#FAF4F0] rounded-2xl border border-[#F2E8E3] shadow-inner">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 select-none ${
                  isActive
                    ? "bg-white text-[#18181B] shadow-sm shadow-[#18181B]/5 border border-[#E5DCD4]"
                    : "text-[#78716C] hover:text-[#18181B] hover:bg-white/50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-[#E85D44]" : "text-[#78716C]"
                  }`}
                />
                <div className="text-left">
                  <span className="block leading-tight font-extrabold">{item.label}</span>
                  <span className="block text-[10px] text-[#A8A29E] font-medium hidden sm:inline">
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Active Doctor Profile Badge */}
        <div className="hidden lg:flex items-center gap-3 pl-2 border-l border-[#F2E8E3]">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-[#F2E8E3] shadow-sm">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FAF4F0] to-[#FCEAE3] border border-[#E85D44]/30 flex items-center justify-center text-[#E85D44] font-extrabold text-xs">
              MV
            </div>
            <div className="text-left pr-1">
              <div className="text-xs font-bold text-[#18181B] leading-none flex items-center gap-1.5">
                <span>Dr. Marcus Vance, MD</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              </div>
              <span className="text-[10px] text-[#78716C] font-medium leading-none block mt-0.5">
                Lead Dermatologist • St. Jude Memorial
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
