"use client";

import React, { useState } from "react";
import {
  Upload,
  Camera,
  User,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Activity,
  HeartPulse,
} from "lucide-react";
import { PatientContext, PresetCase } from "../types";
import GuidedSmartCamera from "./GuidedSmartCamera";

interface PatientIntakeViewProps {
  patientContext: PatientContext;
  onChangeContext: (ctx: PatientContext) => void;
  selectedImageFile: File | null;
  selectedImageUrl: string | null;
  selectedImageId: string | null;
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
];

export default function PatientIntakeView({
  patientContext,
  onChangeContext,
  selectedImageFile,
  selectedImageUrl,
  selectedImageId,
  onSelectImageFile,
  onSelectPreset,
  onCameraCapture,
  presets,
  onStartAnalysis,
  isLoading,
}: PatientIntakeViewProps) {
  const [acquisitionTab, setAcquisitionTab] = useState<"upload" | "camera">("upload");
  const [dragOver, setDragOver] = useState<boolean>(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelectImageFile(e.dataTransfer.files[0]);
    }
  };

  const isWebRtcCapture = selectedImageId?.startsWith("WEBRTC") || selectedImageFile?.name?.startsWith("capture_");

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300 min-w-0">
      {/* Top Editorial Hero Banner */}
      <section className="relative overflow-hidden rounded-[32px] p-6 sm:p-10 lg:p-12 glass-card border border-white min-w-0">
        {/* Soft background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E85D44]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#0D9488]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center min-w-0">
          {/* Left Column: Headline & Telemetry */}
          <div className="lg:col-span-7 space-y-4 min-w-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#F3EAE3] text-xs font-semibold text-[#18181B] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#E85D44] animate-pulse" />
              <span>Jaypee Agentic AI Summit 2026 • Track 2 Healthcare</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#18181B] leading-[1.15]">
              Autonomous <span className="text-[#E85D44]">6-Agent</span> Clinical Dermatology & Safety Triage
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-[#71717A] max-w-xl leading-relaxed font-normal">
              Combining physics-calibrated optical quality, multi-modal neural lesion classification, ABCD geometry, and deterministic safety vetoes to eliminate silent false-negatives in skin oncology.
            </p>

            {/* Live Model Telemetry Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#F3EAE3] shadow-sm text-xs font-bold text-[#18181B]">
                <Activity className="w-4 h-4 text-[#10B981]" />
                <span>83.26% Validation Accuracy</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#F3EAE3] shadow-sm text-xs font-bold text-[#18181B]">
                <HeartPulse className="w-4 h-4 text-[#E85D44]" />
                <span>0.7177 Macro-F1</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#F3EAE3] shadow-sm text-xs font-bold text-[#18181B]">
                <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                <span>6-Agent Consensus</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Visual Card */}
          <div className="lg:col-span-5 relative min-w-0">
            <div className="relative mx-auto max-w-sm rounded-[28px] overflow-hidden p-2 bg-gradient-to-b from-white to-[#FAF5F0] border border-white shadow-[0_20px_40px_rgba(28,25,23,0.08)]">
              <div className="relative aspect-[4/3] rounded-[22px] overflow-hidden bg-[#F3EAE3]">
                {/* Real Dermatology Editorial Photography */}
                <img
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80"
                  alt="Clinical Dermatology Examination"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#FFA08A]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Multi-Stage Pipeline
                  </div>
                  <p className="text-xs font-medium leading-tight text-white/95 mt-0.5">
                    Continuous feedback between optical quality and neural inference
                  </p>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="p-3 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#18181B]">Hospital-Grade Safety Veto</span>
                <span className="px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#047857] font-bold text-[10px]">
                  Zero Silent Misses
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick-Fill Verified Clinical Cases Bar */}
      <section className="glass-card-subtle p-5 border border-white min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3.5">
          <div>
            <h2 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E85D44]" />
              Curated Clinical Cases (1-Click Test Presets)
            </h2>
            <p className="text-xs text-[#71717A]">
              Load verified dermoscopy cases from our evaluation cohort to test the full 6-agent triage flow
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#0D9488] bg-[#0D9488]/10 px-2.5 py-1 rounded-full whitespace-nowrap">
            7 Classes + 1 Quality Gate Case
          </span>
        </div>

        {/* Preset Cards Container */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 min-w-0">
          {presets.map((preset) => {
            const isSelected = selectedImageId === preset.image_id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`relative flex flex-col text-left p-2 rounded-2xl border transition-all duration-200 group cursor-pointer ${
                  isSelected
                    ? "bg-[#E85D44]/10 border-[#E85D44] shadow-md shadow-[#E85D44]/15 scale-[1.02]"
                    : "bg-white/80 border-[#F3EAE3] hover:border-[#D4C5B9] hover:bg-white"
                }`}
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100 mb-1.5">
                  <img
                    src={`/samples/${preset.image_id}.jpg`}
                    alt={preset.disease_name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `http://localhost:8000/api/image/${preset.image_id}`;
                    }}
                  />
                  <span
                    className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      preset.badge_color === "rose"
                        ? "bg-[#E11D48] text-white"
                        : preset.badge_color === "amber"
                        ? "bg-[#F59E0B] text-white"
                        : "bg-[#10B981] text-white"
                    }`}
                  >
                    {preset.dx.toUpperCase()}
                  </span>
                </div>

                <span className="text-[11px] font-bold text-[#18181B] truncate leading-tight">
                  {preset.dx === "mel"
                    ? "Melanoma"
                    : preset.dx === "bcc"
                    ? "Basal Cell"
                    : preset.dx === "nv"
                    ? "Benign Mole"
                    : preset.dx === "bkl"
                    ? "Keratosis"
                    : preset.dx === "akiec"
                    ? "Bowen's"
                    : preset.dx === "vasc"
                    ? "Angioma"
                    : preset.dx === "df"
                    ? "Histiocytoma"
                    : "Blur Artifact"}
                </span>
                <span className="text-[10px] text-[#71717A] mt-0.5">
                  {preset.age}y • {preset.sex === "male" ? "M" : "F"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main 2-Column Intake Wizard Card */}
      <section className="glass-card p-5 sm:p-8 lg:p-10 border border-white overflow-hidden min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 min-w-0">
          {/* Left Column (Step 1: Patient Context) */}
          <div className="lg:col-span-5 space-y-6 min-w-0 w-full">
            <div className="border-b border-[#F3EAE3] pb-4">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E85D44] text-white text-xs font-bold">
                  1
                </span>
                <h3 className="text-base font-bold text-[#18181B]">Patient Clinical Context</h3>
              </div>
              <p className="text-xs text-[#71717A] mt-1">
                Demographics dynamically adjust Agent 4 Bayesian epidemiological malignancy priors
              </p>
            </div>

            {/* Age Slider + Number Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#18181B]">
                <label className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#E85D44]" />
                  <span>Patient Age</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={95}
                    value={patientContext.age}
                    onChange={(e) =>
                      onChangeContext({
                        ...patientContext,
                        age: Math.max(1, Math.min(95, parseInt(e.target.value) || 1)),
                      })
                    }
                    className="w-14 px-2 py-1 text-center font-bold text-xs bg-[#FAF5F0] border border-[#E4D8CF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E85D44]"
                  />
                  <span className="text-[#71717A] text-xs">years</span>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={95}
                value={patientContext.age}
                onChange={(e) =>
                  onChangeContext({
                    ...patientContext,
                    age: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-[#EFE5DC] rounded-lg appearance-none cursor-pointer accent-[#E85D44]"
              />
              <div className="flex justify-between text-[10px] text-[#A1A1AA] font-medium">
                <span>Infant (1)</span>
                <span>Adult (45)</span>
                <span>Geriatric (95)</span>
              </div>
            </div>

            {/* Biological Sex Pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#18181B] block">Biological Sex</label>
              <div className="grid grid-cols-2 gap-2">
                {(["male", "female"] as const).map((s) => {
                  const isChecked = patientContext.sex === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onChangeContext({ ...patientContext, sex: s })}
                      className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold capitalize transition-all border cursor-pointer ${
                        isChecked
                          ? "bg-[#18181B] text-white border-[#18181B] shadow-sm"
                          : "bg-[#FAF5F0] text-[#71717A] border-[#E4D8CF] hover:bg-white"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Anatomical Body-Zone Selector (Wrapped cleanly with no truncation) */}
            <div className="space-y-2 min-w-0">
              <div className="flex items-center justify-between text-xs font-bold text-[#18181B]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>Anatomical Location</span>
                </span>
                <span className="text-[11px] font-semibold text-[#0D9488] capitalize">
                  {patientContext.localization}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 p-2 bg-[#FAF5F0] rounded-2xl border border-[#F3EAE3] max-h-56 overflow-y-auto min-w-0">
                {BODY_ZONES.map((zone) => {
                  const isSelected =
                    patientContext.localization.toLowerCase() === zone.toLowerCase();
                  return (
                    <button
                      key={zone}
                      type="button"
                      onClick={() =>
                        onChangeContext({
                          ...patientContext,
                          localization: zone.toLowerCase(),
                        })
                      }
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? "bg-[#0D9488] text-white border-[#0D9488] shadow-sm"
                          : "bg-white text-[#71717A] border-[#E4D8CF] hover:text-[#18181B] hover:border-[#D4C5B9]"
                      }`}
                    >
                      {zone}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column (Step 2: Image Acquisition) */}
          <div className="lg:col-span-7 space-y-4 min-w-0 w-full">
            <div className="border-b border-[#F3EAE3] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E85D44] text-white text-xs font-bold">
                    2
                  </span>
                  <h3 className="text-base font-bold text-[#18181B]">
                    Image Acquisition & Smart Camera
                  </h3>
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Real-time 6-stage ROI computer vision validation
                </p>
              </div>

              {/* Acquisition Method Tabs */}
              <div className="inline-flex p-1 bg-[#FAF5F0] rounded-xl border border-[#F3EAE3]">
                <button
                  type="button"
                  onClick={() => setAcquisitionTab("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    acquisitionTab === "upload"
                      ? "bg-white text-[#18181B] shadow-sm"
                      : "text-[#71717A] hover:text-[#18181B]"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAcquisitionTab("camera")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    acquisitionTab === "camera"
                      ? "bg-white text-[#18181B] shadow-sm"
                      : "text-[#71717A] hover:text-[#18181B]"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Guided Camera</span>
                </button>
              </div>
            </div>

            {/* Tab 1: Upload Dermoscopy Photo */}
            {acquisitionTab === "upload" ? (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center p-8 rounded-[24px] border-2 border-dashed transition-all cursor-pointer ${
                    dragOver
                      ? "border-[#E85D44] bg-[#E85D44]/5"
                      : "border-[#E4D8CF] hover:border-[#E85D44] bg-[#FAF5F0]/60"
                  }`}
                  onClick={() => document.getElementById("file-input-scan")?.click()}
                >
                  <input
                    id="file-input-scan"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        onSelectImageFile(e.target.files[0]);
                      }
                    }}
                  />

                  {selectedImageUrl ? (
                    <div className="flex flex-col sm:flex-row items-center gap-5 w-full">
                      <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-stone-100 flex-shrink-0">
                        <img
                          src={selectedImageUrl}
                          alt="Selected Dermoscopy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 text-left space-y-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#047857] text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dermoscopy Photo Ready</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#18181B] truncate">
                          {selectedImageFile?.name || selectedImageId || "Preset Image Selected"}
                        </h4>
                        <p className="text-xs text-[#71717A]">
                          Ready for 6-Agent consensus screening. Click box to choose another image.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#E85D44]/10 text-[#E85D44] flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-[#18181B]">
                        Drag and drop dermoscopy photograph
                      </h4>
                      <p className="text-xs text-[#71717A] max-w-xs">
                        Supports high-resolution dermatological JPEG, PNG, or DICOM exports.
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-white rounded-xl text-xs font-semibold text-[#18181B] border border-[#E4D8CF] shadow-sm">
                        Browse Local Files
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Tab 2: Live AI Guided Smart Camera */
              <div className="space-y-3">
                <GuidedSmartCamera onCapture={onCameraCapture} />

                {/* Captured Image Preview Bar (if camera captured a scan) */}
                {isWebRtcCapture && selectedImageUrl && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] animate-in fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={selectedImageUrl}
                        alt="Captured Scan"
                        className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#18181B] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>Certified Scan Locked & Captured</span>
                        </div>
                        <p className="text-[10px] text-[#71717A] truncate">
                          6-Stage CV passed. Click Run Screening below to execute 6 agents.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Switch back to taking another camera shot
                        onCameraCapture(new Blob(), "");
                      }}
                      className="px-3 py-1.5 bg-white border border-[#E4D8CF] hover:bg-stone-50 text-xs font-bold text-[#18181B] rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                    >
                      <RefreshCw className="w-3 h-3 text-[#E85D44]" />
                      <span>Retake</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Bottom CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onStartAnalysis}
                disabled={!selectedImageUrl || isLoading}
                className="w-full flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 bg-gradient-to-r from-[#E85D44] via-[#F27059] to-[#D4472E] hover:from-[#D4472E] hover:to-[#E85D44] text-white rounded-[20px] text-sm font-bold tracking-wide transition-all shadow-lg shadow-[#E85D44]/30 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing 6-Agent Consensus Pipeline...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <span>Verify & Run 6-Agent Screening</span>
                    <ArrowRight className="w-4 h-4 text-white/90" />
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-[#71717A] mt-2">
                Deterministic safety evaluation ensures zero false-negative benign discharges.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
