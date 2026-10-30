"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Info,
  Scale,
  Brain,
  Eye,
  Sliders,
  Shield,
  ArrowRight,
  User,
} from "lucide-react";
import { AnalysisResponse, Agent5Safety } from "../types";
import TactileSkinDepthMesh from "./TactileSkinDepthMesh";

interface DiagnosticReportViewProps {
  report: AnalysisResponse;
  imageUrl: string;
  onNewScan: () => void;
}

const CLASS_DESCRIPTIONS: Record<string, string> = {
  nv: "Melanocytic Nevus (Benign Mole)",
  mel: "Invasive Cutaneous Melanoma",
  bcc: "Basal Cell Carcinoma",
  bkl: "Benign Keratosis / Solar Lentigo",
  akiec: "Actinic Keratosis / Bowen's Precancer",
  vasc: "Vascular Lesion / Angioma",
  df: "Dermatofibroma (Histiocytoma)",
};

const MALIGNANT_SET = new Set(["mel", "bcc", "akiec"]);

export default function DiagnosticReportView({
  report,
  imageUrl,
  onNewScan,
}: DiagnosticReportViewProps) {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [expandedAgent, setExpandedAgent] = useState<string | null>("A5");

  const { verdict, agents, patient_context } = report;
  const isAutoTriage = verdict.decision === "AUTO_TRIAGE";
  const isRefer = verdict.decision === "REFER";
  const isReImage = verdict.decision === "RE_IMAGE";

  // Calculate malignant mass percentage
  const malMassPercent = Math.round(agents.a2.malignant_probability_mass * 100);
  const benignMassPercent = 100 - malMassPercent;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* 1. TOP HERO VERDICT BANNER (Full Width) */}
      <section
        className={`relative overflow-hidden rounded-[32px] p-8 sm:p-10 border transition-all duration-300 shadow-[0_20px_50px_rgba(28,25,23,0.06)] ${
          isAutoTriage
            ? "bg-gradient-to-r from-[#F0FDF4] via-white to-[#F0FDF4] border-[#86EFAC]"
            : isRefer
            ? "bg-gradient-to-r from-[#FFF1F2] via-white to-[#FFF1F2] border-[#FDA4AF]"
            : "bg-gradient-to-r from-[#FFFBEB] via-white to-[#FFFBEB] border-[#FDE68A]"
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Status Pill + Gate Rule */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  isAutoTriage
                    ? "bg-[#10B981] text-white shadow-md shadow-[#10B981]/25"
                    : isRefer
                    ? "bg-[#E11D48] text-white shadow-md shadow-[#E11D48]/25"
                    : "bg-[#F59E0B] text-white shadow-md shadow-[#F59E0B]/25"
                }`}
              >
                {isAutoTriage ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : isRefer ? (
                  <ShieldAlert className="w-4 h-4 text-white" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-white" />
                )}
                <span>Agent 6 Disposition: {verdict.decision.replace("_", " ")}</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-white/90 border border-stone-200 text-xs font-bold text-[#18181B] shadow-sm">
                {verdict.policy_rule_triggered}
              </span>

              <span className="text-[11px] font-semibold text-[#71717A]">
                Case ID: {report.image_id}
              </span>
            </div>

            {/* Primary Diagnosis & Confidence */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#18181B] tracking-tight">
                {CLASS_DESCRIPTIONS[verdict.prediction] || verdict.disease_name}
                <span className="ml-3 text-lg sm:text-2xl font-bold text-[#E85D44]">
                  ({Math.round(verdict.confidence * 100)}% Confidence)
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-[#71717A] leading-relaxed">
                {verdict.traceable_rationale}
              </p>
            </div>
          </div>

          {/* Action Button: New Patient Scan */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={onNewScan}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-stone-50 text-[#18181B] rounded-2xl text-xs font-bold transition-all shadow-md border border-[#E4D8CF] active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-[#E85D44]" />
              <span>New Patient Scan</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. MAIN 12-COLUMN ORGANIZED GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-w-0">
        {/* LEFT 5 COLUMNS: Visual Dermoscopy & 3D Surface Suite + ABCD Morphometry */}
        <div className="lg:col-span-5 space-y-6 min-w-0 w-full">
          {/* Card: 2D Dermoscopy vs 3D Surface Relief */}
          <div className="glass-card p-5 border border-white min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3EAE3] mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#E85D44]" />
                <h3 className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                  Lesion Surface Inspection
                </h3>
              </div>

              {/* Segmented Switch: 2D vs 3D */}
              <div className="inline-flex p-1 bg-[#FAF5F0] rounded-xl border border-[#F3EAE3]">
                <button
                  type="button"
                  onClick={() => setViewMode("2d")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "2d"
                      ? "bg-white text-[#18181B] shadow-sm"
                      : "text-[#71717A] hover:text-[#18181B]"
                  }`}
                >
                  2D Dermoscopy
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("3d")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    viewMode === "3d"
                      ? "bg-white text-[#18181B] shadow-sm"
                      : "text-[#71717A] hover:text-[#18181B]"
                  }`}
                >
                  3D Relief Mesh
                </button>
              </div>
            </div>

            {/* Display Area */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FAF5F0] border border-[#F3EAE3]">
              {viewMode === "2d" ? (
                <div className="relative w-full h-full">
                  <img
                    src={imageUrl}
                    alt="High resolution dermoscopy"
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle Central Reticle */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border border-white/50" />
                  </div>
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[10px] font-semibold text-white">
                    {patient_context.localization.toUpperCase()} • {patient_context.age}y
                  </div>
                </div>
              ) : (
                <TactileSkinDepthMesh imageUrl={imageUrl} className="w-full h-full" />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-[#71717A]">
              <span>Real Dermoscopy File: {report.image_id}.jpg</span>
              <span className="font-semibold text-[#0D9488]">Optical Quality: {agents.a1.status}</span>
            </div>
          </div>

          {/* Card: Agent 3 ABCD Morphological Gauges */}
          <div className="glass-card p-6 border border-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3EAE3]">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0D9488]" />
                <h3 className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                  Agent 3: ABCD Morphometry
                </h3>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  agents.a3.suspicion_label === "HIGH"
                    ? "bg-[#E11D48]/15 text-[#E11D48]"
                    : agents.a3.suspicion_label === "MODERATE"
                    ? "bg-[#F59E0B]/15 text-[#F59E0B]"
                    : "bg-[#10B981]/15 text-[#047857]"
                }`}
              >
                Suspicion: {agents.a3.suspicion_label}
              </span>
            </div>

            <div className="space-y-3">
              {/* Asymmetry */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#18181B] mb-1">
                  <span>Asymmetry (A)</span>
                  <span>{Math.round(agents.a3.asymmetry_score * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-[#FAF5F0] rounded-full overflow-hidden border border-[#F3EAE3]">
                  <div
                    className={`h-full rounded-full ${
                      agents.a3.asymmetry_score > 0.6 ? "bg-[#E11D48]" : "bg-[#0D9488]"
                    }`}
                    style={{ width: `${Math.min(100, agents.a3.asymmetry_score * 100)}%` }}
                  />
                </div>
              </div>

              {/* Border Irregularity */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#18181B] mb-1">
                  <span>Border Irregularity (B)</span>
                  <span>{Math.round(agents.a3.border_irregularity_score * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-[#FAF5F0] rounded-full overflow-hidden border border-[#F3EAE3]">
                  <div
                    className={`h-full rounded-full ${
                      agents.a3.border_irregularity_score > 0.6 ? "bg-[#E11D48]" : "bg-[#0D9488]"
                    }`}
                    style={{
                      width: `${Math.min(100, agents.a3.border_irregularity_score * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Color Variegation */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#18181B] mb-1">
                  <span>Color Variegation (C)</span>
                  <span>{Math.round(agents.a3.color_variegation_score * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-[#FAF5F0] rounded-full overflow-hidden border border-[#F3EAE3]">
                  <div
                    className={`h-full rounded-full ${
                      agents.a3.color_variegation_score > 0.6 ? "bg-[#E11D48]" : "bg-[#0D9488]"
                    }`}
                    style={{
                      width: `${Math.min(100, agents.a3.color_variegation_score * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Diameter / Compactness */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#18181B] mb-1">
                  <span>Diameter / Compactness (D)</span>
                  <span>{Math.round(agents.a3.diameter_compactness_score * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-[#FAF5F0] rounded-full overflow-hidden border border-[#F3EAE3]">
                  <div
                    className={`h-full rounded-full ${
                      agents.a3.diameter_compactness_score > 0.6 ? "bg-[#E11D48]" : "bg-[#0D9488]"
                    }`}
                    style={{
                      width: `${Math.min(100, agents.a3.diameter_compactness_score * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FAF5F0] rounded-xl text-[11px] text-[#71717A] flex items-center justify-between">
              <span>Composite Suspicion Score:</span>
              <span className="font-extrabold text-[#18181B]">
                {agents.a3.suspicion_score.toFixed(3)} / 1.000
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT 7 COLUMNS: 5-Card Pipeline + Probability Chart + Safety Audit Log */}
        <div className="lg:col-span-7 space-y-6 min-w-0 w-full">
          {/* TOP: Signature 5-Card Agent Pipeline Strip */}
          <div className="glass-card p-6 border border-white min-w-0">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3EAE3] mb-4">
              <div>
                <h3 className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                  The 6-Agent Consensus Pipeline
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Click any card to inspect mathematical metrics & intermediate representations
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#E85D44] bg-[#E85D44]/10 px-2 py-0.5 rounded-full">
                Interactive Telemetry
              </span>
            </div>

            {/* 5-Card Pipeline Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Card 1: Agent 1 Quality */}
              <button
                type="button"
                onClick={() => setExpandedAgent(expandedAgent === "A1" ? null : "A1")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  expandedAgent === "A1"
                    ? "bg-[#E85D44]/10 border-[#E85D44] shadow-sm"
                    : "bg-white/90 border-[#F3EAE3] hover:border-[#D4C5B9]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#71717A]">A1 Quality</span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${
                      agents.a1.is_usable ? "bg-[#10B981]/20 text-[#047857]" : "bg-[#E11D48]/20 text-[#E11D48]"
                    }`}
                  >
                    {agents.a1.status}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#18181B]">
                  Blur: {agents.a1.blur_score.toFixed(1)}
                </div>
                <div className="text-[10px] text-[#71717A] mt-0.5">
                  Glare: {Math.round(agents.a1.glare_ratio * 100)}%
                </div>
              </button>

              {/* Card 2: Agent 2 Neural */}
              <button
                type="button"
                onClick={() => setExpandedAgent(expandedAgent === "A2" ? null : "A2")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  expandedAgent === "A2"
                    ? "bg-[#E85D44]/10 border-[#E85D44] shadow-sm"
                    : "bg-white/90 border-[#F3EAE3] hover:border-[#D4C5B9]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#71717A]">A2 Neural</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-[#E85D44]/20 text-[#E85D44]">
                    {agents.a2.predicted_class}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#18181B]">
                  {Math.round(agents.a2.confidence * 100)}% Conf
                </div>
                <div className="text-[10px] text-[#71717A] mt-0.5">
                  Entropy: {agents.a2.entropy.toFixed(2)}
                </div>
              </button>

              {/* Card 3: Agents 3 & 4 ABCD + Context */}
              <button
                type="button"
                onClick={() => setExpandedAgent(expandedAgent === "A3_A4" ? null : "A3_A4")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  expandedAgent === "A3_A4"
                    ? "bg-[#E85D44]/10 border-[#E85D44] shadow-sm"
                    : "bg-white/90 border-[#F3EAE3] hover:border-[#D4C5B9]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#71717A]">A3/A4 Priors</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-[#0D9488]/20 text-[#0F766E]">
                    {agents.a4.risk_indicator}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#18181B]">
                  ABCD: {agents.a3.suspicion_label}
                </div>
                <div className="text-[10px] text-[#71717A] mt-0.5">
                  Prior: {agents.a4.prior_multiplier.toFixed(2)}x
                </div>
              </button>

              {/* Card 4: Agent 5 Safety Veto */}
              <button
                type="button"
                onClick={() => setExpandedAgent(expandedAgent === "A5" ? null : "A5")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  expandedAgent === "A5"
                    ? "bg-[#E85D44]/10 border-[#E85D44] shadow-sm"
                    : "bg-white/90 border-[#F3EAE3] hover:border-[#D4C5B9]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#71717A]">A5 Safety</span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${
                      agents.a5.veto_auto_triage
                        ? "bg-[#E11D48]/20 text-[#E11D48]"
                        : "bg-[#10B981]/20 text-[#047857]"
                    }`}
                  >
                    {agents.a5.veto_auto_triage ? "VETO" : "PASS"}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#18181B]">
                  {agents.a5.severity}
                </div>
                <div className="text-[10px] text-[#71717A] mt-0.5 truncate">
                  {agents.a5.triggers.length} Triggers
                </div>
              </button>

              {/* Card 5: Agent 6 Coordinator */}
              <button
                type="button"
                onClick={() => setExpandedAgent(expandedAgent === "A6" ? null : "A6")}
                className={`p-3 rounded-2xl border text-left transition-all col-span-2 sm:col-span-1 ${
                  expandedAgent === "A6"
                    ? "bg-[#E85D44]/10 border-[#E85D44] shadow-sm"
                    : "bg-white/90 border-[#F3EAE3] hover:border-[#D4C5B9]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#71717A]">A6 Coord</span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded ${
                      isAutoTriage
                        ? "bg-[#10B981]/20 text-[#047857]"
                        : "bg-[#E11D48]/20 text-[#E11D48]"
                    }`}
                  >
                    {verdict.decision}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#18181B] truncate">
                  {verdict.decision.replace("_", " ")}
                </div>
                <div className="text-[10px] text-[#71717A] mt-0.5">
                  Final Gate
                </div>
              </button>
            </div>

            {/* Expanded Telemetry Details Drawer */}
            {expandedAgent && (
              <div className="mt-4 p-4 rounded-2xl bg-[#FAF5F0] border border-[#F3EAE3] text-xs text-[#18181B] space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between font-bold border-b border-[#E4D8CF] pb-2">
                  <span>
                    Telemetry Drill-Down:{" "}
                    {expandedAgent === "A1"
                      ? "Agent 1 Optical Physics"
                      : expandedAgent === "A2"
                      ? "Agent 2 Neural Calibration"
                      : expandedAgent === "A3_A4"
                      ? "Agent 3 & 4 Geometry + Prior Fusion"
                      : expandedAgent === "A5"
                      ? "Agent 5 Deterministic Guardrail Check"
                      : "Agent 6 Clinical Disposition"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpandedAgent(null)}
                    className="text-[#71717A] hover:text-[#18181B]"
                  >
                    Close
                  </button>
                </div>

                {expandedAgent === "A1" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>Blur Score: <b>{agents.a1.blur_score.toFixed(2)}</b></div>
                    <div>Illumination: <b>{agents.a1.illumination_score.toFixed(2)}</b></div>
                    <div>Glare Ratio: <b>{agents.a1.glare_ratio.toFixed(3)}</b></div>
                    <div>Is Usable: <b>{agents.a1.is_usable ? "YES" : "NO"}</b></div>
                  </div>
                )}

                {expandedAgent === "A2" && (
                  <div className="space-y-1 text-[11px]">
                    <div>Backbone: <b>EfficientNet-B0 + Demographic Late Fusion</b></div>
                    <div>Shannon Entropy: <b>{agents.a2.entropy.toFixed(3)} (Normalized)</b></div>
                    <div>Top-2 Runner Up: <b>{agents.a2.top2_class} ({Math.round(agents.a2.top2_confidence * 100)}%)</b></div>
                    <div>Malignant Probability Mass: <b>{malMassPercent}%</b></div>
                  </div>
                )}

                {expandedAgent === "A3_A4" && (
                  <div className="space-y-1 text-[11px]">
                    <div>Patient Context: <b>{patient_context.age}y {patient_context.sex} on {patient_context.localization}</b></div>
                    <div>Epidemiological Prior Multiplier: <b>{agents.a4.prior_multiplier.toFixed(2)}x baseline</b></div>
                    <div>Clinical Risk Summary: <i>{agents.a4.clinical_summary}</i></div>
                  </div>
                )}

                {expandedAgent === "A5" && (
                  <div className="space-y-1 text-[11px]">
                    <div>Safety Veto Active: <b>{agents.a5.veto_auto_triage ? "YES - Auto-Triage Blocked" : "NO - Clear"}</b></div>
                    <div>Severity Level: <b>{agents.a5.severity}</b></div>
                    <div>Active Triggers: <b>{agents.a5.triggers.join(", ") || "None"}</b></div>
                    <div>Justification: <i>{agents.a5.justification}</i></div>
                  </div>
                )}

                {expandedAgent === "A6" && (
                  <div className="space-y-1 text-[11px]">
                    <div>Triggered Policy Gate: <b>{verdict.policy_rule_triggered}</b></div>
                    <div>Traceable Rationale: <i>{verdict.traceable_rationale}</i></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MIDDLE: 7-Class Neural Probability Distribution (Agent 2) */}
          <div className="glass-card p-6 border border-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F3EAE3]">
              <div>
                <h3 className="text-xs font-bold text-[#18181B] uppercase tracking-wider flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-[#E85D44]" />
                  Agent 2: 7-Class Calibrated Neural Probabilities
                </h3>
                <p className="text-[11px] text-[#71717A]">
                  Trained EfficientNet-B0 multi-view Test-Time Augmentation
                </p>
              </div>

              {/* Malignant vs Benign Probability Mass Pill */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E11D48]/15 text-[#E11D48]">
                  Malignant: {malMassPercent}%
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#047857]">
                  Benign: {benignMassPercent}%
                </span>
              </div>
            </div>

            {/* Horizontal Bar Chart for all 7 HAM10000 classes */}
            <div className="space-y-2.5">
              {Object.entries(agents.a2.probabilities).map(([code, prob]) => {
                const isPrimary = code === verdict.prediction;
                const isMalignant = MALIGNANT_SET.has(code);
                const percent = Math.round(prob * 100);

                return (
                  <div key={code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isMalignant ? "bg-[#E11D48]" : "bg-[#10B981]"
                          }`}
                        />
                        <span className={isPrimary ? "font-bold text-[#18181B]" : "text-[#71717A]"}>
                          {CLASS_DESCRIPTIONS[code] || code.toUpperCase()}
                        </span>
                        {isPrimary && (
                          <span className="px-1.5 py-0.2 bg-[#E85D44]/10 text-[#E85D44] text-[9px] font-bold rounded">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-bold text-[#18181B]">
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-[#FAF5F0] rounded-full overflow-hidden border border-[#F3EAE3]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPrimary
                            ? isMalignant
                              ? "bg-gradient-to-r from-[#E11D48] to-[#F43F5E]"
                              : "bg-gradient-to-r from-[#10B981] to-[#34D399]"
                            : isMalignant
                            ? "bg-[#FDA4AF]"
                            : "bg-[#A7F3D0]"
                        }`}
                        style={{ width: `${Math.max(2, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM SPLIT: Agent 4 Epidemiological Context & Agent 5 Safety Audit Log */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Agent 4 Demographic Prior */}
            <div className="glass-card p-5 border border-white space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#F3EAE3]">
                <Scale className="w-4 h-4 text-[#0D9488]" />
                <h3 className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                  Agent 4: Context Prior
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F3EAE3]">
                  <span className="text-[#71717A]">Patient Demographics:</span>
                  <span className="font-bold text-[#18181B]">
                    {patient_context.age}y • {patient_context.sex}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3EAE3]">
                  <span className="text-[#71717A]">Anatomical Site:</span>
                  <span className="font-bold text-[#18181B] capitalize">
                    {patient_context.localization}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F3EAE3]">
                  <span className="text-[#71717A]">Prior Odds Multiplier:</span>
                  <span className="font-bold text-[#0D9488]">
                    {agents.a4.prior_multiplier.toFixed(2)}x Baseline
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-[#FAF5F0] rounded-xl text-[11px] text-[#71717A] leading-relaxed">
                {agents.a4.clinical_summary}
              </div>
            </div>

            {/* Right: Agent 5 Safety Guardrail Checklist */}
            <div className="glass-card p-5 border border-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F3EAE3]">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#E85D44]" />
                  <h3 className="text-xs font-bold text-[#18181B] uppercase tracking-wider">
                    Agent 5: Safety Audit
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    agents.a5.veto_auto_triage
                      ? "bg-[#E11D48]/15 text-[#E11D48]"
                      : "bg-[#10B981]/15 text-[#047857]"
                  }`}
                >
                  {agents.a5.veto_auto_triage ? "VETO TRIGGERED" : "SAFETY PASSED"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Gate 1 Quality */}
                <div className="flex items-center justify-between">
                  <span className="text-[#71717A]">1. Optical Quality Gate:</span>
                  <span className={`font-bold ${agents.a1.is_usable ? "text-[#10B981]" : "text-[#E11D48]"}`}>
                    {agents.a1.is_usable ? "[✓] Certified" : "[✗] Inadequate"}
                  </span>
                </div>

                {/* Gate 2 Malignancy Safety */}
                <div className="flex items-center justify-between">
                  <span className="text-[#71717A]">2. Malignancy Pathology Veto:</span>
                  <span
                    className={`font-bold ${
                      MALIGNANT_SET.has(verdict.prediction) ? "text-[#E11D48]" : "text-[#10B981]"
                    }`}
                  >
                    {MALIGNANT_SET.has(verdict.prediction) ? "[!] Refer Required" : "[✓] Benign Mass"}
                  </span>
                </div>

                {/* Gate 3 ABCD Conflict */}
                <div className="flex items-center justify-between">
                  <span className="text-[#71717A]">3. ABCD Suspicion Mismatch:</span>
                  <span
                    className={`font-bold ${
                      agents.a3.suspicion_score > 0.65 ? "text-[#F59E0B]" : "text-[#10B981]"
                    }`}
                  >
                    {agents.a3.suspicion_score > 0.65 ? "[!] Suspicious" : "[✓] Harmonious"}
                  </span>
                </div>

                {/* Gate 4 Auto-Triage Certification */}
                <div className="flex items-center justify-between">
                  <span className="text-[#71717A]">4. Safe Auto-Triage Clearance:</span>
                  <span className={`font-bold ${isAutoTriage ? "text-[#10B981]" : "text-[#E11D48]"}`}>
                    {isAutoTriage ? "[✓] Cleared" : "[✗] Vetoed"}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-[#FAF5F0] rounded-xl text-[11px] text-[#71717A]">
                <b>Coordinator Action:</b> {verdict.policy_rule_triggered}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
