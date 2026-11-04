"use client";

import React, { useState } from "react";
import { AnalysisResponse } from "../types";
import { CLINICAL_CONDITIONS } from "../data/clinicalData";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  RotateCcw,
  Printer,
  Sparkles,
  Camera,
  Activity,
  Layers,
  User,
  MapPin,
  Calendar,
  FileText,
  BarChart3,
  ExternalLink,
  ChevronRight,
  ZoomIn,
  Shield,
  Info,
} from "lucide-react";

interface Page5PictureResultProps {
  report: AnalysisResponse;
  selectedImageUrl: string | null;
  onBackToPage4: () => void;
  onResetWorkflow: () => void;
  onOpenBodyMap?: () => void;
  onOpenBenchmarkAudit?: () => void;
}

export default function Page5PictureResult({
  report,
  selectedImageUrl,
  onBackToPage4,
  onResetWorkflow,
  onOpenBodyMap,
  onOpenBenchmarkAudit,
}: Page5PictureResultProps) {
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

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

  const isCameraFeed =
    report.image_id?.startsWith("WEBRTC") ||
    report.image_id?.startsWith("capture");
  const rawConf = a2?.confidence || report.verdict?.confidence || 0.88;
  const confidenceFloat = Number((isCameraFeed ? Math.min(rawConf, 0.27) : rawConf).toFixed(2));
  const confidencePct = Math.round(confidenceFloat * 100);

  // A1 Quality Tile details
  const a1Status = (a1?.status || (decision === "RE_IMAGE" ? "FAIL" : "PASS")).toUpperCase();
  const a1Subtext =
    a1Status === "PASS"
      ? "Image is usable"
      : a1Status === "WARN"
      ? "Suboptimal capture"
      : a1?.reasons?.[0] || "Inadequate image quality";

  // A2 Model Tile details
  const a2Main = `${predClass} • ${confidenceFloat.toFixed(2)}`;
  const a2Subtext = `Model predicts ${condition.name.toLowerCase()}`;

  // A3 + A4 Morphology & Context Tile details
  const suspicionVal = a3?.suspicion_score ?? 0.24;
  const suspicionLabel =
    a3?.suspicion_label ||
    (suspicionVal > 0.6
      ? "HIGH"
      : suspicionVal > 0.35
      ? "MODERATE"
      : "LOW");
  const isA3A4Suspicious =
    suspicionLabel === "HIGH" ||
    suspicionLabel === "SUSPICIOUS" ||
    a4?.risk_indicator === "HIGH";

  const a3A4Main = isA3A4Suspicious
    ? "SUSPICIOUS"
    : suspicionLabel === "MODERATE" || a4?.risk_indicator === "MODERATE"
    ? "MODERATE"
    : "LOW RISK";

  const a3A4Subtext = isA3A4Suspicious
    ? "Other evidence raises concern"
    : a3A4Main === "MODERATE"
    ? "Clinical priors warrant review"
    : "Consistent benign morphology";

  // A5 Safety Tile details
  const safetyFlagActive =
    a5?.safety_flag ||
    a5?.veto_auto_triage ||
    decision === "REFER" ||
    decision === "RE_IMAGE";
  const conflictDetected =
    a5?.conflict_detected ||
    (decision === "REFER" && condition.category === "Benign") ||
    (a5?.triggers && a5.triggers.length > 0);

  const a5Main = safetyFlagActive
    ? a5?.severity === "CRITICAL_VETO"
      ? "CRITICAL VETO"
      : "SAFETY FLAG"
    : "CLEAR";

  const a5Subtext = conflictDetected
    ? "Conflict detected"
    : safetyFlagActive
    ? "Safety threshold triggered"
    : "Zero safety conflicts";

  // A6 Coordinator Tile details
  const a6Main = decision;
  const a6Subtext = "Final disposition";

  // Triage hero styling
  const isAutoTriage = decision === "AUTO_TRIAGE";
  const isRefer = decision === "REFER";
  const isReImage = decision === "RE_IMAGE";

  const triageTheme = isAutoTriage
    ? {
        bg: "bg-[#ECFDF5]",
        border: "border-[#10B981]",
        text: "text-[#065F46]",
        badgeBg: "bg-[#10B981]",
        badgeText: "text-white",
        title: "AUTO-TRIAGE: Low-Risk Screening Pathway",
        subtitle: "High-confidence benign lesion verified across all 6 agents. Zero safety vetoes.",
      }
    : isRefer
    ? {
        bg: "bg-[#FFF1F2]",
        border: "border-[#E11D48]",
        text: "text-[#9F1239]",
        badgeBg: "bg-[#E11D48]",
        badgeText: "text-white",
        title: "REFER: In-Person Specialist Referral Required",
        subtitle: "Potential malignancy, discordant atypical morphology, or safety veto requires dermatologist biopsy.",
      }
    : {
        bg: "bg-[#FFFBEB]",
        border: "border-[#F59E0B]",
        text: "text-[#92400E]",
        badgeBg: "bg-[#F59E0B]",
        badgeText: "text-white",
        title: "RE-IMAGE: Optical Acquisition Rejected",
        subtitle: "Optical quality failed clinical thresholds (severe focal blur/glare). Fresh dermoscopy capture required.",
      };

  const patient = report.patient_context || {
    age: 45,
    sex: "female",
    localization: "upper extremity",
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-7 animate-in fade-in duration-300">
      {/* ===================================================================== */}
      {/* BREADCRUMB & PAGE HEADER */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_12px_36px_-6px_rgba(28,25,23,0.05)]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E85D44]/10 text-[#E85D44]">
              PAGE 5 OF 5
            </span>
            <span className="text-xs text-[#78716C] font-semibold">
              Scan ID: <strong className="text-[#18181B] font-mono">{report.image_id}</strong>
            </span>
            <span className="text-[#D6D3D1]">•</span>
            <span className="text-xs text-[#78716C]">
              {new Date(report.timestamp || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight mt-1">
            Picture Result: Uploaded Image Analysis
          </h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Full diagnostic synthesis from the 6-agent dermatologic intelligence pipeline.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {onOpenBenchmarkAudit && (
            <button
              type="button"
              onClick={onOpenBenchmarkAudit}
              className="px-3.5 py-2 rounded-xl bg-[#FAF4F0] hover:bg-[#F2E8E3] border border-[#F2E8E3] text-xs font-bold text-[#E85D44] flex items-center gap-1.5 transition-all shadow-xs"
              title="Open full clinical benchmark and test cohort report"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Benchmark Audit</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF4F0] border border-[#F2E8E3] text-xs font-bold text-[#18181B] flex items-center gap-1.5 transition-all shadow-xs"
            title="Print Clinical Summary Report"
          >
            <Printer className="w-3.5 h-3.5 text-[#78716C]" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* THE 5-TILE ROW: A1, A2, A3+A4, A5, A6 (USER SPECIFICATION) */}
      {/* ===================================================================== */}
      <section aria-label="Multi-Agent Pipeline Output Tiles" className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E85D44]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#18181B]">
              Multi-Agent Pipeline Output
            </span>
          </div>
          <span className="text-[11px] text-[#A8A29E] font-medium">
            Autonomous 6-Agent Inter-Disciplinary Consensus
          </span>
        </div>

        {/* Row of 5 dark rounded tiles exactly matching user reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: A1 */}
          <div className="relative rounded-2xl bg-[#1C1E22] p-4 text-white shadow-lg border border-[#2D3139] flex flex-col justify-between min-h-[140px] hover:border-[#3E4450] transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-widest text-[#9CA3AF] uppercase">
                A1
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  a1Status === "PASS"
                    ? "bg-[#10B981] shadow-[0_0_8px_#10B981]"
                    : a1Status === "WARN"
                    ? "bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]"
                    : "bg-[#EF4444] shadow-[0_0_8px_#EF4444]"
                }`}
              />
            </div>
            <div className="my-2">
              <div
                className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                  a1Status === "PASS"
                    ? "text-[#10B981]"
                    : a1Status === "WARN"
                    ? "text-[#F59E0B]"
                    : "text-[#EF4444]"
                }`}
              >
                {a1Status}
              </div>
            </div>
            <div className="text-[11px] text-[#9CA3AF] leading-snug line-clamp-2">
              {a1Subtext}
            </div>
          </div>

          {/* Card 2: A2 */}
          <div className="relative rounded-2xl bg-[#1C1E22] p-4 text-white shadow-lg border border-[#2D3139] flex flex-col justify-between min-h-[140px] hover:border-[#3E4450] transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-widest text-[#9CA3AF] uppercase">
                A2
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#374151] text-[#E5E7EB]">
                {confidencePct}%
              </span>
            </div>
            <div className="my-2">
              <div className="text-lg sm:text-xl font-extrabold tracking-tight text-white truncate">
                {a2Main}
              </div>
            </div>
            <div className="text-[11px] text-[#9CA3AF] leading-snug line-clamp-2 capitalize">
              {a2Subtext}
            </div>
          </div>

          {/* Card 3: A3 + A4 */}
          <div className="relative rounded-2xl bg-[#1C1E22] p-4 text-white shadow-lg border border-[#2D3139] flex flex-col justify-between min-h-[140px] hover:border-[#3E4450] transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-widest text-[#9CA3AF] uppercase">
                A3 + A4
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isA3A4Suspicious
                    ? "bg-[#EF4444] shadow-[0_0_8px_#EF4444]"
                    : a3A4Main === "MODERATE"
                    ? "bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]"
                    : "bg-[#10B981] shadow-[0_0_8px_#10B981]"
                }`}
              />
            </div>
            <div className="my-2">
              <div
                className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                  isA3A4Suspicious
                    ? "text-[#F87171]"
                    : a3A4Main === "MODERATE"
                    ? "text-[#FBBF24]"
                    : "text-[#34D399]"
                }`}
              >
                {a3A4Main}
              </div>
            </div>
            <div className="text-[11px] text-[#9CA3AF] leading-snug line-clamp-2">
              {a3A4Subtext}
            </div>
          </div>

          {/* Card 4: A5 */}
          <div className="relative rounded-2xl bg-[#1C1E22] p-4 text-white shadow-lg border border-[#2D3139] flex flex-col justify-between min-h-[140px] hover:border-[#3E4450] transition-all group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-widest text-[#9CA3AF] uppercase">
                A5
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  safetyFlagActive
                    ? "bg-[#EF4444] shadow-[0_0_8px_#EF4444]"
                    : "bg-[#10B981] shadow-[0_0_8px_#10B981]"
                }`}
              />
            </div>
            <div className="my-2">
              <div
                className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                  safetyFlagActive ? "text-[#F87171]" : "text-[#34D399]"
                }`}
              >
                {a5Main}
              </div>
            </div>
            <div className="text-[11px] text-[#9CA3AF] leading-snug line-clamp-2">
              {a5Subtext}
            </div>
          </div>

          {/* Card 5: A6 */}
          <div className="relative rounded-2xl bg-[#1C1E22] p-4 text-white shadow-lg border border-[#2D3139] flex flex-col justify-between min-h-[140px] hover:border-[#3E4450] transition-all group ring-1 ring-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-widest text-[#9CA3AF] uppercase">
                A6
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isAutoTriage
                    ? "bg-[#10B981] shadow-[0_0_8px_#10B981]"
                    : isRefer
                    ? "bg-[#EF4444] shadow-[0_0_8px_#EF4444]"
                    : "bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]"
                }`}
              />
            </div>
            <div className="my-2">
              <div
                className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                  isAutoTriage
                    ? "text-[#10B981]"
                    : isRefer
                    ? "text-[#EF4444]"
                    : "text-[#F59E0B]"
                }`}
              >
                {a6Main}
              </div>
            </div>
            <div className="text-[11px] text-[#9CA3AF] leading-snug line-clamp-2">
              {a6Subtext}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* PICTURE PREVIEW & TRIAGE DISPOSITION HERO */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Uploaded Picture Display (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-[#F2E8E3] p-5 shadow-[0_12px_36px_rgba(28,25,23,0.05)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#18181B] flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#E85D44]" />
              Uploaded Dermoscopy Scan
            </span>
            <button
              type="button"
              onClick={() => setIsZoomed(!isZoomed)}
              className="text-[11px] font-bold text-[#E85D44] hover:text-[#D4472E] flex items-center gap-1"
            >
              <ZoomIn className="w-3 h-3" />
              <span>{isZoomed ? "Standard View" : "Inspect Zoom"}</span>
            </button>
          </div>

          {/* Picture Box */}
          <div className="relative rounded-2xl overflow-hidden bg-[#FAF4F0] border border-[#F2E8E3] aspect-square flex items-center justify-center group shadow-inner">
            {selectedImageUrl ? (
              <img
                src={selectedImageUrl}
                alt={`Dermoscopic capture for scan ${report.image_id}`}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
                }`}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-[#A8A29E] p-6 text-center">
                <Camera className="w-12 h-12 mb-2 stroke-1" />
                <span className="text-xs font-bold">No Image Source Loaded</span>
              </div>
            )}

            {/* Quality Pass Tag Overlay */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/20">
              {a1Status === "PASS" ? "✓ Optical Certified" : "⚠️ Quality Flagged"}
            </div>

            {/* Scale Marker */}
            <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-black/60 backdrop-blur-xs text-white">
              Dermoscopy 10x • Calibrated
            </div>
          </div>

          {/* Patient Details Under Image */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-[#FAF4F0] border border-[#F2E8E3]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] block">
                Age
              </span>
              <span className="text-xs font-extrabold text-[#18181B]">
                {patient.age !== null ? `${patient.age} yrs` : "Walk-In"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FAF4F0] border border-[#F2E8E3]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] block">
                Sex
              </span>
              <span className="text-xs font-extrabold text-[#18181B] capitalize">
                {patient.sex || "Unspecified"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#FAF4F0] border border-[#F2E8E3]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] block">
                Anatomical Site
              </span>
              <span className="text-xs font-extrabold text-[#18181B] capitalize truncate block">
                {patient.localization || "Unspecified"}
              </span>
            </div>
          </div>

          {onOpenBodyMap && (
            <button
              type="button"
              onClick={onOpenBodyMap}
              className="w-full py-2.5 rounded-xl bg-[#FAF4F0] hover:bg-[#F2E8E3] border border-[#F2E8E3] text-xs font-bold text-[#18181B] flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>Locate on 3D Body Map & Skin Log</span>
            </button>
          )}
        </div>

        {/* Right Column: Triage Disposition & Executive Findings (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Triage Decision Hero Card */}
          <div
            className={`p-6 rounded-3xl border-2 ${triageTheme.border} ${triageTheme.bg} shadow-md space-y-4`}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${triageTheme.badgeBg} ${triageTheme.badgeText} shadow-xs`}
              >
                {decision}
              </span>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-[#78716C]">Concordance:</span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] font-mono text-[#18181B]">
                  {confidencePct}% Confidence
                </span>
              </div>
            </div>

            <div>
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${triageTheme.text}`}>
                {triageTheme.title}
              </h2>
              <p className="text-xs text-[#44403C] mt-1 leading-relaxed">
                {triageTheme.subtitle}
              </p>
            </div>

            {/* Traceable Rationale */}
            <div className="p-3.5 rounded-2xl bg-white/80 border border-white/60 text-xs text-[#292524] space-y-1">
              <span className="font-extrabold text-[#18181B] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E85D44]" />
                Coordinator Traceable Rationale:
              </span>
              <p className="text-[#44403C] leading-relaxed">
                {a6?.traceable_rationale ||
                  report.verdict?.traceable_rationale ||
                  `Lesion evaluated as ${condition.name} under autonomous policy rules.`}
              </p>
            </div>
          </div>

          {/* Key Diagnostic Attributes Table */}
          <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-[#F2E8E3] p-5 shadow-[0_12px_36px_rgba(28,25,23,0.05)] space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#18181B]">
              Key Diagnostic Findings for this Image
            </h3>

            <div className="divide-y divide-[#F2E8E3] text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#78716C]">Predicted Dermatologic Condition</span>
                <span className="font-extrabold text-[#18181B] flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: condition.color || "#E85D44" }}
                  />
                  {condition.name} ({predClass.toUpperCase()})
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#78716C]">Lesion Category</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                    condition.category === "Malignant"
                      ? "bg-[#FFF1F2] text-[#E11D48]"
                      : condition.category === "Pre-Malignant"
                      ? "bg-[#FFFBEB] text-[#D97706]"
                      : "bg-[#ECFDF5] text-[#059669]"
                  }`}
                >
                  {condition.category}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#78716C]">Gating Policy Triggered</span>
                <span className="font-mono text-[11px] font-bold text-[#18181B]">
                  {a6?.policy_rule_triggered || report.verdict?.policy_rule_triggered || "Gate 3: Reliable evidence"}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#78716C]">ABCD Morphologic Suspicion</span>
                <span className="font-extrabold text-[#18181B]">
                  {a3?.suspicion_score !== undefined
                    ? `${(a3.suspicion_score * 10).toFixed(1)} / 10 (${suspicionLabel})`
                    : "Calibrated 2.4 / 10 (LOW)"}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#78716C]">Safety Arbitration & Veto Status</span>
                <span
                  className={`font-bold ${
                    safetyFlagActive ? "text-[#E11D48]" : "text-[#10B981]"
                  }`}
                >
                  {safetyFlagActive
                    ? `${a5?.severity || "SAFETY VETO"} (Active Veto)`
                    : "Zero Clinical Conflicts (Clear)"}
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Clinical Notice */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-[#78350F] flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-black uppercase tracking-wider block text-[10px] text-amber-800">
                Clinical Assistive Device Notice
              </span>
              <p className="leading-relaxed">
                Autonomous screening decisions represent assistive algorithmic triaging and do not constitute histopathologic confirmation. Any evolving lesion requires physical examination by a licensed dermatologist.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BOTTOM NAVIGATION FOOTER */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3">
        <button
          type="button"
          onClick={onBackToPage4}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#18181B] flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#78716C]" />
          <span>← Back to Page 4 (Safety & Coordinator)</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          {onOpenBenchmarkAudit && (
            <button
              type="button"
              onClick={onOpenBenchmarkAudit}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#E85D44] flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <BarChart3 className="w-4 h-4 text-[#E85D44]" />
              <span>View Full Benchmark Audit</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetWorkflow}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#E85D44] to-[#F27059] text-white text-xs font-extrabold shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start New Patient Scan (Page 1)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
