"use client";

import React, { useState } from "react";
import { AnalysisResponse } from "../types";
import { CLINICAL_CONDITIONS } from "../data/clinicalData";
import TactileSkinDepthMesh from "./TactileSkinDepthMesh";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  Printer,
  Sparkles,
  Layers,
  Activity,
  Compass,
  User,
  Shield,
  HelpCircle,
  FileText,
  Lock,
  ChevronRight,
  Info,
} from "lucide-react";

interface Page4SafetyCoordinatorProps {
  report: AnalysisResponse;
  selectedImageUrl: string | null;
  onResetWorkflow: () => void;
  onBackToPage3: () => void;
}

export default function Page4SafetyCoordinator({
  report,
  selectedImageUrl,
  onResetWorkflow,
  onBackToPage3,
}: Page4SafetyCoordinatorProps) {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");

  const { a1, a2, a3, a4, a5, a6 } = report.agents;
  const decision = a6?.decision || report.verdict?.decision || "AUTO_TRIAGE";
  const predClass = (a6?.prediction || a2?.predicted_class || "nv").toLowerCase();
  const condition = CLINICAL_CONDITIONS[predClass] || {
    name: predClass.toUpperCase(),
    humanName: predClass.toUpperCase(),
    category: "Benign",
    color: "#E85D44",
    description: "Lesion evaluated under multimodal dermatologic triage.",
  };

  const confidencePct = Math.round((a2?.confidence || report.verdict?.confidence || 0.88) * 100);

  // Safety Agent Outputs
  const safetyVeto = a5?.veto_auto_triage ?? (decision === "REFER" || decision === "RE_IMAGE");
  const conflictDetected = a5?.conflict_detected ?? (decision === "REFER" && condition.category === "Benign");
  const highRiskFlag = a5?.severity === "CRITICAL_VETO" || condition.category === "Malignant";
  const safetyTriggers = a5?.triggers || [];

  // Triage Hero Colors
  const isAutoTriage = decision === "AUTO_TRIAGE";
  const isRefer = decision === "REFER";
  const isReImage = decision === "RE_IMAGE";

  const triageTheme = isAutoTriage
    ? {
        bg: "bg-[#ECFDF5]",
        border: "border-[#10B981]",
        text: "text-[#065F46]",
        badgeBg: "bg-[#10B981]",
        title: "AUTO-TRIAGE: Low-Risk Screening Pathway",
        subtitle: "High-confidence benign lesion with no safety flags or clinical conflicts detected.",
      }
    : isRefer
    ? {
        bg: "bg-[#FFF1F2]",
        border: "border-[#E11D48]",
        text: "text-[#9F1239]",
        badgeBg: "bg-[#E11D48]",
        title: "REFER: In-Person Dermatology Referral Required",
        subtitle: "Confirmed malignancy suspicion, safety conflict, or elevated risk warrants specialist evaluation.",
      }
    : {
        bg: "bg-[#FFFBEB]",
        border: "border-[#F59E0B]",
        text: "text-[#92400E]",
        badgeBg: "bg-[#F59E0B]",
        title: "RE-IMAGE: Inadequate Optical Quality",
        subtitle: "Image quality failed optical thresholds; fresh dermoscopy scan required.",
      };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Page Title & Breadcrumb Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_12px_36px_-6px_rgba(28,25,23,0.05)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E85D44]/10 text-[#E85D44]">
              PAGE 4 OF 4
            </span>
            <span className="text-xs text-[#78716C] font-semibold">
              Scan ID: <strong className="text-[#18181B]">{report.image_id}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181B] tracking-tight mt-1">
            5. Safety Agent & 6. Coordinator Agent + Final Result
          </h1>
          <p className="text-xs text-[#78716C]">
            Deterministic safety guardrails, cross-agent veto arbitration, and executive clinical triage dashboard.
          </p>
        </div>

        {/* Disposition Badge */}
        <div
          className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-wider self-start sm:self-auto shadow-xs ${
            isAutoTriage
              ? "bg-[#10B981]/15 text-[#047857] border-[#10B981]/40"
              : isRefer
              ? "bg-[#E11D48]/15 text-[#E11D48] border-[#E11D48]/40"
              : "bg-[#F59E0B]/15 text-[#B45309] border-[#F59E0B]/40"
          }`}
        >
          Verdict: {decision}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AGENT 5: SAFETY AGENT */}
      {/* ========================================================================= */}
      <div className="rounded-[32px] bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_16px_45px_-6px_rgba(28,25,23,0.06)] hover:shadow-[0_20px_55px_-6px_rgba(28,25,23,0.08)] p-6 sm:p-7 space-y-5 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F2E8E3] gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E11D48] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#18181B]">
                  5. Safety Agent
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    safetyVeto
                      ? "bg-[#E11D48]/15 text-[#E11D48]"
                      : "bg-[#10B981]/15 text-[#047857]"
                  }`}
                >
                  {safetyVeto ? "Safety Veto Triggered" : "Safety PASS"}
                </span>
              </div>
              <p className="text-xs text-[#78716C]">
                Purpose: Checks uncertainty, malignant risk, and discordance between diagnostic, ABCD, and context agents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1 rounded-lg bg-[#FAF4F0] border border-[#F2E8E3] text-xs font-bold text-[#18181B]">
              Severity Level:{" "}
              <span className={safetyVeto ? "text-[#E11D48]" : "text-[#10B981]"}>
                {a5?.severity || (safetyVeto ? "CRITICAL_VETO" : "CLEAR")}
              </span>
            </div>
          </div>
        </div>

        {/* Algorithm Pipeline Chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#78716C] bg-[#FAF4F0]/60 p-3 rounded-xl border border-[#F2E8E3]">
          <span className="font-bold text-[#18181B]">Safety Algorithms:</span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Shannon Prediction Entropy Check
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Malignant Tail Check (MEL + BCC + AKIEC)
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Cross-Agent Conflict Detection
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Autonomous Safety Veto Override
          </span>
        </div>

        {/* 3 Safety Output Indicator Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Safety Status */}
          <div className="p-4 rounded-2xl bg-[#FAF4F0]/50 border border-[#F2E8E3] space-y-1">
            <span className="text-[11px] font-bold text-[#78716C] uppercase">Safety Review</span>
            <div className="flex items-center gap-2 text-sm font-black">
              {safetyVeto ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-[#E11D48]" />
                  <span className="text-[#E11D48]">VETO ACTIVE</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[#10B981]">CLEAR / PASS</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-[#78716C]">
              {safetyVeto
                ? "Autonomous veto enforces physician referral."
                : "No contraindications for automated screening."}
            </p>
          </div>

          {/* Card 2: Conflict Flag */}
          <div className="p-4 rounded-2xl bg-[#FAF4F0]/50 border border-[#F2E8E3] space-y-1">
            <span className="text-[11px] font-bold text-[#78716C] uppercase">Conflict Detection</span>
            <div className="flex items-center gap-2 text-sm font-black">
              {conflictDetected ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-[#B45309]">DISCORDANCE FOUND</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[#10B981]">NO CONFLICTS</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-[#78716C]">
              Checks concordance between 2. Diagnosis Agent & 3. Lesion Analysis Agent.
            </p>
          </div>

          {/* Card 3: High-Risk Flag */}
          <div className="p-4 rounded-2xl bg-[#FAF4F0]/50 border border-[#F2E8E3] space-y-1">
            <span className="text-[11px] font-bold text-[#78716C] uppercase">Malignant Tail Flag</span>
            <div className="flex items-center gap-2 text-sm font-black">
              {highRiskFlag ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-[#E11D48]" />
                  <span className="text-[#E11D48]">ELEVATED RISK</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[#10B981]">NORMAL / BENIGN</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-[#78716C]">
              Combined probability mass across MEL, BCC, and AKIEC.
            </p>
          </div>
        </div>

        {/* Active Triggers & Justification */}
        {safetyTriggers.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FDA4AF] text-xs space-y-1">
            <span className="font-extrabold text-[#E11D48] block">Active Safety Triggers:</span>
            <div className="flex flex-wrap gap-1.5">
              {safetyTriggers.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-white text-[#E11D48] border border-[#FDA4AF] font-bold text-[10px]"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-[#9F1239] mt-1">
              {a5?.justification || "Clinical discordance or malignancy probability triggered autonomous safety veto."}
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* AGENT 6: COORDINATOR AGENT */}
      {/* ========================================================================= */}
      <div className="rounded-[32px] bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_16px_45px_-6px_rgba(28,25,23,0.06)] hover:shadow-[0_20px_55px_-6px_rgba(28,25,23,0.08)] p-6 sm:p-7 space-y-5 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F2E8E3] gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E85D44] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#18181B]">
                  6. Coordinator Agent
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E85D44]/15 text-[#E85D44]">
                  Chief Triage Arbiter
                </span>
              </div>
              <p className="text-xs text-[#78716C]">
                Purpose: Combines outputs from Agents 1–5 and executes the final triage policy under three clinical gates.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Decision Gates Interactive Visualizer */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
            Three Clinical Decision Gates Policy
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Gate 1: RE-IMAGE */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isReImage
                  ? "bg-[#FFFBEB] border-[#F59E0B] shadow-md ring-2 ring-[#F59E0B]"
                  : "bg-[#FAF4F0]/40 border-[#F2E8E3] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-[#B45309]">GATE 1</span>
                {isReImage && (
                  <span className="px-2 py-0.5 rounded-full bg-[#F59E0B] text-white text-[9px] font-bold uppercase">
                    Triggered
                  </span>
                )}
              </div>
              <h4 className="text-sm font-extrabold text-[#18181B]">RE-IMAGE</h4>
              <p className="text-[11px] text-[#78716C] mt-1 leading-snug">
                Image quality is insufficient (severe blur, glare, lighting, or obstruction).
              </p>
            </div>

            {/* Gate 2: REFER */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isRefer
                  ? "bg-[#FFF1F2] border-[#E11D48] shadow-md ring-2 ring-[#E11D48]"
                  : "bg-[#FAF4F0]/40 border-[#F2E8E3] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-[#E11D48]">GATE 2</span>
                {isRefer && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E11D48] text-white text-[9px] font-bold uppercase">
                    Triggered
                  </span>
                )}
              </div>
              <h4 className="text-sm font-extrabold text-[#18181B]">REFER</h4>
              <p className="text-[11px] text-[#78716C] mt-1 leading-snug">
                Malignant prediction, safety conflict, or low diagnostic confidence warrants referral.
              </p>
            </div>

            {/* Gate 3: AUTO-TRIAGE */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isAutoTriage
                  ? "bg-[#ECFDF5] border-[#10B981] shadow-md ring-2 ring-[#10B981]"
                  : "bg-[#FAF4F0]/40 border-[#F2E8E3] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-[#047857]">GATE 3</span>
                {isAutoTriage && (
                  <span className="px-2 py-0.5 rounded-full bg-[#10B981] text-white text-[9px] font-bold uppercase">
                    Triggered
                  </span>
                )}
              </div>
              <h4 className="text-sm font-extrabold text-[#18181B]">AUTO-TRIAGE</h4>
              <p className="text-[11px] text-[#78716C] mt-1 leading-snug">
                High-confidence benign prediction with no detected safety flags or conflicts.
              </p>
            </div>
          </div>
        </div>

        {/* Traceable Rationale Box */}
        <div className="p-4 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-1 text-xs">
          <span className="font-extrabold text-[#18181B] block">
            Coordinator Policy Rule Triggered:{" "}
            <span className="text-[#E85D44]">
              {a6?.policy_rule_triggered || report.verdict?.policy_rule_triggered || "Standard Policy"}
            </span>
          </span>
          <p className="text-[#78716C] leading-relaxed">
            {a6?.traceable_rationale || report.verdict?.traceable_rationale || "All agent outputs synchronized."}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FINAL USER DASHBOARD (EXECUTIVE CLINICAL SYNTHESIS) */}
      {/* ========================================================================= */}
      <div className="rounded-[32px] bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_20px_50px_-6px_rgba(28,25,23,0.08)] hover:shadow-[0_25px_65px_-6px_rgba(28,25,23,0.1)] p-6 sm:p-8 space-y-6 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F2E8E3] gap-2">
          <div>
            <span className="text-[10px] font-bold text-[#E85D44] uppercase tracking-wider block">
              FINAL USER DASHBOARD
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#18181B]">
              Executive Clinical Synthesis & Triage Report
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#18181B] shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-[#E85D44]" />
              <span>Print Summary</span>
            </button>
          </div>
        </div>

        {/* Hero Final Triage Recommendation Banner */}
        <div className={`p-6 rounded-2xl border-2 ${triageTheme.border} ${triageTheme.bg} space-y-2`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${triageTheme.badgeBg} text-white flex items-center justify-center font-bold shadow-md`}>
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#78716C] block">
                Final Triage Recommendation
              </span>
              <h3 className={`text-xl sm:text-2xl font-black ${triageTheme.text}`}>
                {triageTheme.title}
              </h3>
            </div>
          </div>
          <p className="text-xs text-[#78716C] max-w-2xl">
            {triageTheme.subtitle}
          </p>
        </div>

        {/* Multi-Dimensional Triage Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (5 cols): Uploaded Image with 2D/3D Relief Toggle */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                Uploaded Skin Image
              </label>
              {selectedImageUrl && (
                <div className="flex items-center p-0.5 rounded-lg bg-[#FAF4F0] border border-[#F2E8E3] text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode("2d")}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      viewMode === "2d" ? "bg-white text-[#18181B] shadow-xs" : "text-[#78716C]"
                    }`}
                  >
                    2D Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("3d")}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      viewMode === "3d" ? "bg-[#E85D44] text-white shadow-xs" : "text-[#78716C]"
                    }`}
                  >
                    3D Relief
                  </button>
                </div>
              )}
            </div>

            <div className="relative w-full h-[240px] sm:h-[280px] rounded-2xl overflow-hidden border border-[#F2E8E3] bg-[#FAF4F0] flex items-center justify-center">
              {selectedImageUrl ? (
                viewMode === "2d" ? (
                  <img
                    src={selectedImageUrl}
                    alt="Uploaded Dermoscopy Scan"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <TactileSkinDepthMesh imageUrl={selectedImageUrl} className="w-full h-full" />
                )
              ) : (
                <div className="text-xs text-[#78716C]">No image available</div>
              )}

              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold">
                Scan ID: {report.image_id}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Diagnostics, ABCD, Context & Safety Summary */}
          <div className="lg:col-span-7 space-y-4">
            {/* Classification & Confidence Row */}
            <div className="p-4 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">
                  Predicted Lesion Category
                </span>
                <div className="text-lg font-black text-[#18181B] mt-0.5">
                  {condition.name} <span className="text-[#E85D44]">({predClass.toUpperCase()})</span>
                </div>
                <span className="text-[11px] text-[#78716C]">{condition.humanName} • {condition.category}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">
                  Confidence
                </span>
                <div className="text-2xl font-black text-[#E85D44]">
                  {confidencePct}%
                </div>
              </div>
            </div>

            {/* ABCD Visual Analysis Summary */}
            <div className="p-4 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-2">
              <span className="text-xs font-bold text-[#18181B] uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#0D9488]" />
                ABCD Visual Analysis
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border border-[#F2E8E3]">
                  <span className="text-[10px] text-[#78716C] block">Asymmetry</span>
                  <span className="font-extrabold text-[#18181B]">{(a3?.asymmetry_score ?? 0.22).toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#F2E8E3]">
                  <span className="text-[10px] text-[#78716C] block">Border</span>
                  <span className="font-extrabold text-[#18181B]">{(a3?.border_irregularity_score ?? 0.25).toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#F2E8E3]">
                  <span className="text-[10px] text-[#78716C] block">Color</span>
                  <span className="font-extrabold text-[#18181B]">{(a3?.color_variegation_score ?? 0.2).toFixed(2)}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#F2E8E3]">
                  <span className="text-[10px] text-[#78716C] block">Diameter</span>
                  <span className="font-extrabold text-[#18181B]">{(a3?.diameter_compactness_score ?? 0.35).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Patient Context & Safety Warning Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Patient-Context Risk */}
              <div className="p-3.5 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-1 text-xs">
                <span className="font-bold text-[#18181B] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#6366F1]" />
                  Patient-Context Risk
                </span>
                <div className="text-sm font-extrabold text-[#18181B]">
                  {a4?.risk_indicator || "LOW"} Risk <span className="text-xs font-normal text-[#78716C]">({(a4?.malignancy_prior_multiplier ?? 1.0).toFixed(2)}x)</span>
                </div>
                <p className="text-[10px] text-[#78716C] truncate">
                  {report.patient_context?.age ?? 50}y {report.patient_context?.sex} on {report.patient_context?.localization}
                </p>
              </div>

              {/* Safety Warnings */}
              <div className="p-3.5 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-1 text-xs">
                <span className="font-bold text-[#18181B] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E11D48]" />
                  Safety Warnings
                </span>
                <div className="text-sm font-extrabold text-[#18181B]">
                  {safetyTriggers.length > 0 ? `${safetyTriggers.length} Active Flag(s)` : "Zero Safety Conflicts"}
                </div>
                <p className="text-[10px] text-[#78716C] truncate">
                  {safetyTriggers[0] || "Safety checks clear under Bayesian priors."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Explanation of Why the Decision Was Made */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF4F0]/80 border border-[#F2E8E3] space-y-2 text-xs">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#18181B]">
            <Sparkles className="w-4 h-4 text-[#E85D44]" />
            <span>Clinical Explanation of Decision:</span>
          </div>
          <p className="text-[#44403C] leading-relaxed">
            {a6?.traceable_rationale ||
              report.verdict?.traceable_rationale ||
              `The coordinator evaluated inputs from all six agents. Lesion identified as ${condition.name} with ${confidencePct}% confidence under ${a6?.policy_rule_triggered || "clinical gating policy"}.`}
          </p>
        </div>

        {/* ===================================================================== */}
        {/* CRITICAL MEDICAL DISCLAIMER (MANDATORY REQUIREMENT) */}
        {/* ===================================================================== */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-[#78350F] flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-black uppercase tracking-wider block text-[11px] text-amber-800">
              Important Clinical Screening Notice
            </span>
            <p className="leading-relaxed">
              <strong>AUTO-TRIAGE is a low-risk screening pathway, not a confirmed medical diagnosis.</strong> This autonomous system is intended strictly as an assistive clinical triage tool. Patients must consult a board-certified dermatologist or qualified healthcare provider for any lesion exhibiting evolution, ulceration, bleeding, or irregular symptoms.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Footer for Page 4 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBackToPage3}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#18181B] flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#78716C]" />
          <span>← Back to Page 3 (3. Lesion Analysis Agent & 4. Reasoning / Context Agent)</span>
        </button>

        <button
          type="button"
          onClick={onResetWorkflow}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#E85D44] to-[#F27059] text-white text-xs font-extrabold shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start New Patient Analysis (Return to Page 1)</span>
        </button>
      </div>
    </div>
  );
}
