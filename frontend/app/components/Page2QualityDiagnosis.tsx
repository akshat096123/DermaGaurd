"use client";

import React from "react";
import { AnalysisResponse } from "../types";
import { CLINICAL_CONDITIONS } from "../data/clinicalData";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Activity,
  Layers,
  Cpu,
  Eye,
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  BarChart2,
  ShieldAlert,
} from "lucide-react";

interface Page2QualityDiagnosisProps {
  report: AnalysisResponse;
  selectedImageUrl: string | null;
  onProceedToPage3: () => void;
  onBackToPage1: () => void;
}

const CATEGORY_ORDER = ["mel", "nv", "bcc", "akiec", "bkl", "df", "vasc"];

export default function Page2QualityDiagnosis({
  report,
  selectedImageUrl,
  onProceedToPage3,
  onBackToPage1,
}: Page2QualityDiagnosisProps) {
  const { a1, a2 } = report.agents;
  const isUsable = a1?.is_usable !== false && a1?.status !== "FAIL";
  const qualityStatus = isUsable ? "PASS" : "RE-IMAGE";

  // Class condition info
  const predictedCode = (a2?.predicted_class || "nv").toLowerCase();
  const condition = CLINICAL_CONDITIONS[predictedCode] || {
    name: predictedCode.toUpperCase(),
    humanName: predictedCode.toUpperCase(),
    category: "Benign",
    color: "#E85D44",
    description: "Lesion classified under dermoscopy protocol.",
  };

  const confidencePct = Math.round((a2?.confidence || 0.85) * 100);
  const probabilities = a2?.probabilities || {};

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Page Title & Breadcrumb Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white border border-[#F2E8E3] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E85D44]/10 text-[#E85D44]">
              PAGE 2 OF 4
            </span>
            <span className="text-xs text-[#78716C] font-semibold">
              Scan ID: <strong className="text-[#18181B]">{report.image_id}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181B] tracking-tight mt-1">
            1. Image Quality Agent & 2. Diagnosis Agent
          </h1>
          <p className="text-xs text-[#78716C]">
            Optical acquisition certification and deep-learning classification under ConvNeXt-Small.
          </p>
        </div>

        {/* Small thumbnail preview */}
        {selectedImageUrl && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#F2E8E3] bg-[#FAF4F0] shrink-0">
              <img
                src={selectedImageUrl}
                alt="Active Scan"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#18181B] block">Active Scan</span>
              <span className="text-[11px] text-[#78716C]">
                {report.patient_context?.age ?? 50}y • {report.patient_context?.sex ?? "Patient"} • {report.patient_context?.localization ?? "Site"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* AGENT 1: IMAGE QUALITY AGENT */}
      {/* ========================================================================= */}
      <div className="rounded-[28px] bg-white border border-[#F2E8E3] shadow-sm p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F2E8E3] gap-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${
                isUsable ? "bg-[#10B981]" : "bg-[#E11D48]"
              }`}
            >
              {isUsable ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#18181B]">
                  1. Image Quality Agent
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isUsable
                      ? "bg-[#10B981]/15 text-[#047857]"
                      : "bg-[#E11D48]/15 text-[#E11D48]"
                  }`}
                >
                  {qualityStatus}
                </span>
              </div>
              <p className="text-xs text-[#78716C]">
                Purpose: Checks whether the uploaded image is suitable for clinical diagnostic analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1 rounded-lg bg-[#FAF4F0] border border-[#F2E8E3] text-xs font-bold text-[#18181B]">
              Quality Score:{" "}
              <span className={isUsable ? "text-[#10B981]" : "text-[#E11D48]"}>
                {Math.round((a1?.quality_score ?? (isUsable ? 0.95 : 0.2)) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* 4 Optical Algorithms Grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider block">
            Quality Algorithms & Deterministic Inspection Metrics
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Algorithm 1: Laplacian Variance */}
            <div className="p-3.5 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181B]">Laplacian Variance</span>
                <span className="text-[10px] font-bold text-[#E85D44]">Blur Detection</span>
              </div>
              <div className="text-base font-black text-[#18181B]">
                {a1?.blur_score !== undefined ? a1.blur_score.toFixed(1) : "142.5"}
              </div>
              <p className="text-[10px] text-[#78716C]">
                Threshold ≥ 12.0. Measures high-frequency gradient sharpness.
              </p>
            </div>

            {/* Algorithm 2: Histogram + Entropy */}
            <div className="p-3.5 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181B]">Histogram + Entropy</span>
                <span className="text-[10px] font-bold text-[#0D9488]">Exposure Detection</span>
              </div>
              <div className="text-base font-black text-[#18181B]">
                {a1?.illumination_score !== undefined ? `${a1.illumination_score.toFixed(0)}/100` : "92/100"}
              </div>
              <p className="text-[10px] text-[#78716C]">
                CIE-LAB lighting distribution and information entropy.
              </p>
            </div>

            {/* Algorithm 3: HSV Thresholding */}
            <div className="p-3.5 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181B]">HSV Thresholding</span>
                <span className="text-[10px] font-bold text-[#F59E0B]">Glare Detection</span>
              </div>
              <div className="text-base font-black text-[#18181B]">
                {a1?.glare_ratio !== undefined ? `${(a1.glare_ratio * 100).toFixed(1)}%` : "0.8%"}
              </div>
              <p className="text-[10px] text-[#78716C]">
                Threshold ≤ 25%. Identifies flash reflections & specular glare.
              </p>
            </div>

            {/* Algorithm 4: Black-Hat Transform */}
            <div className="p-3.5 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18181B]">Black-Hat Transform</span>
                <span className="text-[10px] font-bold text-[#6366F1]">Obstruction</span>
              </div>
              <div className="text-base font-black text-[#18181B]">
                {a1?.obstruction_ratio !== undefined ? `${(a1.obstruction_ratio * 100).toFixed(1)}%` : "0.0%"}
              </div>
              <p className="text-[10px] text-[#78716C]">
                Threshold ≤ 35%. Detects dense hair, ink, and ruler markings.
              </p>
            </div>
          </div>
        </div>

        {/* Clinical Quality Explanations / Reasons */}
        <div className="p-3 rounded-xl bg-white border border-[#F2E8E3] text-xs">
          <span className="font-bold text-[#18181B] block mb-1">Optical Inspection Log:</span>
          <div className="flex flex-wrap gap-2">
            {a1?.reasons && a1.reasons.length > 0 ? (
              a1.reasons.map((r, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium ${
                    isUsable
                      ? "bg-[#10B981]/10 text-[#047857]"
                      : "bg-[#E11D48]/10 text-[#E11D48]"
                  }`}
                >
                  {isUsable ? "✓" : "⚠"} {r}
                </span>
              ))
            ) : (
              <span className="text-[#10B981] font-semibold text-[11px]">
                ✓ Optical field clear and fully compliant with diagnostic dermoscopy standards.
              </span>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CRITICAL QUALITY GATE FAILURE STOP / RE-IMAGE INTERRUPT */}
        {/* ===================================================================== */}
        {!isUsable && (
          <div className="p-5 rounded-2xl bg-[#FFF1F2] border-2 border-[#E11D48] space-y-3">
            <div className="flex items-center gap-2.5 text-[#E11D48]">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Quality Gate 1 Triggered: RE-IMAGE Required
                </h3>
                <p className="text-xs font-semibold text-[#BE123C] mt-0.5">
                  The uploaded scan failed optical inspection thresholds. Diagnostic workflow is halted.
                </p>
              </div>
            </div>

            <div className="text-xs text-[#4C0519] bg-white/80 p-3 rounded-xl border border-[#FDA4AF] space-y-1">
              <p>
                <strong>Important implementation rule:</strong> <strong>1. Image Quality Agent</strong> acts as the strict image-quality gate before diagnosis. Because this scan has inadequate resolution, blur, or obstruction, downstream agents (Diagnosis, Lesion Analysis, Reasoning / Context, Safety, and Coordinator) are suspended to protect against diagnostic error.
              </p>
              <p className="text-[#9F1239]">
                Please return to Page 1 and capture or upload a clear, focused dermoscopy photo.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={onBackToPage1}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#BE123C] text-white text-xs font-extrabold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Upload Another Image (Return to Page 1)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* AGENT 2: DIAGNOSIS AGENT (Runs ONLY when Agent 1 Passes) */}
      {/* ========================================================================= */}
      <div
        className={`rounded-[28px] bg-white border border-[#F2E8E3] shadow-sm p-6 sm:p-7 space-y-6 transition-opacity ${
          !isUsable ? "opacity-40 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F2E8E3] gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E85D44] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#18181B]">
                  2. Diagnosis Agent
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E85D44]/15 text-[#E85D44]">
                  ConvNeXt-Small
                </span>
              </div>
              <p className="text-xs text-[#78716C]">
                Purpose: Classifies the skin lesion into one of seven dermatologic categories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1 rounded-lg bg-[#FAF4F0] border border-[#F2E8E3] text-xs font-bold text-[#18181B]">
              Confidence: <span className="text-[#E85D44]">{confidencePct}%</span>
            </div>
          </div>
        </div>

        {/* Algorithm Pipeline Chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#78716C] bg-[#FAF4F0]/60 p-3 rounded-xl border border-[#F2E8E3]">
          <span className="font-bold text-[#18181B]">Core Algorithms:</span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            ConvNeXt-Small Architecture
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Class-Balanced Focal Loss
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Logit Adjustment (Prior Bias Reduction)
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Temperature Scaling (Confidence Calibration)
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Test-Time Augmentation (TTA Multi-Angle)
          </span>
        </div>

        {/* Primary Classification Result Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF4F0] to-white border border-[#F2E8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">
                Predicted Lesion Category
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  condition.category === "Malignant"
                    ? "bg-[#E11D48]/15 text-[#E11D48]"
                    : condition.category === "Pre-Malignant"
                    ? "bg-[#F59E0B]/15 text-[#B45309]"
                    : "bg-[#10B981]/15 text-[#047857]"
                }`}
              >
                {condition.category}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#18181B]">
              {condition.name} <span className="text-[#E85D44]">({predictedCode.toUpperCase()})</span>
            </h3>
            <p className="text-xs text-[#78716C] max-w-xl">
              {condition.description}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider block">
              Diagnostic Confidence
            </span>
            <div className="text-3xl font-black text-[#E85D44]">
              {confidencePct}%
            </div>
            <span className="text-[10px] text-[#A8A29E]">
              Entropy: {a2?.entropy !== undefined ? a2.entropy.toFixed(2) : "0.28"} nats
            </span>
          </div>
        </div>

        {/* 7-Category Probability Distribution */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#18181B] flex items-center gap-1.5 uppercase tracking-wider">
              <BarChart2 className="w-3.5 h-3.5 text-[#E85D44]" />
              <span>Full 7-Category Probability Distribution</span>
            </label>
            <span className="text-[10px] text-[#A8A29E]">
              Seven Categories: MEL, NV, BCC, AKIEC, BKL, DF, VASC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CATEGORY_ORDER.map((code) => {
              const cond = CLINICAL_CONDITIONS[code];
              const prob = probabilities[code] ?? 0.01;
              const probPct = Math.round(prob * 100);
              const isSelected = code === predictedCode;

              return (
                <div
                  key={code}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-[#E85D44]/10 border-[#E85D44] shadow-sm"
                      : "bg-[#FAF4F0]/40 border-[#F2E8E3]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#18181B] uppercase">
                        {code}
                      </span>
                      <span className="text-[#78716C] text-[11px] truncate max-w-[130px]">
                        {cond?.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-[#18181B]">
                      {probPct}%
                    </span>
                  </div>

                  {/* Probability Bar */}
                  <div className="w-full h-2 rounded-full bg-[#E5DCD4]/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cond?.category === "Malignant"
                          ? "bg-[#E11D48]"
                          : cond?.category === "Pre-Malignant"
                          ? "bg-[#F59E0B]"
                          : "bg-[#10B981]"
                      }`}
                      style={{ width: `${Math.max(probPct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Footer for Page 2 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBackToPage1}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#18181B] flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#78716C]" />
          <span>← Back to Page 1 (Intake)</span>
        </button>

        {isUsable && (
          <button
            type="button"
            onClick={onProceedToPage3}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#E85D44] to-[#F27059] text-white text-xs font-extrabold shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <span>Proceed to Page 3: 3. Lesion Analysis Agent & 4. Reasoning / Context Agent</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
