"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  Layers,
  Sparkles,
  ArrowRight,
  User,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { PatientContext, PresetCase } from "../types";
import TactileSkinDepthMesh from "./TactileSkinDepthMesh";
import GuidedSmartCamera from "./GuidedSmartCamera";

interface PatientIntakeCardProps {
  patientContext: PatientContext;
  onChangeContext: (ctx: PatientContext) => void;
  selectedImageUrl: string | null;
  selectedImageId: string | null;
  selectedImageFile: File | null;
  onSelectImageFile: (file: File) => void;
  onSelectPreset: (preset: PresetCase) => void;
  onCameraCapture: (blob: Blob, dataUrl: string) => void;
  presets: PresetCase[];
  onStartAnalysis: () => void;
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

export default function PatientIntakeCard({
  patientContext,
  onChangeContext,
  selectedImageUrl,
  selectedImageId,
  selectedImageFile,
  onSelectImageFile,
  onSelectPreset,
  onCameraCapture,
  presets,
  onStartAnalysis,
  isLoading,
}: PatientIntakeCardProps) {
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [ageNotProvided, setAgeNotProvided] = useState<boolean>(patientContext.age === null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelectImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSelectImageFile(e.target.files[0]);
    }
  };

  const handleAgeToggle = (checked: boolean) => {
    setAgeNotProvided(checked);
    onChangeContext({
      ...patientContext,
      age: checked ? null : 45,
    });
  };

  return (
    <div className="w-full rounded-[28px] bg-white border border-[#F2E8E3] shadow-[0_12px_36px_rgba(28,25,23,0.05)] p-6 sm:p-8">
      {/* Section A: 2-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (6 cols): Skin Lesion Image Input + 2D/3D Topography Toggle */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E3]">
            <div>
              <span className="text-[11px] font-bold text-[#E85D44] uppercase tracking-wider block">
                Section A • Optical Input
              </span>
              <h2 className="text-lg font-extrabold text-[#18181B] tracking-tight">
                Dermoscopy Acquisition & Relief
              </h2>
            </div>

            {/* 2D Standard vs 3D Topography Mesh Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-[#FAF4F0] border border-[#F2E8E3] text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("2d")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "2d"
                    ? "bg-white text-[#18181B] shadow-sm border border-[#E5DCD4]"
                    : "text-[#78716C] hover:text-[#18181B]"
                }`}
              >
                Standard 2D
              </button>
              <button
                type="button"
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "3d"
                    ? "bg-[#E85D44] text-white shadow-sm"
                    : "text-[#78716C] hover:text-[#18181B]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3D Relief</span>
              </button>
            </div>
          </div>

          {/* Active Image Canvas / 3D Mesh / Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative w-full rounded-[24px] overflow-hidden border-2 transition-all ${
              selectedImageUrl
                ? "aspect-[4/3] border-[#F2E8E3] bg-[#FAF4F0]"
                : dragOver
                ? "h-[140px] sm:h-[160px] border-[#E85D44] bg-[#FCEAE3]/40"
                : "h-[140px] sm:h-[160px] border-[#F2E8E3] border-dashed bg-[#FAF4F0]/60 hover:border-[#E85D44]/60 hover:bg-[#FCEAE3]/20"
            } flex items-center justify-center`}
          >
            {selectedImageUrl ? (
              viewMode === "2d" ? (
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <img
                    src={selectedImageUrl}
                    alt="Active Skin Scan"
                    className="w-full h-full object-contain rounded-[20px]"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                    Scan ID: {selectedImageId || "Custom"}
                  </div>
                </div>
              ) : (
                <TactileSkinDepthMesh imageUrl={selectedImageUrl} className="w-full h-full" />
              )
            ) : (
              <div className="text-center p-4 space-y-2">
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-[#F2E8E3] flex items-center justify-center mx-auto text-[#E85D44]">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#18181B]">
                    Drag & Drop Dermoscopy Scan
                  </h4>
                  <p className="text-[11px] text-[#78716C] mt-0.5">
                    Supports high-resolution dermatologic JPEG, PNG, or TIFF
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Row: Upload Scan, Live Camera, & Hidden File Input */}
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#18181B] shadow-sm transition-all"
            >
              <Upload className="w-4 h-4 text-[#E85D44]" />
              <span>Upload Dermoscopy Scan</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#18181B] shadow-sm transition-all"
            >
              <Camera className="w-4 h-4 text-[#0D9488]" />
              <span>Smart Camera</span>
            </button>
          </div>

          {/* 5 Real Patient Clinical Cases Selector */}
          <div className="space-y-2 pt-2 border-t border-[#F2E8E3]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E85D44]" />
                <span>Load Clinical Case (5 Hospital Scenarios)</span>
              </label>
              <span className="text-[10px] text-[#A8A29E] font-medium">Click to load</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((preset) => {
                const isSelected = selectedImageId === preset.image_id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      if (preset.age === null) {
                        setAgeNotProvided(true);
                      } else {
                        setAgeNotProvided(false);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-[#E85D44]/10 border-[#E85D44] shadow-sm"
                        : "bg-[#FAF4F0] border-[#F2E8E3] hover:border-[#E5DCD4]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-[#18181B] truncate">
                        {preset.patient_name || preset.disease_name}
                      </span>
                      <span
                        className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                          preset.badge_color === "rose"
                            ? "bg-[#E11D48]/15 text-[#E11D48]"
                            : preset.badge_color === "amber"
                            ? "bg-[#F59E0B]/15 text-[#B45309]"
                            : "bg-[#10B981]/15 text-[#047857]"
                        }`}
                      >
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78716C] line-clamp-1">
                      {preset.scenario_title || preset.clinical_history}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (6 cols): Patient Clinical Profile & Run Assessment */}
        <div className="lg:col-span-6 space-y-5">
          <div className="pb-3 border-b border-[#F2E8E3]">
            <span className="text-[11px] font-bold text-[#E85D44] uppercase tracking-wider block">
              Section A • Context Prior
            </span>
            <h2 className="text-lg font-extrabold text-[#18181B] tracking-tight">
              Patient Clinical Profile
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Demographic variables calibrate Reasoning / Context Agent Bayesian epidemiological priors.
            </p>
          </div>

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
                  onChange={(e) =>
                    onChangeContext({
                      ...patientContext,
                      age: parseInt(e.target.value, 10) || null,
                    })
                  }
                  className="w-16 px-2 py-1 text-center font-bold text-xs bg-white border border-[#F2E8E3] rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Biological Sex */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-[#18181B] uppercase tracking-wider block">
              Biological Sex
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "male", label: "Male" },
                { id: "female", label: "Female" },
                { id: "unspecified", label: "Unspecified" },
              ].map((s) => {
                const isSelected = patientContext.sex === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      onChangeContext({
                        ...patientContext,
                        sex: s.id as any,
                      })
                    }
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-[#E85D44] text-white shadow-sm shadow-[#E85D44]/25"
                        : "bg-[#FAF4F0] border border-[#F2E8E3] text-[#78716C] hover:text-[#18181B]"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anatomical Lesion Location (Wrapping Pills) */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-[#18181B] uppercase tracking-wider block">
              Anatomical Site ({BODY_ZONES.length} Locations)
            </label>
            <div className="flex flex-wrap gap-2">
              {BODY_ZONES.map((zone) => {
                const normZone = zone.toLowerCase();
                const isSelected = patientContext.localization.toLowerCase() === normZone;
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() =>
                      onChangeContext({
                        ...patientContext,
                        localization: normZone,
                      })
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-[#18181B] text-white shadow-sm"
                        : "bg-[#FAF4F0] border border-[#F2E8E3] text-[#78716C] hover:text-[#18181B] hover:border-[#E5DCD4]"
                    }`}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action Button: Run Multi-Agent Assessment */}
          <div className="pt-3 border-t border-[#F2E8E3]">
            <button
              type="button"
              disabled={isLoading || !selectedImageUrl}
              onClick={onStartAnalysis}
              className={`w-full py-4 px-6 rounded-2xl text-sm font-extrabold tracking-wide flex items-center justify-center gap-3 transition-all duration-300 shadow-md ${
                !selectedImageUrl
                  ? "bg-[#E5DCD4] text-[#A8A29E] cursor-not-allowed"
                  : isLoading
                  ? "bg-[#E85D44]/80 text-white cursor-wait"
                  : "bg-gradient-to-r from-[#E85D44] to-[#F27059] text-white hover:shadow-lg hover:shadow-[#E85D44]/30 hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executing 6-Agent Consensus Pipeline...</span>
                </>
              ) : (
                <>
                  <span>Run Multi-Agent Clinical Assessment</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
            <p className="text-[11px] text-[#A8A29E] text-center mt-2 font-medium">
              Synchronous evaluation across Optical Quality, Neural Inference, ABCD Morphometry, Demographic Context, and Deterministic Safety Veto.
            </p>
          </div>
        </div>
      </div>

      {/* Smart Camera Modal */}
      {isCameraModalOpen && (
        <GuidedSmartCamera
          onCapture={(blob, dataUrl) => {
            onCameraCapture(blob, dataUrl);
            setIsCameraModalOpen(false);
          }}
          onClose={() => setIsCameraModalOpen(false)}
        />
      )}
    </div>
  );
}
