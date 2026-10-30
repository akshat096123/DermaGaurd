"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, ShieldAlert, Sparkles, ChevronRight, Activity, ArrowRight } from "lucide-react";
import { FullPipelineResult } from "../types";
import { CLINICAL_CLASSES } from "../data/clinicalData";

interface AgentCardStripProps {
  pipelineResult: FullPipelineResult;
  onSelectAgent: (key: "A1" | "A2" | "A3_A4" | "A5" | "A6") => void;
}

export default function AgentCardStrip({
  pipelineResult,
  onSelectAgent,
}: AgentCardStripProps) {
  const {
    agent1_quality,
    agent2_diagnosis,
    agent3_lesion,
    agent4_context,
    agent5_safety,
    agent6_coordinator,
  } = pipelineResult;

  // A1 badge
  const a1Status = agent1_quality?.status || "PASS";
  const a1Color =
    a1Status === "PASS"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : a1Status === "WARN"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-rose-400 bg-rose-500/10 border-rose-500/30";

  // A2 badge
  const a2Pred = agent2_diagnosis?.predicted_class || "nv";
  const a2Conf = agent2_diagnosis ? (agent2_diagnosis.confidence * 100).toFixed(1) : "0.0";
  const a2IsMalignant = CLINICAL_CLASSES[a2Pred]?.isMalignant;

  // A3+A4 badge
  const a3Label = agent3_lesion?.suspicion_label || "LOW";
  const a4Risk = agent4_context?.risk_indicator || "LOW";
  const a3a4Color =
    a3Label === "HIGH" || a4Risk === "HIGH"
      ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
      : a3Label === "SUSPICIOUS" || a4Risk === "ELEVATED"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

  // A5 badge
  const a5Severity = agent5_safety?.severity || "CLEAR";
  const a5Color =
    a5Severity === "CLEAR"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : a5Severity === "CAUTION"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-rose-400 bg-rose-500/10 border-rose-500/30";

  // A6 badge
  const a6Decision = agent6_coordinator?.decision || "AUTO_TRIAGE";
  const a6Color =
    a6Decision === "AUTO_TRIAGE"
      ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/40 shadow-emerald-500/10"
      : a6Decision === "REFER"
      ? "text-rose-400 bg-rose-500/15 border-rose-500/40 shadow-rose-500/10"
      : "text-amber-400 bg-amber-500/15 border-amber-500/40 shadow-amber-500/10";

  return (
    <div className="w-full space-y-2">
      {/* Pipeline Title & Live Stream Indicators */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold tracking-wider text-slate-300">
            6-AGENT CLINICAL PIPELINE STRIP
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Click any agent card for deep-dive telemetry
        </span>
      </div>

      {/* 5-Card Responsive Strip with Animated Pulse Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {/* Card 1: Agent 1 Image Quality */}
        <div
          onClick={() => onSelectAgent("A1")}
          className="group relative cursor-pointer rounded-xl bg-[#090d16]/90 hover:bg-[#0d1320] border border-white/10 hover:border-cyan-500/50 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-400 font-bold">
                A1: QUALITY
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${a1Color}`}>
                {a1Status}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
              Physics Certification
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Score:</span>
                <span className="text-slate-200">{((agent1_quality?.quality_score || 0.9) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Focus:</span>
                <span className="text-slate-200">{agent1_quality?.blur_score?.toFixed(1) || "75.0"}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400 group-hover:text-cyan-400">
            <span>Audit reasons</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 2: Agent 2 Diagnosis Classifier */}
        <div
          onClick={() => onSelectAgent("A2")}
          className="group relative cursor-pointer rounded-xl bg-[#090d16]/90 hover:bg-[#0d1320] border border-white/10 hover:border-cyan-500/50 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-400 font-bold">
                A2: DIAGNOSIS
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                a2IsMalignant
                  ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                  : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
              }`}>
                {a2Pred.toUpperCase()}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
              {CLINICAL_CLASSES[a2Pred]?.name || "Lesion Classifier"}
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Certainty:</span>
                <span className="text-cyan-300 font-semibold">{a2Conf}%</span>
              </div>
              <div className="flex justify-between">
                <span>Malignant:</span>
                <span className={a2IsMalignant ? "text-rose-400 font-semibold" : "text-slate-200"}>
                  {((agent2_diagnosis?.malignant_probability_mass || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400 group-hover:text-cyan-400">
            <span>Probability vector</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 3: Agents 3 & 4 ABCD & Context */}
        <div
          onClick={() => onSelectAgent("A3_A4")}
          className="group relative cursor-pointer rounded-xl bg-[#090d16]/90 hover:bg-[#0d1320] border border-white/10 hover:border-cyan-500/50 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-400 font-bold">
                A3 + A4
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${a3a4Color}`}>
                {a3Label}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
              ABCD & Demographics
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>ABCD Score:</span>
                <span className="text-slate-200">{agent3_lesion?.suspicion_score?.toFixed(2) || "0.22"}</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Prior:</span>
                <span className="text-amber-400 font-semibold">
                  {agent4_context?.malignancy_prior_multiplier?.toFixed(2) || "1.00"}x
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400 group-hover:text-cyan-400">
            <span>Morphology metrics</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 4: Agent 5 Regulatory Safety */}
        <div
          onClick={() => onSelectAgent("A5")}
          className="group relative cursor-pointer rounded-xl bg-[#090d16]/90 hover:bg-[#0d1320] border border-white/10 hover:border-cyan-500/50 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-400 font-bold">
                A5: SAFETY
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${a5Color}`}>
                {a5Severity}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
              Deterministic Veto
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Veto Active:</span>
                <span className={agent5_safety?.veto_auto_triage ? "text-rose-400 font-bold" : "text-emerald-400"}>
                  {agent5_safety?.veto_auto_triage ? "YES" : "NO"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Violations:</span>
                <span className="text-slate-200">{agent5_safety?.triggers?.length || 0}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400 group-hover:text-cyan-400">
            <span>Safety rule logs</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 5: Agent 6 Chief Coordinator */}
        <div
          onClick={() => onSelectAgent("A6")}
          className={`group relative cursor-pointer rounded-xl bg-[#0b101b] hover:bg-[#111728] border-2 p-3.5 transition-all duration-300 hover:-translate-y-1 shadow-lg flex flex-col justify-between ${
            a6Decision === "AUTO_TRIAGE"
              ? "border-emerald-500/60 shadow-emerald-500/10 hover:border-emerald-400"
              : a6Decision === "REFER"
              ? "border-rose-500/60 shadow-rose-500/10 hover:border-rose-400"
              : "border-amber-500/60 shadow-amber-500/10 hover:border-amber-400"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-cyan-300 font-bold">
                A6: COORDINATOR
              </span>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-extrabold border ${a6Color}`}>
                {a6Decision}
              </span>
            </div>
            <div className="text-xs font-semibold text-white tracking-wide">
              Actionable Disposition
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Final Dx:</span>
                <span className="text-white font-bold">{agent6_coordinator?.prediction?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="text-emerald-400 font-semibold">{pipelineResult.execution_time_ms}ms</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-300 group-hover:text-white">
            <span>Audit disposition</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
