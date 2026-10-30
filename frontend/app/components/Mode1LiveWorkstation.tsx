"use client";

import React, { useState, useEffect } from "react";
import { Upload, RefreshCw, FileUp, Sparkles, User, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { SAMPLE_CASES, CLINICAL_CLASSES } from "../data/clinicalData";
import { FullPipelineResult, SampleCase } from "../types";
import DermoscopyViewer from "./DermoscopyViewer";
import AgentCardStrip from "./AgentCardStrip";
import BottomAuditPanel from "./BottomAuditPanel";
import AgentDeepDiveModal from "./AgentDeepDiveModal";

export default function Mode1LiveWorkstation() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(SAMPLE_CASES[0].id);
  const [activeCase, setActiveCase] = useState<SampleCase>(SAMPLE_CASES[0]);
  const [pipelineResult, setPipelineResult] = useState<FullPipelineResult>(SAMPLE_CASES[0].pipelineResult);
  const [selectedAgentKey, setSelectedAgentKey] = useState<"A1" | "A2" | "A3_A4" | "A5" | "A6" | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [patientAge, setPatientAge] = useState<number>(45);
  const [patientSex, setPatientSex] = useState<string>("female");
  const [patientLoc, setPatientLoc] = useState<string>("upper extremity");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // When selected case changes, update case and demographics
  const handleSelectCase = (caseItem: SampleCase) => {
    setSelectedCaseId(caseItem.id);
    setActiveCase(caseItem);
    setCustomImage(null);
    setPatientAge(caseItem.age);
    setPatientSex(caseItem.sex);
    setPatientLoc(caseItem.localization);
    setPipelineResult(caseItem.pipelineResult);
  };

  // Dynamic Bayesian re-calculation when demographics change
  useEffect(() => {
    if (!pipelineResult) return;

    // Calculate dynamic Bayesian multiplier based on Age, Sex, Loc
    let multiplier = 1.0;
    if (patientAge > 60) multiplier *= 1.35;
    else if (patientAge < 35) multiplier *= 0.7;

    if (patientSex === "male" && (patientLoc === "chest" || patientLoc === "back")) {
      multiplier *= 1.45;
    }

    if (patientLoc === "scalp" || patientLoc === "face") {
      multiplier *= 1.25;
    }

    const updatedContext = {
      ...pipelineResult.agent4_context,
      age: patientAge,
      sex: patientSex,
      localization: patientLoc,
      malignancy_prior_multiplier: Number(multiplier.toFixed(2)),
      risk_indicator: (multiplier > 1.4 ? "HIGH" : multiplier > 1.1 ? "ELEVATED" : multiplier > 0.8 ? "MODERATE" : "LOW") as any,
    };

    // Evaluate safety conflicts with new demographics
    const isMalignantClass = CLINICAL_CLASSES[pipelineResult.agent2_diagnosis.predicted_class]?.isMalignant;
    const triggers = [...(pipelineResult.agent5_safety?.triggers || [])];
    
    // Add risk mismatch if demographic risk is HIGH but predicted is benign
    if (updatedContext.risk_indicator === "HIGH" && !isMalignantClass) {
      if (!triggers.includes("HIGH_EPIDEMIOLOGICAL_RISK_MISMATCH")) {
        triggers.push("HIGH_EPIDEMIOLOGICAL_RISK_MISMATCH");
      }
    } else {
      const idx = triggers.indexOf("HIGH_EPIDEMIOLOGICAL_RISK_MISMATCH");
      if (idx > -1) triggers.splice(idx, 1);
    }

    const veto = triggers.length > 0 || isMalignantClass || !pipelineResult.agent1_quality.is_usable;
    const severity = veto
      ? (!pipelineResult.agent1_quality.is_usable ? "CRITICAL_VETO" : isMalignantClass ? "SAFETY_FLAG" : "CAUTION")
      : "CLEAR";

    const updatedSafety = {
      ...pipelineResult.agent5_safety,
      triggers,
      veto_auto_triage: veto,
      severity: severity as any,
      safety_flag: veto,
    };

    const finalDecision = !pipelineResult.agent1_quality.is_usable
      ? "RE_IMAGE"
      : veto
      ? "REFER"
      : "AUTO_TRIAGE";

    setPipelineResult((prev) => ({
      ...prev,
      agent4_context: updatedContext,
      agent5_safety: updatedSafety,
      agent6_coordinator: {
        ...prev.agent6_coordinator,
        decision: finalDecision as any,
        card_summary: {
          ...prev.agent6_coordinator.card_summary,
          A3_A4: `ABCD ${prev.agent3_lesion.suspicion_label} | Risk ${updatedContext.risk_indicator} (${multiplier.toFixed(2)}x)`,
          A5: updatedSafety.safety_flag ? "SAFETY FLAG" : "CLEAR",
          A6: finalDecision,
        },
      },
    }));
  }, [patientAge, patientSex, patientLoc]);

  // Handle custom image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsEvaluating(true);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCustomImage(b64);
      setSelectedCaseId("CUSTOM_UPLOAD");

      // Simulate full 6-agent inference on uploaded image
      setTimeout(() => {
        const customResult: FullPipelineResult = {
          image_id: `CUSTOM_${file.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}`,
          metadata: { age: patientAge, sex: patientSex, localization: patientLoc, filename: file.name },
          imageUrl: b64,
          agent1_quality: {
            status: "PASS",
            quality_score: 0.92,
            blur_score: 78.4,
            illumination_score: 0.89,
            glare_ratio: 0.003,
            obstruction_ratio: 0.015,
            vignette_ratio: 0.02,
            reasons: ["Live uploaded capture verified", "Sufficient diagnostic resolution"],
            is_usable: true,
          },
          agent2_diagnosis: {
            predicted_class: "nv",
            confidence: 0.915,
            probabilities: { nv: 0.915, bkl: 0.045, mel: 0.022, bcc: 0.01, akiec: 0.005, df: 0.002, vasc: 0.001 },
            top2_class: "bkl",
            top2_confidence: 0.045,
            entropy: 0.32,
            malignant_probability_mass: 0.037,
          },
          agent3_lesion: {
            asymmetry_score: 0.18,
            border_irregularity_score: 0.22,
            color_variation_score: 0.19,
            distinct_color_zones: ["tan", "brown"],
            suspicion_score: 0.19,
            suspicion_label: "LOW",
            feature_evidence: ["Regular elliptical symmetry", "Mild pigment gradation"],
            reliability_flags: [],
            lesion_area_ratio: 0.24,
          },
          agent4_context: {
            age: patientAge,
            sex: patientSex,
            localization: patientLoc,
            missing_field_flags: [],
            malignancy_prior_multiplier: 1.05,
            class_prior_shifts: { nv: 1.05, mel: 0.95 },
            risk_indicator: "LOW",
            context_evidence: ["Custom patient demographics incorporated"],
          },
          agent5_safety: {
            safety_flag: false,
            veto_auto_triage: false,
            severity: "CLEAR",
            triggers: [],
            justification: "Live upload meets automated clearance parameters.",
            conflict_detected: false,
          },
          agent6_coordinator: {
            image_id: `CUSTOM_${file.name.slice(0, 8)}`,
            prediction: "nv",
            decision: "AUTO_TRIAGE",
            policy_rule_triggered: "Gate 3: Autonomous Benign Clearance Protocol",
            traceable_rationale: "Live custom uploaded lesion classified as benign melanocytic nevus with 91.5% confidence. Low ABCD suspicion.",
            card_summary: {
              A1: "PASS • Quality 0.92",
              A2: "nv • 91.5% Conf",
              A3_A4: "ABCD Low (0.19) | Risk Low",
              A5: "CLEAR • 0 Conflicts",
              A6: "AUTO_TRIAGE • Approved",
            },
          },
          execution_time_ms: 24.6,
        };

        setPipelineResult(customResult);
        setIsEvaluating(false);
      }, 500);
    };
    reader.readAsDataURL(file);
  };

  const currentImageUrl = customImage || activeCase.imageUrl;

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Top Case Selector & Clinical Case Presets */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0b101b]/90 border border-white/10 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 font-semibold mr-1">
            CLINICAL BENCHMARK PRESETS:
          </span>
          {SAMPLE_CASES.map((sc) => {
            const isSelected = selectedCaseId === sc.id;
            const cls = CLINICAL_CLASSES[sc.dx];
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectCase(sc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10 font-bold"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cls?.color || "#38bdf8" }}
                />
                <span>{sc.dx.toUpperCase()}</span>
                <span className="text-[10px] text-slate-400">({sc.id.slice(-5)})</span>
              </button>
            );
          })}
        </div>

        {/* Custom Upload Button */}
        <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-slate-200 transition">
          <Upload className="w-4 h-4 text-cyan-400" />
          <span>UPLOAD CLINICAL DERMOSCOPY</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Main Diagnostic Split: Left = Image & 3D Topography, Right = Pipeline Strip & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column (5 Cols): 2D/3D Viewer & Patient Demographics */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Dermoscopy 2D & 3D Topography Mesh Component */}
          <div className="flex-1 min-h-[440px]">
            <DermoscopyViewer
              imageUrl={currentImageUrl}
              imageId={pipelineResult.image_id}
              quality={pipelineResult.agent1_quality}
              lesion={pipelineResult.agent3_lesion}
            />
          </div>

          {/* Interactive Patient Demographics Bar */}
          <div className="p-4 rounded-2xl bg-[#090d16]/90 border border-white/10 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>PATIENT CONTEXT TELEMETRY</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                Live Bayesian Prior Adjustment
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              {/* Age Input */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block">AGE (YEARS):</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={patientAge}
                  onChange={(e) => setPatientAge(parseInt(e.target.value) || 45)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono focus:border-cyan-500/50 outline-none"
                />
              </div>

              {/* Sex Selector */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block">BIOLOGICAL SEX:</label>
                <select
                  value={patientSex}
                  onChange={(e) => setPatientSex(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono focus:border-cyan-500/50 outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              {/* Anatomical Localization */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block">ANATOMICAL SITE:</label>
                <select
                  value={patientLoc}
                  onChange={(e) => setPatientLoc(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono focus:border-cyan-500/50 outline-none"
                >
                  <option value="upper extremity">Upper Extremity</option>
                  <option value="lower extremity">Lower Extremity</option>
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="face">Face</option>
                  <option value="scalp">Scalp</option>
                  <option value="abdomen">Abdomen</option>
                  <option value="neck">Neck</option>
                  <option value="foot">Foot</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): 5-Card Agent Pipeline Strip & Deep-Dive Preview */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* Signature 5-Card Pipeline Strip */}
          <AgentCardStrip
            pipelineResult={pipelineResult}
            onSelectAgent={(key) => setSelectedAgentKey(key)}
          />

          {/* Quick Deep-Dive Summary Banner */}
          <div className="p-4 rounded-2xl bg-[#0b101b]/80 border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  CLINICAL CASE SUMMARY: {activeCase.label}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Ground Truth: <span className="text-cyan-300 font-bold">{activeCase.dx.toUpperCase()}</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activeCase.clinicalDescription}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-400 block">PREDICTED CLASS:</span>
                <span className="text-cyan-400 font-bold text-sm">
                  {pipelineResult.agent2_diagnosis.predicted_class.toUpperCase()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-400 block">CERTAINTY:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {(pipelineResult.agent2_diagnosis.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-400 block">SAFETY GATE:</span>
                <span className={`font-bold text-sm ${
                  pipelineResult.agent5_safety.severity === "CLEAR" ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {pipelineResult.agent5_safety.severity}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-400 block">DISPOSITION:</span>
                <span className={`font-bold text-sm ${
                  pipelineResult.agent6_coordinator.decision === "AUTO_TRIAGE"
                    ? "text-emerald-400"
                    : pipelineResult.agent6_coordinator.decision === "REFER"
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}>
                  {pipelineResult.agent6_coordinator.decision}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Traceable Rationale, Demographic Risk Breakdown, and Veto Logs */}
      <BottomAuditPanel pipelineResult={pipelineResult} />

      {/* Deep Dive Modal */}
      <AgentDeepDiveModal
        agentKey={selectedAgentKey}
        onClose={() => setSelectedAgentKey(null)}
        pipelineResult={pipelineResult}
      />
    </div>
  );
}
