"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, Zap, CheckCircle2, AlertCircle, Crosshair, Sparkles } from "lucide-react";

interface CameraTelemetry {
  skinRatio: number;
  isSkinOk: boolean;
  hairBgRatio: number;

  tiltDeg: number;
  isTiltOk: boolean;

  motionDelta: number;
  stabilityPercent: number;
  isMotionOk: boolean;

  meanLuminance: number;
  glareRatio: number;
  isLightingOk: boolean;
  isGlareOk: boolean;

  focusScore: number;
  isFocusOk: boolean;

  consecutivePasses: number;
  lockPercent: number;
  isOptimal: boolean;
  overallStatus: "OPTIMAL" | "LOCKING" | "ADJUSTING" | "CRITICAL";
  guideMessage: string;
}

interface GuidedSmartCameraProps {
  onCapture: (blob: Blob, dataUrl: string) => void;
  className?: string;
}

export default function GuidedSmartCamera({
  onCapture,
  className = "",
}: GuidedSmartCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevFrameLuminanceRef = useRef<Float32Array | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState<boolean>(true);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Consecutive pass streak (needs 6 checks at 150ms = ~1s lock)
  const streakRef = useRef<number>(0);

  const [telemetry, setTelemetry] = useState<CameraTelemetry>({
    skinRatio: 0.95,
    isSkinOk: true,
    hairBgRatio: 0.02,
    tiltDeg: 4,
    isTiltOk: true,
    motionDelta: 1.2,
    stabilityPercent: 92,
    isMotionOk: true,
    meanLuminance: 125,
    glareRatio: 0.01,
    isLightingOk: true,
    isGlareOk: true,
    focusScore: 68,
    isFocusOk: true,
    consecutivePasses: 0,
    lockPercent: 0,
    isOptimal: false,
    overallStatus: "ADJUSTING",
    guideMessage: "Move skin closer to completely fill the center ring",
  });

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setErrorMessage(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasPermission(true);
    } catch (err: any) {
      console.warn("Camera access failed or unavailable:", err);
      setHasPermission(false);
      setErrorMessage(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in browser settings or upload a dermoscopic file."
          : "Webcam stream unavailable. You can upload a dermoscopic photo or load verified clinical cases."
      );
    }
  }, []);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Frame Capture Function (Unmirrored for true dermoscopic geometry)
  const triggerCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsCapturing(true);

    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth || 1280;
    captureCanvas.height = video.videoHeight || 720;
    const ctx = captureCanvas.getContext("2d");

    if (ctx) {
      // Un-mirrored capture (standard camera sensor orientation)
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
      const dataUrl = captureCanvas.toDataURL("image/jpeg", 0.95);

      captureCanvas.toBlob(
        (blob) => {
          if (blob) {
            onCapture(blob, dataUrl);
          }
          setIsCapturing(false);
        },
        "image/jpeg",
        0.95
      );
    } else {
      setIsCapturing(false);
    }
  }, [onCapture]);

  // 6-Stage ROI Computer Vision Pipeline (Runs every 150ms strictly on center target circle)
  const analyzeFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Use 240x150 downscaled working canvas (16:10 aspect ratio)
    const sampleW = 240;
    const sampleH = 150;
    canvas.width = sampleW;
    canvas.height = sampleH;

    ctx.drawImage(video, 0, 0, sampleW, sampleH);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;

    const centerX = sampleW / 2;
    const centerY = sampleH / 2;
    const radius = sampleW * 0.25; // radius = 25% of frame width (60px)
    const radiusSq = radius * radius;

    // Fast 2D array of luminance values
    const lumGrid = new Float32Array(sampleW * sampleH);

    let nCircle = 0;
    let nValidSkin = 0;
    let nHairOrBg = 0;
    let nGlare = 0;
    let sumLuminance = 0;
    let sumSkinLuminance = 0;

    // Quadrant sums for Stage 2 Angle Tilt
    let yLeftSum = 0, yLeftCount = 0;
    let yRightSum = 0, yRightCount = 0;
    let yTopSum = 0, yTopCount = 0;
    let yBottomSum = 0, yBottomCount = 0;

    // Stage 1: YCbCr Chrominance & Hair/Background Evaluation
    for (let y = 0; y < sampleH; y++) {
      for (let x = 0; x < sampleW; x++) {
        const idx = (y * sampleW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Standard digital perceived luminance Y
        const Y = 0.299 * r + 0.587 * g + 0.114 * b;
        lumGrid[y * sampleW + x] = Y;

        const distSq = (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY);
        if (distSq <= radiusSq) {
          nCircle++;
          sumLuminance += Y;

          // YCbCr conversion
          const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
          const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;

          // Human skin chrominance test
          const isSkin =
            Cr >= 135 &&
            Cr <= 175 &&
            Cb >= 80 &&
            Cb <= 125 &&
            r > 95 &&
            g > 40 &&
            b > 20 &&
            r > g &&
            r > b &&
            Math.abs(r - g) > 15;

          // Dark hair / shadow rejection (Y < 55) & Desaturated background rejection
          const maxRGB = Math.max(r, g, b);
          const minRGB = Math.min(r, g, b);
          const isDark = Y < 55;
          const isDesaturated = maxRGB - minRGB < 18;
          const isHairOrBg = isDark || isDesaturated;

          if (isSkin) {
            nValidSkin++;
            sumSkinLuminance += Y;
          }
          if (isHairOrBg) {
            nHairOrBg++;
          }
          if (Y > 240) {
            nGlare++;
          }

          // Quadrant distributions for Stage 2
          if (x < centerX) {
            yLeftSum += Y;
            yLeftCount++;
          } else if (x > centerX) {
            yRightSum += Y;
            yRightCount++;
          }

          if (y < centerY) {
            yTopSum += Y;
            yTopCount++;
          } else if (y > centerY) {
            yBottomSum += Y;
            yBottomCount++;
          }
        }
      }
    }

    if (nCircle === 0) return;

    const skinRatio = nValidSkin / nCircle;
    const hairBgRatio = nHairOrBg / nCircle;
    const meanSkinLuminance = nValidSkin > 0 ? sumSkinLuminance / nValidSkin : sumLuminance / nCircle;
    const glareRatio = nGlare / nCircle;

    // Stage 2: Hand Angle & Surface Flatness Check
    const yLeft = yLeftCount > 0 ? yLeftSum / yLeftCount : 0;
    const yRight = yRightCount > 0 ? yRightSum / yRightCount : 0;
    const yTop = yTopCount > 0 ? yTopSum / yTopCount : 0;
    const yBottom = yBottomCount > 0 ? yBottomSum / yBottomCount : 0;

    const deltaH = Math.abs(yLeft - yRight);
    const deltaV = Math.abs(yTop - yBottom);
    const tiltDeg = Math.round(Math.max(deltaH, deltaV) * 0.75);

    // Stage 3: Frame-to-Frame Motion Stability Check
    let motionDelta = 0;
    let motionCount = 0;
    if (prevFrameLuminanceRef.current) {
      const prevLums = prevFrameLuminanceRef.current;
      for (let y = 0; y < sampleH; y++) {
        for (let x = 0; x < sampleW; x++) {
          const distSq = (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY);
          if (distSq <= radiusSq) {
            const curY = lumGrid[y * sampleW + x];
            const prevY = prevLums[y * sampleW + x];
            motionDelta += Math.abs(curY - prevY);
            motionCount++;
          }
        }
      }
    }
    const avgMotionDelta = motionCount > 0 ? motionDelta / motionCount : 0;
    prevFrameLuminanceRef.current = new Float32Array(lumGrid);

    const stabilityPercent = Math.max(0, Math.min(100, Math.round((1 - Math.min(1, avgMotionDelta / 8.0)) * 100)));

    // Stage 5: Macro Texture Sharpness (3x3 Laplacian Variance on Luminance in Center ROI)
    let laplacianSum = 0;
    let laplacianSqSum = 0;
    let laplacianCount = 0;

    for (let y = 1; y < sampleH - 1; y++) {
      for (let x = 1; x < sampleW - 1; x++) {
        const distSq = (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY);
        if (distSq <= radiusSq * 0.85) {
          // 3x3 Laplacian Kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0]
          const L =
            lumGrid[(y - 1) * sampleW + x] +
            lumGrid[(y + 1) * sampleW + x] +
            lumGrid[y * sampleW + (x - 1)] +
            lumGrid[y * sampleW + (x + 1)] -
            4 * lumGrid[y * sampleW + x];

          laplacianSum += L;
          laplacianSqSum += L * L;
          laplacianCount++;
        }
      }
    }

    let focusScore = 0;
    if (laplacianCount > 0) {
      const meanL = laplacianSum / laplacianCount;
      const varianceL = laplacianSqSum / laplacianCount - meanL * meanL;
      focusScore = Math.max(0, Math.round(varianceL));
    }

    // Evaluate Rules Sequentially (1 to 5)
    // 1. Stage 1: Skin Chrominance & Hair/Background Check
    const isSkinOk = skinRatio >= 0.82 && hairBgRatio <= 0.10;

    // 2. Stage 2: Hand Angle & Surface Flatness Check
    const isTiltOk = deltaH <= 22 && deltaV <= 22;

    // 3. Stage 3: Frame-to-Frame Motion Stability Check
    const isMotionOk = avgMotionDelta <= 4.5;

    // 4. Stage 4: Lighting & Specular Glare Check
    const isLightingOk = meanSkinLuminance >= 85;
    const isGlareOk = glareRatio <= 0.03;

    // 5. Stage 5: Macro Texture Sharpness
    const isFocusOk = focusScore >= 12 && focusScore <= 450;

    // Stage 6: Multi-Frame Stability Lock (Requires 6 consecutive passes = ~1s)
    let guideMessage = "";
    let overallStatus: "OPTIMAL" | "LOCKING" | "ADJUSTING" | "CRITICAL" = "ADJUSTING";

    if (!isSkinOk) {
      guideMessage = "Move skin closer to completely fill the center ring (No background or hair)";
      overallStatus = "CRITICAL";
      streakRef.current = 0;
    } else if (!isTiltOk) {
      guideMessage = "Skin is tilted at an angle — hold hand flat & parallel to lens";
      overallStatus = "ADJUSTING";
      streakRef.current = 0;
    } else if (!isMotionOk) {
      guideMessage = "Motion detected — hold your hand steady";
      overallStatus = "ADJUSTING";
      streakRef.current = 0;
    } else if (!isLightingOk) {
      guideMessage = "Too dark — face skin toward light source";
      overallStatus = "CRITICAL";
      streakRef.current = 0;
    } else if (!isGlareOk) {
      guideMessage = "Specular glare detected — adjust angle slightly";
      overallStatus = "ADJUSTING";
      streakRef.current = 0;
    } else if (!isFocusOk) {
      guideMessage = "Adjust distance (8–12 cm) until skin texture is sharp";
      overallStatus = "ADJUSTING";
      streakRef.current = 0;
    } else {
      // All 5 stages pass!
      streakRef.current += 1;
      const passes = streakRef.current;
      if (passes >= 6) {
        guideMessage = "Perfect View Locked — Ready to Capture!";
        overallStatus = "OPTIMAL";
      } else {
        const pct = Math.round((passes / 6) * 100);
        guideMessage = `Holding Steady... Locking (${pct}%)`;
        overallStatus = "LOCKING";
      }
    }

    const currentStreak = streakRef.current;
    const lockPercent = Math.min(100, Math.round((currentStreak / 6) * 100));
    const isOptimal = currentStreak >= 6;

    setTelemetry({
      skinRatio,
      isSkinOk,
      hairBgRatio,
      tiltDeg,
      isTiltOk,
      motionDelta: avgMotionDelta,
      stabilityPercent,
      isMotionOk,
      meanLuminance: Math.round(meanSkinLuminance),
      glareRatio,
      isLightingOk,
      isGlareOk,
      focusScore,
      isFocusOk,
      consecutivePasses: currentStreak,
      lockPercent,
      isOptimal,
      overallStatus,
      guideMessage,
    });

    // Auto-capture when 100% locked
    if (autoCapture && isOptimal && !isCapturing) {
      triggerCapture();
      streakRef.current = 0;
    }
  }, [autoCapture, isCapturing, triggerCapture]);

  // Mount/Unmount stream & interval (150ms execution)
  useEffect(() => {
    startCamera();
    intervalRef.current = setInterval(analyzeFrame, 150);

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera, analyzeFrame]);

  // Circumference for lock progress ring: 2 * pi * 84 approx 527.7
  const ringRadius = 84;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (telemetry.lockPercent / 100) * circumference;

  return (
    <div className={`relative w-full flex flex-col items-center select-none ${className}`}>
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Viewfinder Frame (Constrained aspect-[16/10] max-h-[360px] to prevent vertical scrolling) */}
      <div className="relative w-full aspect-[16/10] max-h-[360px] bg-stone-900 rounded-[24px] overflow-hidden shadow-inner border-2 border-white/80">
        {hasPermission === false ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#FAF5F0]">
            <div className="w-12 h-12 rounded-2xl bg-[#E85D44]/10 text-[#E85D44] flex items-center justify-center mb-3">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#18181B] mb-1">Camera Stream Inactive</h4>
            <p className="text-xs text-[#71717A] max-w-sm mb-4 leading-relaxed">
              {errorMessage || "Webcam access is unavailable or denied in your browser."}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E85D44] hover:bg-[#D4472E] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Camera Permission
            </button>
          </div>
        ) : (
          <>
            {/* Live Video Element (Mirrored via CSS scale-x-[-1] for natural hand coordination) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Viewfinder Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Circular SVG Lock Progress Ring */}
              <svg className="absolute w-44 h-44 -rotate-90 pointer-events-none" viewBox="0 0 180 180">
                {/* Background Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="3.5"
                />
                {/* Active Lock Progress Stroke */}
                <circle
                  cx="90"
                  cy="90"
                  r={ringRadius}
                  fill="none"
                  stroke={telemetry.isOptimal ? "#10B981" : telemetry.overallStatus === "LOCKING" ? "#F59E0B" : "#E11D48"}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              </svg>

              {/* Reticle Ring */}
              <div
                className={`relative w-44 h-44 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                  telemetry.isOptimal
                    ? "border-[#10B981] shadow-[0_0_35px_rgba(16,185,129,0.5)] animate-reticle-pulse"
                    : telemetry.overallStatus === "LOCKING"
                    ? "border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    : telemetry.overallStatus === "CRITICAL"
                    ? "border-[#E11D48] shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                    : "border-white/80 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                }`}
              >
                {/* 4 Corner Targeting Notches */}
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2.5 h-1 bg-white rounded-full" />
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2.5 h-1 bg-white rounded-full" />
                <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1 h-2.5 bg-white rounded-full" />
                <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-1 h-2.5 bg-white rounded-full" />

                {/* Center Crosshair Dot */}
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    telemetry.isOptimal ? "bg-[#10B981]" : "bg-white/70"
                  }`}
                />
              </div>
            </div>

            {/* Top Quality Status Banner */}
            <div className="absolute top-2.5 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-bold transition-all shadow-md ${
                  telemetry.isOptimal
                    ? "bg-[#10B981]/95 text-white shadow-[#10B981]/30"
                    : telemetry.overallStatus === "LOCKING"
                    ? "bg-[#F59E0B]/95 text-white shadow-[#F59E0B]/30"
                    : telemetry.overallStatus === "CRITICAL"
                    ? "bg-[#E11D48]/95 text-white shadow-[#E11D48]/30"
                    : "bg-black/70 text-white"
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate max-w-[280px] sm:max-w-md">{telemetry.guideMessage}</span>
              </div>

              {telemetry.lockPercent > 0 && (
                <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-bold text-white">
                  Lock: {telemetry.lockPercent}%
                </div>
              )}
            </div>

            {/* Bottom Floating Telemetry Pills (Live Stage 1–5 metrics) */}
            <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-center gap-1.5 sm:gap-2 pointer-events-none flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-bold ${
                  telemetry.isSkinOk ? "bg-[#10B981]/80 text-white" : "bg-[#E11D48]/80 text-white"
                }`}
              >
                Skin Fill: {Math.round(telemetry.skinRatio * 100)}%
              </span>

              <span
                className={`px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-bold ${
                  telemetry.isTiltOk ? "bg-[#10B981]/80 text-white" : "bg-[#F59E0B]/80 text-white"
                }`}
              >
                Angle Tilt: {telemetry.tiltDeg}°
              </span>

              <span
                className={`px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-bold ${
                  telemetry.isMotionOk ? "bg-[#10B981]/80 text-white" : "bg-[#F59E0B]/80 text-white"
                }`}
              >
                Stability: {telemetry.stabilityPercent}%
              </span>

              <span
                className={`px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-bold ${
                  telemetry.isFocusOk ? "bg-[#10B981]/80 text-white" : "bg-[#F59E0B]/80 text-white"
                }`}
              >
                Focus: {telemetry.focusScore}
              </span>
            </div>

            {/* Flash Capture Feedback Animation */}
            {isCapturing && (
              <div className="absolute inset-0 bg-white animate-ping pointer-events-none opacity-80" />
            )}
          </>
        )}
      </div>

      {/* Camera Controls & Actions (Always visible without vertical scrolling) */}
      <div className="w-full mt-3 flex items-center justify-between gap-3">
        {/* Auto Capture Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#18181B]">
          <input
            type="checkbox"
            checked={autoCapture}
            onChange={(e) => setAutoCapture(e.target.checked)}
            className="w-4 h-4 rounded text-[#E85D44] focus:ring-[#E85D44] accent-[#E85D44]"
          />
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#E85D44]" />
            Auto-Capture When Locked
          </span>
        </label>

        {/* Manual Capture & Verify Quality Button */}
        <button
          type="button"
          onClick={triggerCapture}
          disabled={isCapturing}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E85D44] to-[#F27059] hover:from-[#D4472E] hover:to-[#E85D44] text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#E85D44]/20 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>{isCapturing ? "Capturing..." : "Capture Verified Scan"}</span>
        </button>
      </div>
    </div>
  );
}
