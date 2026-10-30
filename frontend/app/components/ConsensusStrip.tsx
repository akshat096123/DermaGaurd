"use client";

import React from "react";
import {
  Camera,
  Cpu,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  ArrowRightCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AnalysisResponse } from "../types";

interface ConsensusStripProps {
  report: AnalysisResponse;
  activeCard?: string | null;
  onSelectCard?: (cardId: string) => void;
}

const CLASS_NAMES: Record<string, string> = {
  nv: "Melanocytic Nevus",
  mel: "Melanoma",
  bcc: "Basal Cell Carcinoma",
  bkl: "Benign Keratosis",
  akiec: "Actinic Keratosis",
  vasc: "Vascular Lesion",
  df: "Dermatofibroma",
};

export default function ConsensusStrip({
  report,
  activeCard,
  onSelectCard,
}: ConsensusStripProps) {
  const { verdict, agents } = report;

  // A1 Quality
  const a1Usable = agents?.a1?.is_usable ?? true;
  const a1Status = agents?.a1?.status ?? "PASS";

  // A2 Diagnosis
  const a2Pred = agents?.a2?.predicted_class ?? verdict?.prediction ?? "nv";
  const a2Conf = agents?.a2?.confidence ?? verdict?.confidence ?? 0.85;
  const a2DiseaseName = CLASS_NAMES[a2Pred] || a2Pred.toUpperCase();

  // A3 + A4 Morphometry & Priors
  const a3Suspicion = agents?.a3?.suspicion_label ?? "LOW";
  const a4Risk = agents?.a4?.risk_indicator ?? "LOW";
  const isA3A4Suspicious =
    a3Suspicion === "HIGH" ||
    a3Suspicion === "SUSPICIOUS" ||
    a4Risk === "HIGH" ||
    a4Risk === "ELEVATED";

  // A5 Safety Guardrail
  const a5Veto = agents?.a5?.veto_auto_triage ?? false;
  const a5Conflict = agents?.a5?.conflict_detected ?? false;

  // A6 Final Triage
  const a6Decision = verdict?.decision ?? "AUTO_TRIAGE";

  const isHealthySkin = a2Conf < 0.55 && ["nv", "vasc", "bkl", "df"].includes(a2Pred);

  const cards = [
    {
      id: "A1",
      step: "Optical Quality",
      icon: Camera,
      badgeText: a1Status,
      badgeColor: a1Usable ? "bg-[#10B981]/15 text-[#047857]" : "bg-[#E11D48]/15 text-[#E11D48]",
      title: a1Usable ? "Clear Optical Field" : "Quality Degraded",
      subtitle: a1Usable ? "Image is usable" : "Retake required",
      borderHover: a1Usable ? "hover:border-[#86EFAC]" : "hover:border-[#FDA4AF]",
    },
    {
      id: "A2",
      step: "Neural Diagnosis",
      icon: Cpu,
      badgeText: isHealthySkin ? "HEALTHY SKIN" : `${a2Pred.toUpperCase()} • ${(a2Conf * 100).toFixed(0)}%`,
      badgeColor: isHealthySkin ? "bg-[#10B981]/15 text-[#047857]" : "bg-[#E85D44]/15 text-[#E85D44]",
      title: isHealthySkin ? "Healthy Skin / No Focal Lesion" : a2DiseaseName,
      subtitle: isHealthySkin ? "Normal baseline melanin (No active disease)" : `Model predicts ${a2DiseaseName.toLowerCase()}`,
      borderHover: isHealthySkin ? "hover:border-[#86EFAC]" : "hover:border-[#FDA4AF]",
    },
    {
      id: "A3_A4",
      step: "Morphology & Context",
      icon: Sliders,
      badgeText: isA3A4Suspicious ? "SUSPICIOUS" : "LOW RISK",
      badgeColor: isA3A4Suspicious ? "bg-[#F59E0B]/15 text-[#B45309]" : "bg-[#10B981]/15 text-[#047857]",
      title: isA3A4Suspicious ? "Elevated Morphologic Risk" : "Harmonious Benign Field",
      subtitle: isA3A4Suspicious ? "Other evidence raises concern" : "Morphology & context benign",
      borderHover: isA3A4Suspicious ? "hover:border-[#FDE68A]" : "hover:border-[#86EFAC]",
    },
    {
      id: "A5",
      step: "Safety Guardrail",
      icon: ShieldCheck,
      badgeText: a5Veto || a5Conflict ? "SAFETY FLAG" : "CLEAR",
      badgeColor: a5Veto || a5Conflict ? "bg-[#E11D48]/15 text-[#E11D48]" : "bg-[#10B981]/15 text-[#047857]",
      title: a5Veto || a5Conflict ? "Safety Veto Triggered" : "Safety Consensus Passed",
      subtitle: a5Veto || a5Conflict ? "Conflict detected" : "Consensus verified",
      borderHover: a5Veto ? "hover:border-[#FDA4AF]" : "hover:border-[#86EFAC]",
    },
    {
      id: "A6",
      step: "Triage Disposition",
      icon: ArrowRightCircle,
      badgeText: a6Decision,
      badgeColor:
        a6Decision === "AUTO_TRIAGE"
          ? "bg-[#10B981] text-white"
          : a6Decision === "REFER"
          ? "bg-[#E11D48] text-white"
          : "bg-[#F59E0B] text-white",
      title: a6Decision.replace("_", " "),
      subtitle: "Final disposition",
      borderHover: "hover:border-[#E85D44]",
      isHighlighted: true,
    },
  ];

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#E85D44] uppercase tracking-wider">
          Section B • 5-Stage Clinical Consensus Strip
        </span>
        <span className="text-[11px] text-[#78716C]">
          Sequential Specialist Agent Decision Gateways
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        {cards.map((c) => {
          const Icon = c.icon;
          const isSelected = activeCard === c.id;

          return (
            <div
              key={c.id}
              onClick={() => onSelectCard && onSelectCard(c.id)}
              className={`p-4 rounded-[22px] bg-white border transition-all duration-200 cursor-pointer select-none flex flex-col justify-between ${
                c.isHighlighted
                  ? "border-[#E85D44] shadow-md shadow-[#E85D44]/10 bg-gradient-to-b from-white to-[#FFF6F3]"
                  : isSelected
                  ? "border-[#18181B] shadow-md"
                  : "border-[#F2E8E3] shadow-sm hover:shadow-md"
              } ${c.borderHover}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="text-[10px] font-extrabold text-[#78716C] uppercase tracking-wider truncate">
                    {c.step}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full shrink-0 ${c.badgeColor}`}
                  >
                    {c.badgeText}
                  </span>
                </div>

                <div className="text-xs font-extrabold text-[#18181B] truncate">
                  {c.title}
                </div>
              </div>

              <div className="text-[11px] text-[#78716C] mt-2 pt-2 border-t border-[#F2E8E3] flex items-center justify-between">
                <span className="truncate">{c.subtitle}</span>
                <Icon className="w-3.5 h-3.5 text-[#A8A29E] shrink-0 ml-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
