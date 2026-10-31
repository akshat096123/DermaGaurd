"use client";

import React, { useRef, useState } from "react";
import { PatientContext, PresetCase } from "../types";
import {
  Upload,
  Camera,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  FileImage,
} from "lucide-react";
import GuidedSmartCamera from "./GuidedSmartCamera";

interface Page1IntakeProps {
  sessionId: string;
  selectedImageUrl: string | null;
  selectedImageId: string | null;
  selectedImageFile: File | null;
  patientContext: PatientContext;
  presets: PresetCase[];
  isLoading: boolean;
  onSelectImageFile: (file: File) => void;
  onSelectPreset: (preset: PresetCase) => void;
  onCameraCapture: (blob: Blob, dataUrl: string) => void;
  onClearImage: () => void;
  onChangeContext: (ctx: PatientContext) => void;
  onStartAnalysis: () => void;
}

const COMMON_LOCATIONS = [
  "upper extremity",
  "lower extremity",
  "back",
  "trunk",
  "face",
  "scalp",
  "chest",
  "abdomen",
  "neck",
  "acral",
];

export default function Page1Intake({
  sessionId,
  selectedImageUrl,
  selectedImageId,
  selectedImageFile,
  patientContext,
  presets,
  isLoading,
  onSelectImageFile,
  onSelectPreset,
  onCameraCapture,
  onClearImage,
  onChangeContext,
  onStartAnalysis,
}: Page1IntakeProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onSelectImageFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onSelectImageFile(file);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Brand Header Banner for Page 1 */}
      <div className="rounded-[32px] bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_16px_45px_-6px_rgba(28,25,23,0.06)] hover:shadow-[0_20px_55px_-6px_rgba(28,25,23,0.08)] p-6 sm:p-8 space-y-6 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F2E8E3] gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E85D44] via-[#F27059] to-[#D4472E] text-white shadow-lg shadow-[#E85D44]/30 ring-2 ring-white/80 shrink-0">
              <Shield className="w-7 h-7 text-white" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#10B981] border-2 border-white rounded-full shadow-xs" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#18181B]">
                  DermaGuard <span className="text-[#E85D44]">Clinical</span>
                </span>
                <span className="px-2.5 py-0.5 text-xs font-black tracking-wide uppercase rounded-full bg-[#E85D44]/10 text-[#E85D44] border border-[#E85D44]/20 shadow-xs">
                  PAGE 1 OF 5
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#78716C] font-semibold mt-0.5">
                Step-by-Step Autonomous Dermatology Triage Workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-[#FAF4F0] border border-[#F2E8E3] text-[#78716C] font-mono text-xs">
              Session ID: <strong className="text-[#18181B]">{sessionId}</strong>
            </div>
          </div>
        </div>

        {/* Page 1 Title */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#E85D44] uppercase tracking-wider block">
            PAGE 1 – Image Upload & Patient Information
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#18181B] tracking-tight">
            Patient Intake & Clinical Dermoscopy Ingestion
          </h1>
          <p className="text-xs text-[#78716C]">
            Please upload a high-resolution dermoscopic image and enter patient demographic details before launching the multi-agent diagnostic pipeline.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: UPLOAD SKIN LESION IMAGE */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E85D44] text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-extrabold text-[#18181B] uppercase tracking-wider">
                Step 1: Upload Skin Lesion Image
              </h2>
            </div>
            {selectedImageUrl && (
              <span className="text-[11px] text-[#10B981] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Image Loaded
              </span>
            )}
          </div>

          {/* Interactive Dropzone Stage (Compact Height) */}
          <div
            onDragOver={(e) => {
              if (isCameraActive) return;
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              if (isCameraActive) return;
              handleDrop(e);
            }}
            className={`relative w-full rounded-[24px] overflow-hidden border-2 transition-all ${
              isCameraActive
                ? "aspect-[16/10] max-h-[380px] border-[#0D9488]/40 bg-stone-950 shadow-md"
                : selectedImageUrl
                ? "h-[240px] sm:h-[300px] border-[#F2E8E3] bg-[#FAF4F0]"
                : dragOver
                ? "h-[140px] sm:h-[160px] border-[#E85D44] bg-[#FCEAE3]/40"
                : "h-[140px] sm:h-[160px] border-[#F2E8E3] border-dashed bg-[#FAF4F0]/60 hover:border-[#E85D44]/60 hover:bg-[#FCEAE3]/20"
            } flex items-center justify-center`}
          >
            {isCameraActive ? (
              <GuidedSmartCamera
                inline
                onCapture={(blob, dataUrl) => {
                  onCameraCapture(blob, dataUrl);
                  setIsCameraActive(false);
                }}
                onClose={() => setIsCameraActive(false)}
                className="w-full h-full"
              />
            ) : selectedImageUrl ? (
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <img
                  src={selectedImageUrl}
                  alt="Patient Dermoscopy Scan"
                  className="w-full h-full object-contain rounded-[18px]"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <FileImage className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Scan: {selectedImageId || "Custom Upload"}</span>
                </div>
                <button
                  type="button"
                  onClick={onClearImage}
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-[#E11D48] text-xs font-bold flex items-center gap-1.5 shadow-md border border-[#F2E8E3] transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Image</span>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="text-center p-4 sm:p-5 space-y-2 cursor-pointer select-none group"
              >
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-[#F2E8E3] flex items-center justify-center mx-auto text-[#E85D44] group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#18181B] group-hover:text-[#E85D44] transition-colors leading-tight">
                    Drag & Drop Dermoscopy Scan Here
                  </h3>
                  <p className="text-[11px] text-[#78716C] mt-0.5">
                    Or click anywhere in this area to browse from your device (JPEG, PNG, TIFF up to 25MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Row: Upload Scan, Live Camera */}
          <div className="flex flex-wrap items-center gap-3">
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
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#F2E8E3] hover:border-[#E5DCD4] text-xs font-bold text-[#18181B] shadow-sm hover:shadow transition-all"
            >
              <Upload className="w-4 h-4 text-[#E85D44]" />
              <span>Browse From Device</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraActive((prev) => !prev)}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border text-xs font-bold shadow-sm transition-all ${
                isCameraActive
                  ? "bg-[#E11D48]/10 border-[#E11D48] text-[#E11D48]"
                  : "bg-white border-[#F2E8E3] hover:border-[#E5DCD4] text-[#18181B]"
              }`}
            >
              <Camera className={`w-4 h-4 ${isCameraActive ? "text-[#E11D48]" : "text-[#0D9488]"}`} />
              <span>{isCameraActive ? "Close Camera" : "Capture Live Feed"}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 2: ENTER PATIENT INFORMATION */}
        {/* ========================================================================= */}
        <div className="space-y-4 pt-4 border-t border-[#F2E8E3]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#E85D44] text-white text-xs font-black flex items-center justify-center">
              2
            </span>
            <h2 className="text-sm font-extrabold text-[#18181B] uppercase tracking-wider">
              Step 2: Enter Patient Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Age Field */}
            <div className="p-4 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#18181B] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#E85D44]" />
                  <span>Patient Age</span>
                </label>
                {patientContext.age !== null && (
                  <span className="text-xs font-extrabold text-[#E85D44]">
                    {patientContext.age} yrs
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={patientContext.age !== null ? patientContext.age : ""}
                  placeholder="e.g. 45"
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    onChangeContext({
                      ...patientContext,
                      age: val === "" ? null : Number(val),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#F2E8E3] text-xs font-bold text-[#18181B] focus:outline-none focus:border-[#E85D44]"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChangeContext({
                      ...patientContext,
                      age: patientContext.age === null ? 45 : null,
                    })
                  }
                  className={`px-2.5 py-2 rounded-xl text-[10px] font-bold border shrink-0 transition-all ${
                    patientContext.age === null
                      ? "bg-[#E85D44] text-white border-[#E85D44]"
                      : "bg-white text-[#78716C] border-[#F2E8E3]"
                  }`}
                >
                  {patientContext.age === null ? "Unspecified" : "Set Null"}
                </button>
              </div>
              <p className="text-[10px] text-[#A8A29E]">
                Missing age will be handled with Bayesian neutral priors.
              </p>
            </div>

            {/* Gender / Sex Field */}
            <div className="p-4 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-2">
              <label className="text-xs font-bold text-[#18181B] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#E85D44]" />
                <span>Biological Sex / Gender</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["male", "female", "unspecified"] as const).map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() =>
                      onChangeContext({
                        ...patientContext,
                        sex: gender,
                      })
                    }
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold capitalize transition-all border ${
                      patientContext.sex === gender
                        ? "bg-[#E85D44] text-white border-[#E85D44] shadow-sm"
                        : "bg-white text-[#78716C] border-[#F2E8E3] hover:border-[#E5DCD4]"
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#A8A29E]">
                Used by Reasoning / Context Agent for epidemiological risk stratification.
              </p>
            </div>

            {/* Lesion Location Field */}
            <div className="p-4 rounded-2xl bg-[#FAF4F0]/60 border border-[#F2E8E3] space-y-2">
              <label className="text-xs font-bold text-[#18181B] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E85D44]" />
                <span>Lesion Anatomical Location</span>
              </label>
              <select
                value={patientContext.localization || "upper extremity"}
                onChange={(e) =>
                  onChangeContext({
                    ...patientContext,
                    localization: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#F2E8E3] text-xs font-bold text-[#18181B] capitalize focus:outline-none focus:border-[#E85D44]"
              >
                {COMMON_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc} className="capitalize">
                    {loc}
                  </option>
                ))}
                <option value="unspecified">Unspecified / Unknown</option>
              </select>
              <p className="text-[10px] text-[#A8A29E]">
                Predisposition site (e.g. back, trunk, face, scalp, extremities).
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STEP 3: START ANALYSIS */}
        {/* ========================================================================= */}
        <div className="pt-4 border-t border-[#F2E8E3] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E85D44] text-white text-xs font-black flex items-center justify-center">
                3
              </span>
              <h2 className="text-sm font-extrabold text-[#18181B] uppercase tracking-wider">
                Step 3: Start 6-Agent Clinical Analysis
              </h2>
            </div>
            <span className="text-[11px] text-[#78716C]">
              Transfers to <strong>Page 2 (Image Quality Agent & Diagnosis Agent)</strong>
            </span>
          </div>

          <button
            type="button"
            disabled={isLoading || !selectedImageUrl}
            onClick={onStartAnalysis}
            className={`w-full py-4 px-6 rounded-2xl text-sm font-extrabold tracking-wide flex items-center justify-center gap-3 transition-all duration-300 shadow-md ${
              !selectedImageUrl
                ? "bg-[#E5DCD4] text-[#A8A29E] cursor-not-allowed"
                : isLoading
                ? "bg-[#E85D44]/80 text-white cursor-wait"
                : "bg-gradient-to-r from-[#E85D44] via-[#F27059] to-[#E85D44] text-white hover:shadow-xl hover:shadow-[#E85D44]/30 hover:scale-[1.008] active:scale-[0.99]"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Launching 6-Agent Inference Engine...</span>
              </>
            ) : !selectedImageUrl ? (
              <>
                <AlertCircle className="w-5 h-5" />
                <span>Please Upload a Dermoscopy Scan Above to Start Analysis</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Start Multi-Agent Analysis (Advance to Page 2)</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-[11px] text-[#A8A29E] text-center font-medium">
            Clinical Workflow: <strong>Page 1 (Intake)</strong> → <strong>Page 2 (Image Quality & Diagnosis)</strong> → <strong>Page 3 (Lesion & Context)</strong> → <strong>Page 4 (Safety & Coordinator)</strong> → <strong>Page 5 (Picture Result)</strong>
          </p>
        </div>

        {/* ========================================================================= */}
        {/* QUICK-LOAD CLINICAL BENCHMARK CASES (5 SCENARIOS) - MOVED TO LAST OF PAGE 1 */}
        {/* ========================================================================= */}
        <div className="space-y-2.5 pt-5 border-t border-[#F2E8E3]">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E85D44]" />
              <span>Quick-Load Clinical Benchmark Cases (5 Scenarios)</span>
            </label>
            <span className="text-[10px] text-[#A8A29E]">Selects image + demographic context</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {presets.map((preset) => {
              const isSelected = selectedImageId === preset.image_id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-[#E85D44]/10 border-[#E85D44] ring-1 ring-[#E85D44]"
                      : "bg-[#FAF4F0] border-[#F2E8E3] hover:border-[#E5DCD4]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
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
                  <p className="text-[10px] text-[#78716C] line-clamp-1">
                    {preset.scenario_title || preset.clinical_history}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
