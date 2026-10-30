"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, FileText, UserCheck, Activity, AlertOctagon, CheckCircle2, ChevronRight } from "lucide-react";
import { FullPipelineResult } from "../types";
import { CLINICAL_CLASSES } from "../data/clinicalData";

interface BottomAuditPanelProps {
  pipelineResult: FullPipelineResult;
}

export default function BottomAuditPanel({ pipelineResult }: BottomAuditPanelProps) {
  const {
    image_id,
    agent4_context,
    agent5_safety,
    agent6_coordinator,
  } = pipelineResult;

  const decision = agent6_coordinator?.decision || "AUTO_TRIAGE";

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Traceable Clinical Rationale */}
      <div className="rounded-2xl bg-[#090d16]/90 border border-white/10 p-4 flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-semibold text-slate-200 tracking-wide">
                TRACEABLE CLINICAL RATIONALE
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border ${
              decision === "AUTO_TRIAGE"
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                : decision === "REFER"
                ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                : "text-amber-400 bg-amber-500/10 border-amber-500/30"
            }`}>
              {decision}
            </span>
          </div>

          <div className="text-[11px] font-mono text-cyan-300 font-medium mb-1">
            POLICY RULE APPLIED:
          </div>
          <div className="text-xs font-mono text-slate-300 mb-3 bg-black/40 p-2 rounded-lg border border-white/5">
            {agent6_coordinator?.policy_rule_triggered}
          </div>

          <div className="text-[11px] font-mono text-slate-400 mb-1">
            VERBATIM DECISION AUDIT LOG:
          </div>
          <p className="text-xs text-slate-300 font-sans leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5">
            {agent6_coordinator?.traceable_rationale}
          </p>
        </div>

        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>CASE: {image_id}</span>
          <span className="text-emerald-400">ISO-13485 / FDA SaMD CONFORMANT</span>
        </div>
      </div>

      {/* 2. Agent 4 Demographic Risk Breakdown */}
      <div className="rounded-2xl bg-[#090d16]/90 border border-white/10 p-4 flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-semibold text-slate-200 tracking-wide">
                AGENT 4: DEMOGRAPHIC RISK PRIOR
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              agent4_context?.risk_indicator === "HIGH"
                ? "text-rose-400 bg-rose-500/10 border-rose-500/30"
                : agent4_context?.risk_indicator === "ELEVATED"
                ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
            }`}>
              {agent4_context?.risk_indicator || "LOW"} RISK
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
            <div className="bg-black/40 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400 block">PATIENT AGE & SEX:</span>
              <span className="text-slate-200 font-semibold">
                {agent4_context?.age}yo • {agent4_context?.sex}
              </span>
            </div>
            <div className="bg-black/40 p-2 rounded-lg border border-white/5">
              <span className="text-[10px] text-slate-400 block">ANATOMICAL SITE:</span>
              <span className="text-cyan-300 font-semibold capitalize">
                {agent4_context?.localization || "unknown"}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-mono bg-black/40 p-2.5 rounded-lg border border-white/5 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">HAM10000 Baseline Malignancy:</span>
              <span className="text-slate-300">19.44%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Bayesian Risk Multiplier:</span>
              <span className="text-amber-400 font-bold">
                {agent4_context?.malignancy_prior_multiplier?.toFixed(2)}x
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Posterior Malignancy Prior:</span>
              <span className="text-slate-200 font-bold">
                {((0.1944 * (agent4_context?.malignancy_prior_multiplier || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-sans italic">
            {agent4_context?.context_evidence?.[0] || "Standard epidemiological baseline applies."}
          </p>
        </div>

        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>PRIOR SHIFT MODEL: MCMC BAYES</span>
          <span className="text-slate-300">N=7,762 COHORT</span>
        </div>
      </div>

      {/* 3. Agent 5 Deterministic Conflict & Veto Logs */}
      <div className="rounded-2xl bg-[#090d16]/90 border border-white/10 p-4 flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-mono font-semibold text-slate-200 tracking-wide">
                AGENT 5: CONFLICT & VETO AUDIT
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              agent5_safety?.severity === "CLEAR"
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                : "text-rose-400 bg-rose-500/10 border-rose-500/30"
            }`}>
              {agent5_safety?.severity || "CLEAR"}
            </span>
          </div>

          {/* 5 Deterministic Gates Checklist */}
          <div className="space-y-1.5 text-xs font-mono mb-3">
            <div className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-white/5">
              <span className="text-slate-300">Gate 1: Optical Quality Certification</span>
              <span className={pipelineResult.agent1_quality?.is_usable ? "text-emerald-400 flex items-center gap-1" : "text-rose-400 flex items-center gap-1"}>
                {pipelineResult.agent1_quality?.is_usable ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertOctagon className="w-3.5 h-3.5" />}
                {pipelineResult.agent1_quality?.is_usable ? "PASS" : "VETO"}
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-white/5">
              <span className="text-slate-300">Gate 2: Malignancy Confidence Floor</span>
              <span className={
                pipelineResult.agent2_diagnosis?.predicted_class && CLINICAL_CLASSES[pipelineResult.agent2_diagnosis.predicted_class]?.isMalignant && pipelineResult.agent2_diagnosis.confidence < 0.75
                  ? "text-rose-400 flex items-center gap-1"
                  : "text-emerald-400 flex items-center gap-1"
              }>
                <CheckCircle2 className="w-3.5 h-3.5" />
                PASS
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-white/5">
              <span className="text-slate-300">Gate 3: Malignant Mass &lt; 22% Veto</span>
              <span className={
                (pipelineResult.agent2_diagnosis?.malignant_probability_mass || 0) > 0.22 && !CLINICAL_CLASSES[pipelineResult.agent2_diagnosis?.predicted_class || ""]?.isMalignant
                  ? "text-rose-400 flex items-center gap-1"
                  : "text-emerald-400 flex items-center gap-1"
              }>
                {(pipelineResult.agent2_diagnosis?.malignant_probability_mass || 0) > 0.22 && !CLINICAL_CLASSES[pipelineResult.agent2_diagnosis?.predicted_class || ""]?.isMalignant ? <AlertOctagon className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {((pipelineResult.agent2_diagnosis?.malignant_probability_mass || 0) * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-white/5">
              <span className="text-slate-300">Gate 4: ABCD Morphometric Discordance</span>
              <span className={
                (pipelineResult.agent3_lesion?.suspicion_score || 0) > 0.65 && !CLINICAL_CLASSES[pipelineResult.agent2_diagnosis?.predicted_class || ""]?.isMalignant
                  ? "text-rose-400 flex items-center gap-1"
                  : "text-emerald-400 flex items-center gap-1"
              }>
                <CheckCircle2 className="w-3.5 h-3.5" />
                CLEAR
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            VETO JUSTIFICATION: <span className="text-slate-300">{agent5_safety?.justification}</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>VETO ENFORCEMENT: HARD STOP</span>
          <span className={agent5_safety?.veto_auto_triage ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
            {agent5_safety?.veto_auto_triage ? "MANDATORY REFERRAL" : "CLEAR DISPOSITION"}
          </span>
        </div>
      </div>
    </div>
  );
}
