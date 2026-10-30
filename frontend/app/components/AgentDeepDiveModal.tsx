"use client";

import React, { useState } from "react";
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Activity, Code, Cpu, Info } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { FullPipelineResult } from "../types";
import { CLINICAL_CLASSES } from "../data/clinicalData";

interface AgentDeepDiveModalProps {
  agentKey: "A1" | "A2" | "A3_A4" | "A5" | "A6" | null;
  onClose: () => void;
  pipelineResult: FullPipelineResult;
}

export default function AgentDeepDiveModal({
  agentKey,
  onClose,
  pipelineResult,
}: AgentDeepDiveModalProps) {
  const [viewJson, setViewJson] = useState<boolean>(false);

  if (!agentKey) return null;

  const {
    agent1_quality,
    agent2_diagnosis,
    agent3_lesion,
    agent4_context,
    agent5_safety,
    agent6_coordinator,
  } = pipelineResult;

  // Prepare A2 probability chart data
  const probData = Object.entries(agent2_diagnosis?.probabilities || {}).map(([code, prob]) => ({
    name: code.toUpperCase(),
    fullName: CLINICAL_CLASSES[code]?.name || code,
    prob: Number((prob * 100).toFixed(2)),
    isMalignant: CLINICAL_CLASSES[code]?.isMalignant || false,
    color: CLINICAL_CLASSES[code]?.color || "#38bdf8",
  })).sort((a, b) => b.prob - a.prob);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0b101b] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#080c15] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-mono font-bold">
              {agentKey.replace("_", "+")}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-wide">
                {agentKey === "A1" && "AGENT 1: OPTICAL IMAGE QUALITY CERTIFICATION"}
                {agentKey === "A2" && "AGENT 2: CONVNEXT / EFFICIENTNET-B0 DIAGNOSTIC INFERENCE"}
                {agentKey === "A3_A4" && "AGENTS 3 & 4: ABCD MORPHOMETRICS & EPIDEMIOLOGICAL CONTEXT"}
                {agentKey === "A5" && "AGENT 5: REGULATORY SAFETY GUARDRAILS & DETERMINISTIC VETO"}
                {agentKey === "A6" && "AGENT 6: CHIEF CLINICAL COORDINATOR & DISPOSITION LOGIC"}
              </h3>
              <p className="text-xs font-mono text-slate-400">
                CASE: {pipelineResult.image_id} • LATENCY: {pipelineResult.execution_time_ms}ms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewJson(!viewJson)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
                viewJson
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{viewJson ? "FORMATTED VIEW" : "RAW CONTRACT JSON"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {viewJson ? (
            <div className="bg-[#05070c] p-4 rounded-xl border border-white/10 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
              <pre>
                {JSON.stringify(
                  agentKey === "A1"
                    ? agent1_quality
                    : agentKey === "A2"
                    ? agent2_diagnosis
                    : agentKey === "A3_A4"
                    ? { lesion: agent3_lesion, context: agent4_context }
                    : agentKey === "A5"
                    ? agent5_safety
                    : agent6_coordinator,
                  null,
                  2
                )}
              </pre>
            </div>
          ) : (
            <>
              {/* Agent 1 Deep Dive */}
              {agentKey === "A1" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400">STATUS</div>
                      <div className={`text-base font-mono font-bold mt-1 ${
                        agent1_quality.status === "PASS" ? "text-emerald-400" : agent1_quality.status === "WARN" ? "text-amber-400" : "text-rose-400"
                      }`}>
                        {agent1_quality.status}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400">QUALITY SCORE</div>
                      <div className="text-base font-mono font-bold text-cyan-400 mt-1">
                        {(agent1_quality.quality_score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400">LAPLACIAN BLUR</div>
                      <div className="text-base font-mono font-bold text-white mt-1">
                        {agent1_quality.blur_score.toFixed(1)}
                      </div>
                      <div className="text-[9px] text-slate-400">Threshold: &gt; 26.0</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400">SPECULAR GLARE</div>
                      <div className="text-base font-mono font-bold text-white mt-1">
                        {(agent1_quality.glare_ratio * 100).toFixed(1)}%
                      </div>
                      <div className="text-[9px] text-slate-400">Reject: &gt; 8.0%</div>
                    </div>
                  </div>

                  {/* Optical Physics Observations */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                    <h4 className="text-xs font-mono text-slate-300 font-semibold mb-2">
                      PHYSICS-BASED OPTICAL VERIFICATION OBSERVATIONS
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {agent1_quality.reasons.map((r, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Agent 2 Deep Dive */}
              {agentKey === "A2" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400">PRIMARY PREDICTION</div>
                      <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">
                        {agent2_diagnosis.predicted_class.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">
                        {CLINICAL_CLASSES[agent2_diagnosis.predicted_class]?.name}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400">CALIBRATED CERTAINTY</div>
                      <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
                        {(agent2_diagnosis.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-400">Temperature Scaled</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400">MALIGNANT MASS</div>
                      <div className={`text-lg font-mono font-bold mt-0.5 ${
                        agent2_diagnosis.malignant_probability_mass > 0.2 ? "text-rose-400" : "text-slate-200"
                      }`}>
                        {(agent2_diagnosis.malignant_probability_mass * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-400">mel + bcc + akiec</div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] font-mono text-slate-400">SHANNON ENTROPY</div>
                      <div className="text-lg font-mono font-bold text-amber-300 mt-0.5">
                        {agent2_diagnosis.entropy.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">Distribution spread</div>
                    </div>
                  </div>

                  {/* 7-Class Calibrated Probability Distribution Chart */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                    <h4 className="text-xs font-mono text-slate-300 font-semibold mb-3 flex items-center justify-between">
                      <span>7-CLASS CALIBRATED PROBABILITY VECTOR</span>
                      <span className="text-[10px] text-slate-400 font-normal">EfficientNet-B0 Multi-Modal Head</span>
                    </h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={probData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} unit="%" />
                          <YAxis dataKey="name" type="category" tick={{ fill: "#cbd5e1", fontSize: 11, fontFamily: "monospace" }} width={45} />
                          <Tooltip
                            content={({ payload }) => {
                              if (!payload || !payload.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs font-mono text-white">
                                  <div className="font-bold">{d.name} ({d.fullName})</div>
                                  <div>Probability: <span className="text-cyan-400">{d.prob}%</span></div>
                                  <div>Tier: <span className={d.isMalignant ? "text-rose-400" : "text-emerald-400"}>{d.isMalignant ? "Malignant" : "Benign"}</span></div>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="prob" radius={[0, 4, 4, 0]}>
                            {probData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Agents 3 & 4 Deep Dive */}
              {agentKey === "A3_A4" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Agent 3 ABCD Section */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                      <h4 className="text-xs font-mono text-cyan-300 font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>AGENT 3: ABCD MORPHOMETRIC CRITERIA</span>
                      </h4>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Asymmetry Index (A):</span>
                          <span className="text-slate-200">{agent3_lesion.asymmetry_score.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Border Irregularity (B):</span>
                          <span className="text-slate-200">{agent3_lesion.border_irregularity_score.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Color Variation (C):</span>
                          <span className="text-slate-200">{agent3_lesion.color_variation_score.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Composite Suspicion:</span>
                          <span className={`font-bold ${
                            agent3_lesion.suspicion_score > 0.5 ? "text-rose-400" : "text-emerald-400"
                          }`}>
                            {agent3_lesion.suspicion_score.toFixed(2)} ({agent3_lesion.suspicion_label})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Agent 4 Context Reasoning */}
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                      <h4 className="text-xs font-mono text-amber-300 font-semibold flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-amber-400" />
                        <span>AGENT 4: EPIDEMIOLOGICAL PRIOR</span>
                      </h4>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Patient Demographics:</span>
                          <span className="text-slate-200">
                            {agent4_context.age}yo • {agent4_context.sex}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Anatomical Site:</span>
                          <span className="text-cyan-300 capitalize">{agent4_context.localization}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Malignancy Prior Multiplier:</span>
                          <span className="text-amber-400 font-bold">{agent4_context.malignancy_prior_multiplier.toFixed(2)}x</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-slate-400">Context Risk Stratum:</span>
                          <span className={`font-bold ${
                            agent4_context.risk_indicator === "HIGH" ? "text-rose-400" : agent4_context.risk_indicator === "ELEVATED" ? "text-amber-400" : "text-emerald-400"
                          }`}>
                            {agent4_context.risk_indicator}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Epidemiological Rationale */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 font-mono">
                    <div className="text-slate-400 mb-1">EPIDEMIOLOGICAL REASONING EVIDENCE:</div>
                    <div>{agent4_context.context_evidence?.join(" • ") || "Normal baseline population demographic distribution."}</div>
                  </div>
                </div>
              )}

              {/* Agent 5 Safety Deep Dive */}
              {agentKey === "A5" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-slate-400">ESCALATION SEVERITY</div>
                      <div className={`text-xl font-mono font-bold mt-1 ${
                        agent5_safety.severity === "CLEAR"
                          ? "text-emerald-400"
                          : agent5_safety.severity === "CAUTION"
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}>
                        {agent5_safety.severity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-400">AUTONOMOUS TRIAGE VETO</div>
                      <div className={`text-base font-mono font-bold mt-1 ${
                        agent5_safety.veto_auto_triage ? "text-rose-400" : "text-emerald-400"
                      }`}>
                        {agent5_safety.veto_auto_triage ? "MANDATORY VETO ACTIVE" : "VETO CLEARED"}
                      </div>
                    </div>
                  </div>

                  {/* Active Triggers List */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <h4 className="text-xs font-mono text-slate-300 font-semibold">
                      DETERMINISTIC SAFETY RULE AUDIT TRAIL
                    </h4>
                    {agent5_safety.triggers.length > 0 ? (
                      <div className="space-y-1.5">
                        {agent5_safety.triggers.map((t, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs font-mono text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                            <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            <span>RULE VIOLATION: {t}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>All 5 Deterministic Safety Gates Cleared with Zero Violations</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 font-mono">
                    <div className="text-slate-400 mb-1">SAFETY JUSTIFICATION SYNTHESIS:</div>
                    <div>{agent5_safety.justification}</div>
                  </div>
                </div>
              )}

              {/* Agent 6 Coordinator Deep Dive */}
              {agentKey === "A6" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-slate-400">FINAL CLINICAL DECISION</div>
                      <div className={`text-2xl font-mono font-bold mt-1 ${
                        agent6_coordinator.decision === "AUTO_TRIAGE"
                          ? "text-emerald-400"
                          : agent6_coordinator.decision === "REFER"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}>
                        {agent6_coordinator.decision}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-slate-400">POLICY RULE TRIGGERED</div>
                      <div className="text-xs font-mono text-cyan-300 mt-1 max-w-[280px]">
                        {agent6_coordinator.policy_rule_triggered}
                      </div>
                    </div>
                  </div>

                  {/* Verbatim Traceable Rationale */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <h4 className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-cyan-400" />
                      <span>FDA SaMD TRACEABLE CLINICAL AUDIT TRAIL</span>
                    </h4>
                    <p className="text-xs text-slate-200 font-mono leading-relaxed bg-black/50 p-3.5 rounded-lg border border-white/10">
                      {agent6_coordinator.traceable_rationale}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#080c15] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div>FDA SaMD PROTOCOL: ISO-13485 REVISION 2.0</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/15 transition"
          >
            Close Deep Dive
          </button>
        </div>
      </div>
    </div>
  );
}
