"use client";

import React from "react";
import { Activity, Users, PieChart, Plus, HeartPulse } from "lucide-react";

interface LeftNavRailProps {
  currentTab: "dashboard" | "records" | "insights";
  onSelectTab: (tab: "dashboard" | "records" | "insights") => void;
}

export default function LeftNavRail({
  currentTab,
  onSelectTab,
}: LeftNavRailProps) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "records", label: "Clinic Records", icon: Users },
    { id: "insights", label: "Insights", icon: PieChart },
  ] as const;

  return (
    <aside className="w-full md:w-[84px] bg-[#F2765E] rounded-[28px] flex flex-row md:flex-col items-center justify-between py-4 md:py-8 px-5 md:px-0 text-white shadow-[0_12px_32px_rgba(242,118,94,0.3)] select-none shrink-0">
      {/* Brand 3D Floating Heart / Medical Cross Icon */}
      <div className="flex items-center md:flex-col gap-2">
        <div className="relative group">
          <div className="w-12 h-12 rounded-2xl badge-3d-sphere flex items-center justify-center text-white transition-transform hover:scale-105 cursor-pointer">
            <HeartPulse className="w-6 h-6 drop-shadow-sm text-white" />
          </div>
          {/* Subtle floating plus accent */}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[#F2765E] flex items-center justify-center shadow-md">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
        <span className="text-[11px] font-bold tracking-wider uppercase text-white/95 mt-1 hidden md:block">
          Derma
        </span>
      </div>

      {/* Navigation Squircle Tabs */}
      <nav className="flex flex-row md:flex-col items-center gap-3 md:gap-7">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="group flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <div
                className={`transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? "bg-white text-[#F2765E] rounded-2xl p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.1)] scale-105"
                    : "text-white/85 hover:text-white hover:bg-white/10 rounded-2xl p-3.5"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] tracking-tight transition-all hidden md:block ${
                  isActive
                    ? "text-white font-bold opacity-100"
                    : "text-white/75 font-medium opacity-80 group-hover:opacity-100"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Ambient bottom status dot */}
      <div className="w-2.5 h-2.5 rounded-full bg-white/40 hidden md:block shadow-xs" />
    </aside>
  );
}
