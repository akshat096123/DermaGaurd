"use client";

import React from "react";
import { WorkflowPage } from "../types";
import {
  Shield,
  FileText,
  Search,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  BarChart3,
  RotateCcw,
  User,
} from "lucide-react";

interface WorkflowHeaderProps {
  currentPage: WorkflowPage;
  onSelectPage: (page: WorkflowPage) => void;
  maxUnlockedPage: WorkflowPage;
  qualityPassed: boolean | null;
  sessionId: string;
  isBackendConnected: boolean;
  onResetWorkflow: () => void;
  viewMode?: "workflow" | "bodymap" | "results";
  onToggleViewMode?: (mode: "workflow" | "bodymap" | "results") => void;
}

const STEPS = [
  {
    page: 1 as WorkflowPage,
    title: "Page 1: Intake & Scan",
    subtitle: "Image Upload + Patient Details",
    icon: FileText,
  },
  {
    page: 2 as WorkflowPage,
    title: "Page 2: Quality & Diagnosis",
    subtitle: "Image Quality Agent & Diagnosis Agent",
    icon: Search,
  },
  {
    page: 3 as WorkflowPage,
    title: "Page 3: Lesion & Context",
    subtitle: "Lesion Analysis Agent & Reasoning / Context Agent",
    icon: Activity,
  },
  {
    page: 4 as WorkflowPage,
    title: "Page 4: Safety & Coordinator",
    subtitle: "Safety Agent & Coordinator Agent",
    icon: CheckCircle2,
  },
  {
    page: 5 as WorkflowPage,
    title: "Page 5: Results & Benchmark",
    subtitle: "Clinical Audit & Validation Results",
    icon: BarChart3,
  },
];

export default function WorkflowHeader({
  currentPage,
  onSelectPage,
  maxUnlockedPage,
  qualityPassed,
  sessionId,
  isBackendConnected,
  onResetWorkflow,
  viewMode = "workflow",
  onToggleViewMode,
}: WorkflowHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 border-b border-[#F2E8E3]/80 shadow-[0_4px_24px_-4px_rgba(28,25,23,0.04)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Brand bar + Session details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2E8E3]/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#E85D44] to-[#D4472E] text-white shadow-md shadow-[#E85D44]/25 ring-2 ring-white/80 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[#18181B]">
                  DermaGuard <span className="text-[#E85D44]">Clinical</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-black tracking-wider uppercase rounded-full bg-[#E85D44]/10 text-[#E85D44] border border-[#E85D44]/20 shadow-xs">
                  6-Agent Pipeline
                </span>
              </div>
              <p className="text-[11px] text-[#78716C] font-medium leading-none mt-0.5">
                Autonomous Dermatology & Multi-Agent Triage Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto text-xs">
            {/* View Mode Toggle: Screening vs 3D Body Map */}
            <div className="flex items-center p-0.5 rounded-xl bg-[#FAF4F0] border border-[#F2E8E3] shadow-xs">
              <button
                type="button"
                onClick={() => onToggleViewMode?.("workflow")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  viewMode === "workflow"
                    ? "bg-white text-[#E85D44] shadow-xs"
                    : "text-[#78716C] hover:text-[#18181B]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Screening</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleViewMode?.("bodymap")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  viewMode === "bodymap"
                    ? "bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white shadow-xs"
                    : "text-[#78716C] hover:text-[#18181B]"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>3D Body Map</span>
              </button>
            </div>

            {/* Session ID Pill */}
            <div className="hidden lg:flex px-3 py-1 rounded-xl bg-[#FAF4F0]/80 backdrop-blur-xs border border-[#F2E8E3] text-[#78716C] items-center gap-1.5 font-mono text-[11px] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#E85D44] ring-2 ring-[#E85D44]/20" />
              <span>Session: <strong className="text-[#18181B]">{sessionId}</strong></span>
            </div>

            {/* Backend connection pill */}
            <div className="px-2.5 py-1 rounded-xl bg-[#FAF4F0]/80 backdrop-blur-xs border border-[#F2E8E3] text-[#78716C] flex items-center gap-1.5 text-[11px] shadow-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendConnected ? "bg-[#10B981] ring-2 ring-[#10B981]/20" : "bg-[#F59E0B] ring-2 ring-[#F59E0B]/20"
                }`}
              />
              <span>{isBackendConnected ? "Online" : "Local Mode"}</span>
            </div>

            {/* New Scan / Reset */}
            <button
              type="button"
              onClick={onResetWorkflow}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white hover:bg-[#FAF4F0] border border-[#F2E8E3] hover:border-[#E5DCD4] text-[11px] font-bold text-[#78716C] hover:text-[#E85D44] shadow-xs hover:shadow-sm active:scale-95 transition-all"
              title="Reset workflow and return to Page 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Patient</span>
            </button>
          </div>
        </div>

        {/* 5-Page Workflow Progression Stepper with Connected Progress Line */}
        <div className="relative pt-2.5">
          {/* Subtle glowing connector line behind steps (desktop) */}
          <div className="hidden md:block absolute top-[28px] left-[8%] right-[8%] h-[2px] bg-[#F2E8E3] z-0">
            <div
              className="h-full bg-gradient-to-r from-[#10B981] via-[#E85D44] to-[#F27059] transition-all duration-500 ease-out"
              style={{
                width: `${
                  currentPage === 1 ? "0%" :
                  currentPage === 2 ? "25%" :
                  currentPage === 3 ? "50%" :
                  currentPage === 4 ? "75%" : "100%"
                }`,
              }}
            />
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {STEPS.map((step) => {
              const isCurrent = currentPage === step.page;
              const isCompleted = currentPage > step.page && (step.page === 1 || qualityPassed !== false);
              const isLocked = (step.page > maxUnlockedPage && step.page !== 5) || (step.page > 2 && qualityPassed === false && step.page !== 5);
              const isFailedGate = step.page === 2 && qualityPassed === false;

              const Icon = step.icon;

              return (
                <button
                  key={step.page}
                  type="button"
                  disabled={isLocked}
                  onClick={() => onSelectPage(step.page)}
                  className={`flex items-center gap-2.5 p-2 rounded-2xl text-left border transition-all duration-200 select-none ${
                    isCurrent
                      ? "bg-white/95 backdrop-blur-md border-[#E85D44] shadow-[0_10px_25px_-3px_rgba(232,93,68,0.22)] ring-4 ring-[#E85D44]/15 scale-[1.015] -translate-y-0.5"
                      : isFailedGate
                      ? "bg-white/95 backdrop-blur-md border-[#E11D48] ring-4 ring-[#E11D48]/15 shadow-[0_8px_25px_-2px_rgba(225,29,72,0.18)]"
                      : isCompleted
                      ? "bg-white/90 backdrop-blur-md border-[#10B981]/50 hover:border-[#10B981] hover:bg-white shadow-[0_4px_16px_-2px_rgba(16,185,129,0.08)] cursor-pointer hover:-translate-y-0.5"
                      : isLocked
                      ? "bg-[#FAF4F0]/40 border-[#F2E8E3]/60 opacity-60 cursor-not-allowed"
                      : "bg-white/75 backdrop-blur-md border-[#F2E8E3] hover:border-[#E5DCD4] hover:bg-white shadow-xs hover:shadow-sm cursor-pointer hover:-translate-y-0.5"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isCurrent
                        ? "bg-gradient-to-br from-[#E85D44] to-[#F27059] text-white shadow-md shadow-[#E85D44]/30 ring-2 ring-white"
                        : isFailedGate
                        ? "bg-gradient-to-br from-[#E11D48] to-[#BE123C] text-white shadow-sm ring-2 ring-white"
                        : isCompleted
                        ? "bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-sm shadow-[#10B981]/20 ring-2 ring-white"
                        : isLocked
                        ? "bg-[#E5DCD4]/70 text-[#A8A29E]"
                        : "bg-[#FAF4F0] text-[#78716C] border border-[#F2E8E3]"
                    }`}
                  >
                    {isFailedGate ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-white" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    ) : isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-[#78716C]" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-extrabold truncate ${
                          isCurrent
                            ? "text-[#E85D44]"
                            : isFailedGate
                            ? "text-[#E11D48]"
                            : isCompleted
                            ? "text-[#18181B]"
                            : "text-[#78716C]"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#A8A29E] truncate">
                      {step.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
