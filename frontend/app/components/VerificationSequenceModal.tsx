"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert, Sparkles, RefreshCw, ArrowRight, Activity, Camera, Shield } from "lucide-react";
import { AnalysisResponse } from "../types";

interface VerificationSequenceModalProps {
  isOpen: boolean;
  analysisResult: AnalysisResponse | null;
  onComplete: () => void;
  onRetake: () => void;
}

export default function VerificationSequenceModal({
  isOpen,
  analysisResult,
  onComplete,
  onRetake,
}: VerificationSequenceModalProps) {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isHaltedAtGate1, setIsHaltedAtGate1] = useState<boolean>(false);

  const verificationSteps = [
    {
      num: 1,
      title: "Optical Quality & Glare Certification",
      subtitle: "Laplacian variance, specular flash ratio, and lens vignetting",
      agentCode: "A1_QUALITY",
    },
    {
      num: 2,
      title: "Differential Diagnosis Neural Inference",
      subtitle: "7-class probability calibration & Shannon entropy calculation",
      agentCode: "A2_NEURAL",
    },
    {
      num: 3,
      title: "ABCD Morphometry & Demographic Priors",
      subtitle: "Asymmetry, border, variegation, diameter, and anatomical risk multiplier",
      agentCode: "A3_A4_FUSION",
    },
    {
      num: 4,
      title: "Clinical Safety Gate & Triage Disposition",
      subtitle: "Autonomous triage certification or specialist clinical referral",
      agentCode: "A5_A6_COORDINATOR",
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      setIsHaltedAtGate1(false);
      return;
    }

    // Step 1: Agent 1 Quality Check (0ms -> 350ms)
    const t1 = setTimeout(() => {
      setStepIndex(1);

      // Check if Agent 1 failed
      if (analysisResult && !analysisResult.agents.a1.is_usable) {
        setIsHaltedAtGate1(true);
        return;
      }

      // Step 2: Agent 2 Neural Inference (350ms -> 750ms)
      const t2 = setTimeout(() => {
        setStepIndex(2);

        // Step 3: Agents 3 & 4 (750ms -> 1150ms)
        const t3 = setTimeout(() => {
          setStepIndex(3);

          // Step 4: Agents 5 & 6 (1150ms -> 1550ms)
          const t4 = setTimeout(() => {
            setStepIndex(4);
            // Transition to Stage 2 after 400ms
            const t5 = setTimeout(() => {
              onComplete();
            }, 450);
            return () => clearTimeout(t5);
          }, 400);
          return () => clearTimeout(t4);
        }, 400);
        return () => clearTimeout(t3);
      }, 400);
      return () => clearTimeout(t2);
    }, 350);

    return () => clearTimeout(t1);
  }, [isOpen, analysisResult, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_rgba(28,25,23,0.15)] text-[#18181B] overflow-hidden">
        {/* Decorative Top Accent Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#E85D44] via-[#0D9488] to-[#10B981]" />

        {isHaltedAtGate1 ? (
          /* Gate 1 Halt: RE_IMAGE Warning */
          <div className="flex flex-col items-center text-center py-2 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-[#E11D48]/10 text-[#E11D48] flex items-center justify-center mb-4 border border-[#E11D48]/20 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D48]/10 text-[#E11D48] text-xs font-bold uppercase tracking-wider mb-2">
              Gate 1 Triggered: Re-Image Required
            </div>

            <h3 className="text-xl font-bold text-[#18181B] mb-2">
              Optical Quality Inadequate
            </h3>

            <p className="text-xs text-[#71717A] max-w-sm mb-4 leading-relaxed">
              Optical inspection detected severe blur, flash glare, or deficient lighting. To protect patient safety, the diagnostic pipeline halted before neural inference.
            </p>

            {/* Reasons List */}
            {analysisResult?.agents.a1.reasons && (
              <div className="w-full p-3.5 bg-[#FFF1F2] rounded-2xl border border-[#FFE4E6] text-left mb-6 text-xs text-[#BE123C] space-y-1">
                <span className="font-bold block text-[11px] uppercase tracking-wider">
                  Specific Quality Flags:
                </span>
                {analysisResult.agents.a1.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-[#E11D48] font-bold">•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={onRetake}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#E85D44] hover:bg-[#D4472E] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#E85D44]/25"
              >
                <RefreshCw className="w-4 h-4" />
                Retake Dermoscopy Photo
              </button>

              <button
                type="button"
                onClick={onComplete}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#FAF5F0] hover:bg-[#F3EAE3] text-[#71717A] rounded-2xl text-xs font-bold transition-all border border-[#E4D8CF]"
              >
                <span>Inspect Audit Log</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Active Verification Steps */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E85D44]/10 text-[#E85D44] flex items-center justify-center">
                  <Activity className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18181B] leading-tight">
                    Running 6-Agent Verification
                  </h3>
                  <p className="text-[11px] text-[#71717A]">
                    Automated multi-agent diagnostic consensus sequence
                  </p>
                </div>
              </div>

              <div className="px-2.5 py-1 bg-[#0D9488]/10 text-[#0F766E] text-[11px] font-bold rounded-full border border-[#0D9488]/20">
                Live Consensus
              </div>
            </div>

            {/* Steps Progress */}
            <div className="space-y-3 mb-6">
              {verificationSteps.map((s, idx) => {
                const isPassed = stepIndex > idx;
                const isCurrent = stepIndex === idx;

                return (
                  <div
                    key={s.num}
                    className={`flex items-start gap-3 p-3 rounded-2xl transition-all duration-300 ${
                      isPassed
                        ? "bg-[#F0FDF4] border border-[#DCFCE7]"
                        : isCurrent
                        ? "bg-[#FAF5F0] border border-[#E85D44]/30 shadow-sm"
                        : "opacity-40"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full border-2 border-[#E85D44] border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#D4C5B9] text-[10px] font-bold flex items-center justify-center text-[#A1A1AA]">
                          {s.num}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#18181B]">
                          {s.title}
                        </span>
                        <span className="text-[10px] font-semibold text-[#71717A] tracking-wider uppercase">
                          {s.agentCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#71717A] mt-0.5 leading-snug">
                        {s.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-[11px] text-[#71717A]">
              Verifying safety gates and epidemiological thresholds...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
