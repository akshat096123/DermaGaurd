"use client";

import React, { useState } from "react";
import {
  User,
  RotateCcw,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { PatientContext } from "../types";

interface PatientClinicalProfileCardProps {
  patientContext: PatientContext;
  onChangeContext: (ctx: PatientContext) => void;
  selectedImageUrl: string | null;
  selectedImageId: string | null;
  onBackToUpload: () => void;
  onRecalibrate: () => void;
  isLoading: boolean;
}

const BODY_ZONES = [
  "Back",
  "Lower Extremity",
  "Trunk",
  "Upper Extremity",
  "Abdomen",
  "Face",
  "Chest",
  "Foot",
  "Scalp",
  "Neck",
  "Hand",
  "Acral",
  "Unspecified",
];

export default function PatientClinicalProfileCard({
  patientContext,
  onChangeContext,
  selectedImageUrl,
  selectedImageId,
  onBackToUpload,
  onRecalibrate,
  isLoading,
}: PatientClinicalProfileCardProps) {
  const [ageNotProvided, setAgeNotProvided] = useState<boolean>(
    patientContext.age === null
  );

  const handleAgeToggle = (checked: boolean) => {
    setAgeNotProvided(checked);
    onChangeContext({
      ...patientContext,
      age: checked ? null : 45,
    });
  };

  return (
    <div className="w-full rounded-[28px] bg-white border border-[#F2E8E3] shadow-[0_8px_30px_rgba(28,25,23,0.04)] p-6 sm:p-8 space-y-6">
      {/* Top Banner: Verified Scan Info + Back to Upload CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F2E8E3] gap-4">
        <div className="flex items-center gap-3">
          {selectedImageUrl && (
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#E85D44]/40 bg-[#FAF4F0] shrink-0 shadow-sm">
              <img
                src={selectedImageUrl}
                alt="Active Scan"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#047857] uppercase tracking-wide">
                Verified Scan
              </span>
              <span className="text-xs text-[#78716C] font-mono">
                {selectedImageId || "Custom"}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-[#18181B] tracking-tight">
              Patient Clinical Profile & Context Priors
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF4F0] border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#18181B] shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#E85D44]" />
            <span>Upload Different Scan</span>
          </button>
        </div>
      </div>

      {/* Grid: Demographics Context Tuning */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Age & Sex Controls */}
        <div className="md:col-span-5 space-y-4">
          {/* Patient Age Control */}
          <div className="p-4 rounded-2xl bg-[#FAF4F0] border border-[#F2E8E3] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#18181B] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#78716C]" />
                <span>Patient Age:</span>
                <span className="text-[#E85D44] font-black">
                  {ageNotProvided ? "Not Provided" : `${patientContext.age ?? 45} years`}
                </span>
              </label>

              {/* Not Provided Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#78716C] select-none">
                <input
                  type="checkbox"
                  checked={ageNotProvided}
                  onChange={(e) => handleAgeToggle(e.target.checked)}
                  className="rounded text-[#E85D44] focus:ring-[#E85D44] border-stone-300 w-4 h-4"
                />
                <span>Not Provided</span>
              </label>
            </div>

            {!ageNotProvided && (
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={patientContext.age ?? 45}
                  onChange={(e) =>
                    onChangeContext({
                      ...patientContext,
                      age: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-[#E85D44] cursor-pointer"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={patientContext.age ?? 45}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      onChangeContext({
                        ...patientContext,
                        age: Math.max(1, Math.min(100, val)),
                      });
                    }
                  }}
                  className="w-16 px-2.5 py-1 text-xs font-extrabold text-center bg-white border border-[#E5DCD4] rounded-lg text-[#18181B]"
                />
              </div>
            )}
          </div>

          {/* Biological Sex Selector */}
          <div className="p-4 rounded-2xl bg-[#FAF4F0] border border-[#F2E8E3] space-y-2">
            <label className="text-xs font-extrabold text-[#18181B] block">
              Biological Sex
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: "female", label: "Female" },
                { val: "male", label: "Male" },
                { val: "unspecified", label: "Unspecified" },
              ].map((item) => {
                const isSelected = patientContext.sex === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() =>
                      onChangeContext({
                        ...patientContext,
                        sex: item.val as any,
                      })
                    }
                    className={`py-2 px-2 text-xs font-bold rounded-xl transition-all ${
                      isSelected
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "bg-white border border-[#F2E8E3] text-[#78716C] hover:text-[#18181B]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Anatomical Location Selector */}
        <div className="md:col-span-7 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-[#18181B]">
              Anatomical Lesion Location
            </label>
            <span className="text-[11px] text-[#E85D44] font-bold capitalize">
              Selected: {patientContext.localization || "Unspecified"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-[#FAF4F0] border border-[#F2E8E3]">
            {BODY_ZONES.map((zone) => {
              const zoneKey = zone.toLowerCase();
              const isSelected =
                patientContext.localization?.toLowerCase() === zoneKey;
              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() =>
                    onChangeContext({
                      ...patientContext,
                      localization: zoneKey,
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-[#18181B] text-white shadow-sm"
                      : "bg-white border border-[#F2E8E3] text-[#78716C] hover:text-[#18181B] hover:border-[#E5DCD4]"
                  }`}
                >
                  {zone}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-[#78716C]">
              Epidemiological weighting automatically scales based on demographic priors.
            </span>
            <button
              type="button"
              onClick={onRecalibrate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E85D44]/10 text-[#E85D44] hover:bg-[#E85D44]/20 text-xs font-extrabold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Update Risk Priors</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
