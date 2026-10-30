"use client";

import React from "react";
import { X, CheckCircle2, ShieldCheck, AlertCircle, Info, Sparkles } from "lucide-react";
import { AgentCareCheckpoint } from "../data/clinicalData";

interface CheckpointDetailDrawerProps {
  checkpoint: AgentCareCheckpoint | null;
  onClose: () => void;
  patientName: string;
}

export default function CheckpointDetailDrawer({
  checkpoint,
  onClose,
  patientName,
}: CheckpointDetailDrawerProps) {
  if (!checkpoint) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md h-full bg-white shadow-[-12px_0_40px_rgba(40,25,20,0.1)] border-l border-[#F3E8E2] p-8 flex flex-col justify-between overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-[#F3E8E2]">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#F2765E]">
                Checkpoint #{checkpoint.stepNumber} Inspection
              </span>
              <h3 className="text-xl font-bold text-[#1C1917] mt-1">
                {checkpoint.title}
              </h3>
              <p className="text-xs text-[#8A817C] font-medium mt-0.5">
                Patient: {patientName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#FDF5F2] text-[#8A817C] hover:text-[#1C1917] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Finding summary pill */}
          <div className="my-6 p-4 rounded-2xl bg-[#FDF5F2] border border-[#F3E8E2]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-[#8A817C]">Clinical Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                checkpoint.statusType === "success"
                  ? "bg-[#EBF7EE] text-[#2E7D32]"
                  : checkpoint.statusType === "warning"
                  ? "bg-[#FDF2F0] text-[#D94838]"
                  : "bg-white text-[#1C1917] border border-[#F3E8E2]"
              }`}>
                {checkpoint.statusText}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#1C1917] leading-relaxed">
              "{checkpoint.simpleExplanation}"
            </p>
          </div>

          {/* Detailed clinical explanation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A817C]">
              Diagnostic Analysis
            </h4>
            <p className="text-sm text-[#4A4543] leading-relaxed font-normal">
              {checkpoint.detailNote}
            </p>
          </div>

          {/* General Guidance */}
          <div className="mt-6 pt-6 border-t border-[#F3E8E2] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A817C]">
              Safety Standard
            </h4>
            <div className="p-3.5 rounded-2xl bg-[#FFFDFB] border border-[#F3E8E2] text-xs text-[#4A4543] leading-relaxed">
              Each AI specialist module independently examines specific clinical markers (optical focus, cellular pattern, shape asymmetry, demographic risks) before reaching joint triage consensus.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#F3E8E2] flex items-center justify-between text-xs text-[#8A817C]">
          <span>Verified AI Care Team Checkpoint</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-[#F2765E] hover:bg-[#E05D44] text-white font-semibold text-xs transition shadow-xs"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
