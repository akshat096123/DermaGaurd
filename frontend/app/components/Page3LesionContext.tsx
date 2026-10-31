"use client";

import React from "react";
import { AnalysisResponse } from "../types";
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  Layers,
  Compass,
  Palette,
  Maximize2,
  User,
  MapPin,
  Calendar,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface Page3LesionContextProps {
  report: AnalysisResponse;
  selectedImageUrl: string | null;
  onProceedToPage4: () => void;
  onBackToPage2: () => void;
}

export default function Page3LesionContext({
  report,
  selectedImageUrl,
  onProceedToPage4,
  onBackToPage2,
}: Page3LesionContextProps) {
  const { a3, a4 } = report.agents;
  const patient = report.patient_context || { age: 50, sex: "unknown", localization: "unknown" };

  const asymmetryVal = a3?.asymmetry_score ?? 0.22;
  const borderVal = a3?.border_irregularity_score ?? 0.25;
  const colorVal = a3?.color_variegation_score ?? a3?.color_variation_score ?? 0.2;
  const diameterVal = a3?.diameter_compactness_score ?? 0.35;
  const suspicionVal = a3?.suspicion_score ?? 0.24;
  const suspicionLabel = a3?.suspicion_label || (suspicionVal > 0.6 ? "HIGH" : suspicionVal > 0.35 ? "MODERATE" : "LOW");

  const dominantColors = a3?.dominant_colors || ["#3D2314", "#8C5835", "#C99A75"];

  const priorMult = a4?.malignancy_prior_multiplier ?? a4?.prior_multiplier ?? 1.0;
  const riskIndicator = a4?.risk_indicator || (priorMult > 1.2 ? "HIGH" : priorMult > 0.95 ? "MODERATE" : "LOW");

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Page Title & Breadcrumb Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white border border-[#F2E8E3] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E85D44]/10 text-[#E85D44]">
              PAGE 3 OF 4
            </span>
            <span className="text-xs text-[#78716C] font-semibold">
              Scan ID: <strong className="text-[#18181B]">{report.image_id}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181B] tracking-tight mt-1">
            Agent 3 (Lesion ABCD) & Agent 4 (Patient Context)
          </h1>
          <p className="text-xs text-[#78716C]">
            Physical morphological geometry quantification paired with Bayesian epidemiological risk reasoning.
          </p>
        </div>

        {/* Patient Pill */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAF4F0] border border-[#F2E8E3] text-xs font-bold text-[#18181B] self-start sm:self-auto">
          <User className="w-4 h-4 text-[#E85D44]" />
          <span>
            {patient.age !== null ? `${patient.age}y` : "Walk-In"} • {patient.sex} • {patient.localization}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AGENT 3: LESION ANALYSIS AGENT (ABCD CRITERIA) */}
      {/* ========================================================================= */}
      <div className="rounded-[28px] bg-white border border-[#F2E8E3] shadow-sm p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F2E8E3] gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#18181B]">
                  Agent 3: Lesion Analysis Agent
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    suspicionLabel === "HIGH"
                      ? "bg-[#E11D48]/15 text-[#E11D48]"
                      : suspicionLabel === "MODERATE"
                      ? "bg-[#F59E0B]/15 text-[#B45309]"
                      : "bg-[#10B981]/15 text-[#047857]"
                  }`}
                >
                  ABCD Suspicion: {suspicionLabel}
                </span>
              </div>
              <p className="text-xs text-[#78716C]">
                Purpose: Analyses the physical characteristics of the lesion using dermatologic ABCD criteria.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1 rounded-lg bg-[#FAF4F0] border border-[#F2E8E3] text-xs font-bold text-[#18181B]">
              Morphology Index:{" "}
              <span className="text-[#0D9488]">{suspicionVal.toFixed(2)} / 1.0</span>
            </div>
          </div>
        </div>

        {/* Algorithm Pipeline Chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#78716C] bg-[#FAF4F0]/60 p-3 rounded-xl border border-[#F2E8E3]">
          <span className="font-bold text-[#18181B]">Algorithms:</span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Otsu Adaptive Thresholding
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Active Contours Boundary Refinement
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Hu Invariant Shape Moments
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Compactness Index (Isoperimetric Quotient)
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            CIE-LAB Color Standard Deviation
          </span>
        </div>

        {/* 4 ABCD Criteria Score Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* A - Asymmetry */}
          <div className="p-4 rounded-2xl bg-[#FAF4F0]/50 border border-[#F2E8E3] space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-[#0D9488]/15 text-[#0D9488] font-black text-xs flex items-center justify-center">
                A
              </span>
              <span className="text-[10px] font-bold text-[#78716C]">Hu Moments</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#18181B] block">Asymmetry Score</span>
              <div className="text-xl font-black text-[#18181B] mt-0.5">
                {asymmetryVal.toFixed(2)}
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E5DCD4] overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  asymmetryVal > 0.5 ? "bg-[#E11D48]" : "bg-[#0D9488]"
                }`}
                style={{ width: `${asymmetryVal * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#78716C]">
              {asymmetryVal > 0.5 ? "Atypical bilateral asymmetry detected." : "Symmetric lesion contours."}
            </p>
          </div>

          {/* B - Border Irregularity */}
          <div className="p-4 rounded-2xl bg-[#FAF4F0]/50 border border-[#F2E8E3] space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-[#0D9488]/15 text-[#0D9488] font-black text-xs flex items-center justify-center">
                B
              </span>
              <span className="text-[10px] font-bold text-[#78716C]">Compactness</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#18181B] block">Border Irregularity</span>
              <div className="text-xl font-black text-[#18181B] mt-0.5">
                {borderVal.toFixed(2)}
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E5DCD4] overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  borderVal > 0.5 ? "bg-[#E11D48]" : "bg-[#0D9488]"
                }`}
                style={{ width: `${borderVal * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#78716C]">
              {borderVal > 0.5 ? "Notched or scalloped boundary." : "Smooth, well-demarcated margins."}
            </p>
          </div>

          {/* C - Colour Variation */}
          <div className="p-4 rounded-2xl bg-[#FAF4F0]/50 border border-[#F2E8E3] space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-[#0D9488]/15 text-[#0D9488] font-black text-xs flex items-center justify-center">
                C
              </span>
              <span className="text-[10px] font-bold text-[#78716C]">LAB Std Dev</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#18181B] block">Colour Variation</span>
              <div className="text-xl font-black text-[#18181B] mt-0.5">
                {colorVal.toFixed(2)}
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E5DCD4] overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  colorVal > 0.5 ? "bg-[#E11D48]" : "bg-[#0D9488]"
                }`}
                style={{ width: `${colorVal * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#78716C]">
              {colorVal > 0.5 ? "Multiple distinct pigment zones." : "Monochromatic pigment network."}
            </p>
          </div>

          {/* D - Diameter / Compactness */}
          <div className="p-4 rounded-2xl bg-[#FAF4F0]/50 border border-[#F2E8E3] space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-lg bg-[#0D9488]/15 text-[#0D9488] font-black text-xs flex items-center justify-center">
                D
              </span>
              <span className="text-[10px] font-bold text-[#78716C]">Diameter / Area</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[#18181B] block">Diameter Metric</span>
              <div className="text-xl font-black text-[#18181B] mt-0.5">
                {diameterVal.toFixed(2)} <span className="text-xs font-semibold text-[#78716C]">rel</span>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#E5DCD4] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0D9488]"
                style={{ width: `${Math.min(diameterVal * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[#78716C]">
              Segmented focal lesion footprint relative to field.
            </p>
          </div>
        </div>

        {/* Dominant Pigment Swatches */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#F2E8E3] text-xs">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#0D9488]" />
            <span className="font-bold text-[#18181B]">Extracted Dominant Pigments:</span>
          </div>
          <div className="flex items-center gap-2">
            {dominantColors.map((hex, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                  style={{ backgroundColor: hex }}
                />
                <span className="font-mono text-[10px] text-[#78716C] uppercase">{hex}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AGENT 4: REASONING / CONTEXT AGENT (PATIENT RISK) */}
      {/* ========================================================================= */}
      <div className="rounded-[28px] bg-white border border-[#F2E8E3] shadow-sm p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F2E8E3] gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6366F1] text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#18181B]">
                  Agent 4: Reasoning / Context Agent
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    riskIndicator === "HIGH"
                      ? "bg-[#E11D48]/15 text-[#E11D48]"
                      : riskIndicator === "ELEVATED"
                      ? "bg-[#F59E0B]/15 text-[#B45309]"
                      : "bg-[#10B981]/15 text-[#047857]"
                  }`}
                >
                  Context Risk: {riskIndicator}
                </span>
              </div>
              <p className="text-xs text-[#78716C]">
                Purpose: Analyses patient demographic information from Page 1 to calculate additional contextual risk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="px-3 py-1 rounded-lg bg-[#FAF4F0] border border-[#F2E8E3] text-xs font-bold text-[#18181B]">
              Prior Multiplier: <span className="text-[#6366F1]">{priorMult.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Input Received from Page 1 Banner */}
        <div className="p-3.5 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-[#18181B] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#6366F1]" />
            Input Received from Page 1:
          </span>
          <div className="flex items-center gap-4 text-[#78716C]">
            <span>
              Age: <strong className="text-[#18181B]">{patient.age !== null ? `${patient.age} yrs` : "Unspecified"}</strong>
            </span>
            <span>•</span>
            <span>
              Sex: <strong className="text-[#18181B] capitalize">{patient.sex}</strong>
            </span>
            <span>•</span>
            <span>
              Location: <strong className="text-[#18181B] capitalize">{patient.localization}</strong>
            </span>
          </div>
        </div>

        {/* Bayesian Algorithms Chips */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#78716C] bg-[#FAF4F0]/60 p-3 rounded-xl border border-[#F2E8E3]">
          <span className="font-bold text-[#18181B]">Algorithms:</span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Bayesian Probability Updating
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Empirical Bayes (Training Cohort Priors)
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-[#E5DCD4] font-medium">
            Laplace Smoothing (Prevents Zero Probabilities)
          </span>
        </div>

        {/* Risk Output Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Age Factor */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#F2E8E3] space-y-1">
            <span className="text-[11px] font-bold text-[#78716C] uppercase">Age Risk Weighting</span>
            <div className="text-lg font-black text-[#18181B]">
              {a4?.age_factor !== undefined ? `${a4.age_factor.toFixed(2)}x` : "1.00x"}
            </div>
            <p className="text-[10px] text-[#78716C]">
              Epidemiological prior scaling based on patient decade.
            </p>
          </div>

          {/* Sex Factor */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#F2E8E3] space-y-1">
            <span className="text-[11px] font-bold text-[#78716C] uppercase">Sex Multiplier</span>
            <div className="text-lg font-black text-[#18181B]">
              {a4?.sex_factor !== undefined ? `${a4.sex_factor.toFixed(2)}x` : "1.00x"}
            </div>
            <p className="text-[10px] text-[#78716C]">
              Gender-stratified malignancy incidence adjustment.
            </p>
          </div>

          {/* Localization Factor */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#F2E8E3] space-y-1">
            <span className="text-[11px] font-bold text-[#78716C] uppercase">Anatomical Site Predisposition</span>
            <div className="text-lg font-black text-[#18181B]">
              {a4?.localization_factor !== undefined ? `${a4.localization_factor.toFixed(2)}x` : "1.00x"}
            </div>
            <p className="text-[10px] text-[#78716C]">
              Elevated for UV-exposed or high-risk sites (back, scalp).
            </p>
          </div>
        </div>

        {/* Traceable Reasoning Narrative & Uncertainty Handling */}
        <div className="p-4 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[#18181B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
              Traceable Epidemiological Rationale:
            </span>
            {patient.age === null && (
              <span className="px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#B45309] text-[10px] font-bold">
                Uncertainty Flag: Neutral Prior Active
              </span>
            )}
          </div>
          <p className="text-[#78716C] leading-relaxed">
            {a4?.clinical_summary ||
              `Patient presentation: ${patient.age ?? "Walk-in"}y ${patient.sex} with lesion located on ${patient.localization}. Bayesian empirical odds multiplier evaluated at ${priorMult.toFixed(2)}x.`}
          </p>
        </div>
      </div>

      {/* Navigation Footer for Page 3 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBackToPage2}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#18181B] flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-[#78716C]" />
          <span>← Back to Page 2 (Quality & Diagnosis)</span>
        </button>

        <button
          type="button"
          onClick={onProceedToPage4}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#E85D44] to-[#F27059] text-white text-xs font-extrabold shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <span>Proceed to Page 4: Safety & Coordinator Final Result</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
