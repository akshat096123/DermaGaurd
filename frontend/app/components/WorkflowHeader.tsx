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
} from "lucide-react";

interface WorkflowHeaderProps {
  currentPage: WorkflowPage;
  onSelectPage: (page: WorkflowPage) => void;
  maxUnlockedPage: WorkflowPage;
  qualityPassed: boolean | null;
  sessionId: string;
  isBackendConnected: boolean;
  onResetWorkflow: () => void;
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
    subtitle: "Agent 1 (Quality) & Agent 2 (Diagnosis)",
    icon: Search,
  },
  {
    page: 3 as WorkflowPage,
    title: "Page 3: Lesion & Context",
    subtitle: "Agent 3 (ABCD) & Agent 4 (Context Risk)",
    icon: Activity,
  },
  {
    page: 4 as WorkflowPage,
    title: "Page 4: Safety & Coordinator",
    subtitle: "Agent 5 (Safety) & Agent 6 (Triage Dashboard)",
    icon: CheckCircle2,
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
}: WorkflowHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 border-b border-[#F2E8E3] shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Brand bar + Session details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2E8E3]/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#E85D44] to-[#D4472E] text-white shadow-md shadow-[#E85D44]/20 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[#18181B]">
                  DermaGuard <span className="text-[#E85D44]">Clinical</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase rounded-full bg-[#E85D44]/10 text-[#E85D44]">
                  6-Agent Pipeline
                </span>
              </div>
              <p className="text-[11px] text-[#78716C] font-medium leading-none mt-0.5">
                Autonomous Dermatology & Multi-Agent Triage Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto text-xs">
            {/* Session ID Pill */}
            <div className="px-3 py-1 rounded-lg bg-[#FAF4F0] border border-[#F2E8E3] text-[#78716C] flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#E85D44]" />
              <span>Session: <strong className="text-[#18181B]">{sessionId}</strong></span>
            </div>

            {/* Backend connection pill */}
            <div className="px-2.5 py-1 rounded-lg bg-[#FAF4F0] border border-[#F2E8E3] text-[#78716C] flex items-center gap-1.5 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  isBackendConnected ? "bg-[#10B981]" : "bg-[#F59E0B]"
                }`}
              />
              <span>{isBackendConnected ? "Online" : "Local Mode"}</span>
            </div>

            {/* New Scan / Reset */}
            <button
              type="button"
              onClick={onResetWorkflow}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white hover:bg-[#FAF4F0] border border-[#F2E8E3] text-[11px] font-bold text-[#78716C] hover:text-[#E85D44] shadow-sm transition-all"
              title="Reset workflow and return to Page 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Patient</span>
            </button>
          </div>
        </div>

        {/* 4-Page Workflow Progression Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2.5">
          {STEPS.map((step) => {
            const isCurrent = currentPage === step.page;
            const isCompleted = currentPage > step.page && (step.page === 1 || qualityPassed !== false);
            const isLocked = step.page > maxUnlockedPage || (step.page > 2 && qualityPassed === false);
            const isFailedGate = step.page === 2 && qualityPassed === false;

            const Icon = step.icon;

            return (
              <button
                key={step.page}
                type="button"
                disabled={isLocked}
                onClick={() => onSelectPage(step.page)}
                className={`flex items-center gap-2.5 p-2 rounded-xl text-left border transition-all select-none ${
                  isCurrent
                    ? "bg-[#E85D44]/10 border-[#E85D44] shadow-sm"
                    : isFailedGate
                    ? "bg-[#E11D48]/10 border-[#E11D48]"
                    : isCompleted
                    ? "bg-white border-[#10B981]/40 hover:border-[#10B981] hover:bg-[#10B981]/5 cursor-pointer"
                    : isLocked
                    ? "bg-[#FAF4F0]/60 border-[#F2E8E3] opacity-60 cursor-not-allowed"
                    : "bg-white border-[#F2E8E3] hover:border-[#E5DCD4] cursor-pointer"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isCurrent
                      ? "bg-[#E85D44] text-white"
                      : isFailedGate
                      ? "bg-[#E11D48] text-white"
                      : isCompleted
                      ? "bg-[#10B981] text-white"
                      : isLocked
                      ? "bg-[#E5DCD4] text-[#A8A29E]"
                      : "bg-[#FAF4F0] text-[#78716C]"
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
    </header>
  );
}
