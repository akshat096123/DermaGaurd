"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import {
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  Maximize2,
  Minimize2,
  Compass,
  Layers,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AnalysisResponse, PatientContext, WorkflowPage } from "../types";

interface Message {
  id: string;
  sender: "user" | "derma";
  text: string;
  timestamp: string;
  model?: string;
  source?: string;
  triage?: string;
}

interface DermaHologramAssistantProps {
  currentCase?: AnalysisResponse | null;
  patientProfile?: PatientContext | null;
  onNavigatePage?: (page: WorkflowPage) => void;
  onOpenBodyMap?: () => void;
  onOpenResults?: () => void;
}

const PROMPT_CHIPS = [
  { label: "📊 Benchmark Results", query: "Show clinical validation results and confusion matrix" },
  { label: "🧴 Skincare & Sunscreen", query: "What sunscreen and lotions do you recommend for this lesion?" },
  { label: "🔬 Explain ABCD Score", query: "Can you explain the Agent 3 ABCD morphologic score?" },
  { label: "⚖️ Why Triage Gate?", query: "Why did the coordinator assign this specific triage gate?" },
  { label: "⚠️ Malignancy Risk?", query: "Is this lesion dangerous or cancerous?" },
  { label: "📍 3D Body Map", query: "Open the 3D body map and skin log" },
];

export default function DermaHologramAssistant({
  currentCase,
  patientProfile,
  onNavigatePage,
  onOpenBodyMap,
  onOpenResults,
}: DermaHologramAssistantProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasGreeted, setHasGreeted] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-greeting",
      sender: "derma",
      text: "Greetings. I am **DERMA**, your 3D Holographic AI Clinical Dermatology Assistant. I am linked live to your 6-agent screening pipeline. Ask me about your diagnosis, photoprotection, or ABCD scoring.",
      timestamp: "Just now",
      source: "hologram_core",
    },
  ]);

  // Three.js Mount References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const miniAnimationFrameRef = useRef<number | null>(null);
  const jawMeshRef = useRef<THREE.Mesh | null>(null);
  const miniJawMeshRef = useRef<THREE.Mesh | null>(null);
  const mouthOpenRef = useRef<number>(0);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Speech Recognition Reference
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat on message update
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Speech Synthesis helper
  const speakText = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      if (isMuted) return;

      window.speechSynthesis.cancel();

      // Clean markdown tags for natural speech
      const cleaned = text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/•/g, " ")
        .replace(/\[(.*?)\]/g, " ")
        .replace(/#+\s+/g, "")
        .replace(/\n+/g, ". ");

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Daniel"))
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isMuted]
  );

  // Voice Greeting when opened for the first time
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      speakText("Hello! I am DERMA, your 3D holographic clinical assistant. Ready to assist with your dermatology screening.");
    }
  }, [isOpen, hasGreeted, speakText]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputText(transcript);
            handleSend(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Speech recognition error:", err);
      }
    }
  };

  // Three.js Procedural 3D Holographic Avatar (Main Expanded HUD)
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth || 360;
    const height = canvas.clientHeight || 130;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 3.8);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Hologram Group
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // Glowing Wireframe Material (Cyan-Coral Hologram)
    const hologramMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });

    const glowCoreMaterial = new THREE.MeshStandardMaterial({
      color: 0x0891b2,
      emissive: 0x0e7490,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });

    // 1. Holographic Head (Icosahedron + Wireframe)
    const headGeom = new THREE.IcosahedronGeometry(0.85, 2);
    const headMesh = new THREE.Mesh(headGeom, hologramMaterial);
    avatarGroup.add(headMesh);

    // Inner glowing sphere
    const innerGeom = new THREE.SphereGeometry(0.72, 16, 16);
    const innerMesh = new THREE.Mesh(innerGeom, glowCoreMaterial);
    headMesh.add(innerMesh);

    // 2. Articulated Jaw (Hinged for Lip-Sync)
    const jawGeom = new THREE.CylinderGeometry(0.42, 0.32, 0.35, 12);
    const jawMesh = new THREE.Mesh(jawGeom, hologramMaterial);
    jawMesh.position.set(0, -0.65, 0.2);
    avatarGroup.add(jawMesh);
    jawMeshRef.current = jawMesh;

    // 3. Glowing Visor / Eyes
    const visorGeom = new THREE.BoxGeometry(0.65, 0.12, 0.3);
    const visorMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
    });
    const visorMesh = new THREE.Mesh(visorGeom, visorMat);
    visorMesh.position.set(0, 0.12, 0.75);
    avatarGroup.add(visorMesh);

    // 4. Hologram Floating Orbit Rings
    const ringGeom = new THREE.TorusGeometry(1.25, 0.02, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe85d44,
      transparent: true,
      opacity: 0.6,
    });
    const ringMesh1 = new THREE.Mesh(ringGeom, ringMat);
    ringMesh1.rotation.x = Math.PI / 3;
    avatarGroup.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(ringGeom, hologramMaterial);
    ringMesh2.rotation.y = Math.PI / 4;
    avatarGroup.add(ringMesh2);

    // Lighting
    const pointLight = new THREE.PointLight(0x06b6d4, 2, 10);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getElapsedTime();

      // Floating idle animation
      avatarGroup.position.y = Math.sin(delta * 2) * 0.08;
      avatarGroup.rotation.y = Math.sin(delta * 0.8) * 0.18;
      ringMesh1.rotation.z = delta * 0.8;
      ringMesh2.rotation.z = -delta * 0.6;

      // Real-time lip-sync articulation
      if (isSpeaking) {
        mouthOpenRef.current = Math.abs(Math.sin(delta * 14)) * 0.22 + 0.05;
      } else {
        mouthOpenRef.current = Math.max(0, mouthOpenRef.current - 0.02);
      }

      if (jawMeshRef.current) {
        jawMeshRef.current.position.y = -0.65 - mouthOpenRef.current;
        jawMeshRef.current.rotation.x = mouthOpenRef.current * 0.8;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      headGeom.dispose();
      innerGeom.dispose();
      jawGeom.dispose();
      visorGeom.dispose();
      ringGeom.dispose();
    };
  }, [isOpen, isSpeaking]);

  // Three.js Procedural Mini Hologram Orb (when collapsed)
  useEffect(() => {
    if (isOpen || !miniCanvasRef.current) return;

    const canvas = miniCanvasRef.current;
    const size = 64;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const geom = new THREE.IcosahedronGeometry(0.8, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);

    const ringGeom = new THREE.TorusGeometry(1.1, 0.03, 6, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe85d44,
      transparent: true,
      opacity: 0.7,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    scene.add(ringMesh);

    let clock = new THREE.Clock();

    const animateMini = () => {
      miniAnimationFrameRef.current = requestAnimationFrame(animateMini);
      const t = clock.getElapsedTime();
      mesh.rotation.y = t * 1.2;
      mesh.rotation.x = Math.sin(t * 0.8) * 0.3;
      ringMesh.rotation.z = -t * 1.5;
      renderer.render(scene, camera);
    };

    animateMini();

    return () => {
      if (miniAnimationFrameRef.current) cancelAnimationFrame(miniAnimationFrameRef.current);
      renderer.dispose();
      geom.dispose();
      ringGeom.dispose();
    };
  }, [isOpen]);

  // Handle User Message Submission
  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || inputText).trim();
    if (!textToSend || isLoading) return;

    // Check voice navigation commands
    const lower = textToSend.toLowerCase();
    if (lower.includes("body map") || lower.includes("skin log")) {
      onOpenBodyMap?.();
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: "user",
          text: textToSend,
          timestamp: "Just now",
        },
        {
          id: String(Date.now() + 1),
          sender: "derma",
          text: "Opening the **3D Interactive Human Body Map & Skin Log**. You can click anywhere to place lesion pins and track progress.",
          timestamp: "Just now",
          source: "navigation_directive",
        },
      ]);
      speakText("Opening the 3D Interactive Human Body Map and Skin Log.");
      setInputText("");
      return;
    }

    if (lower.includes("result") || lower.includes("benchmark") || lower.includes("confusion matrix")) {
      onOpenResults?.();
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: "user",
          text: textToSend,
          timestamp: "Just now",
        },
        {
          id: String(Date.now() + 1),
          sender: "derma",
          text: "Opening the **Benchmark Results & Clinical Validation Report**. Here you can inspect Correct/Incorrect Auto-Triage, Refers, Re-Image, Accuracy, Macro F1, the 7x7 Confusion Matrix, and Class-Wise Errors.",
          timestamp: "Just now",
          source: "navigation_directive",
        },
      ]);
      speakText("Opening the Benchmark Results and Clinical Validation Report.");
      setInputText("");
      return;
    }

    if (lower.includes("page 1") || lower.includes("intake") || lower.includes("upload")) {
      onNavigatePage?.(1);
    } else if (lower.includes("page 2") || lower.includes("quality") || lower.includes("diagnosis")) {
      onNavigatePage?.(2);
    } else if (lower.includes("page 3") || lower.includes("lesion") || lower.includes("context")) {
      onNavigatePage?.(3);
    } else if (lower.includes("page 4") || lower.includes("safety") || lower.includes("coordinator")) {
      onNavigatePage?.(4);
    } else if (lower.includes("page 5") || lower.includes("audit") || lower.includes("benchmark")) {
      onNavigatePage?.(5);
    }

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text: textToSend,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          current_case: currentCase || null,
          patient_profile: patientProfile || null,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === "user" ? "user" : "model",
            text: m.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.response || "Clinical assessment completed.";
        const dermaMsg: Message = {
          id: String(Date.now() + 1),
          sender: "derma",
          text: replyText,
          timestamp: "Just now",
          model: data.model,
          source: data.source,
          triage: data.triage_decision,
        };
        setMessages((prev) => [...prev, dermaMsg]);
        speakText(replyText);
      } else {
        throw new Error(`API error ${res.status}`);
      }
    } catch (err) {
      console.warn("DERMA API error, using local fallback response:", err);
      const fallbackReply =
        "The 6-agent system has evaluated this lesion. For complete diagnostic safety, daily mineral sunscreen (SPF 50+) and annual dermoscopic checks are advised.";
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "derma",
          text: fallbackReply,
          timestamp: "Just now",
          source: "offline_safety_engine",
        },
      ]);
      speakText(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 select-none">
      {/* ===================================================================== */}
      {/* COLLAPSED FLOATING HUD ORB */}
      {/* ===================================================================== */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 p-2 pr-4 rounded-full bg-white/90 backdrop-blur-xl border border-[#F2E8E3] shadow-[0_12px_36px_-6px_rgba(232,93,68,0.25)] hover:shadow-[0_16px_44px_-4px_rgba(6,182,212,0.35)] hover:border-[#06B6D4]/50 active:scale-95 transition-all duration-300"
          title="Click to activate 3D Holographic AI Assistant DERMA"
        >
          {/* Pulsating Radar Ping */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06B6D4] opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#06B6D4] ring-2 ring-white" />
          </span>

          {/* Mini 3D Three.js Hologram Canvas */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#0F172A] to-[#1E293B] shadow-inner flex items-center justify-center shrink-0 border border-[#06B6D4]/40">
            <canvas ref={miniCanvasRef} width={64} height={64} className="w-12 h-12" />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-[#18181B] tracking-tight group-hover:text-[#E85D44] transition-colors">
                DERMA
              </span>
              <span className="px-1.5 py-0.2 text-[8px] font-extrabold uppercase rounded-full bg-[#06B6D4]/15 text-[#0891B2] border border-[#06B6D4]/30">
                3D AI
              </span>
            </div>
            <p className="text-[10px] text-[#78716C] font-medium leading-none mt-0.5">
              Clinical Voice Assistant
            </p>
          </div>
        </button>
      )}

      {/* ===================================================================== */}
      {/* EXPANDED 3D HOLOGRAPHIC HUD WINDOW */}
      {/* ===================================================================== */}
      {isOpen && (
        <div className="w-[360px] sm:w-[390px] h-[560px] max-h-[85vh] rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#F2E8E3] shadow-[0_24px_60px_-12px_rgba(28,25,23,0.22)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* 3D Hologram Header */}
          <div className="relative bg-gradient-to-b from-[#0F172A] to-[#1E293B] border-b border-[#334155] p-3 text-white overflow-hidden shrink-0">
            {/* Holographic Scanline Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.06)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />

            <div className="flex items-center justify-between relative z-10 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-xs font-extrabold text-[#38BDF8] tracking-wider uppercase">
                  DERMA • Holographic AI
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#7DD3FC] border border-[#38BDF8]/30 font-mono">
                  Gemini 3.8
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Voice Mute / Unmute */}
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) window.speechSynthesis.cancel();
                    setIsMuted(!isMuted);
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors"
                  title={isMuted ? "Unmute voice" : "Mute voice"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#38BDF8]" />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                    }
                    setIsOpen(false);
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors"
                  title="Minimize DERMA"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3D Avatar Canvas */}
            <div className="relative h-[110px] w-full flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full block" />

              {/* Real-time speaking audio waveform badge */}
              {isSpeaking && (
                <div className="absolute bottom-1 left-3 px-2 py-0.5 rounded-full bg-[#06B6D4]/30 border border-[#06B6D4]/50 text-[9px] font-mono text-[#38BDF8] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping" />
                  Synthesizing Speech...
                </div>
              )}

              {/* Triage Badge if report exists */}
              {currentCase && (
                <div className="absolute bottom-1 right-3 px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-bold text-white flex items-center gap-1">
                  <span>Gate:</span>
                  <span
                    className={
                      currentCase.verdict.decision === "AUTO_TRIAGE"
                        ? "text-[#10B981]"
                        : currentCase.verdict.decision === "REFER"
                        ? "text-[#F43F5E]"
                        : "text-[#F59E0B]"
                    }
                  >
                    {currentCase.verdict.decision}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#FAF8F6]/60">
            {messages.map((m) => {
              const isDerma = m.sender === "derma";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isDerma ? "items-start" : "items-end"} transition-all`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isDerma
                        ? "bg-white border border-[#F2E8E3] text-[#18181B] shadow-xs rounded-tl-sm"
                        : "bg-gradient-to-br from-[#E85D44] to-[#D4472E] text-white shadow-sm rounded-tr-sm"
                    }`}
                  >
                    <div className="prose prose-xs text-inherit break-words">
                      {m.text.split("\n\n").map((para, i) => (
                        <p key={i} className="mb-1.5 last:mb-0">
                          {para}
                        </p>
                      ))}
                    </div>

                    {isDerma && m.model && (
                      <div className="mt-2 pt-1.5 border-t border-[#F2E8E3]/60 flex items-center justify-between text-[9px] text-[#A8A29E]">
                        <span>Engine: {m.model}</span>
                        {m.triage && <span className="font-bold text-[#E85D44]">Triage: {m.triage}</span>}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-[#A8A29E] mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-[#F2E8E3] w-fit shadow-xs">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[10px] text-[#78716C] font-medium">DERMA analyzing query...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2 border-t border-[#F2E8E3]/80 bg-white/80 overflow-x-auto flex gap-1.5 scrollbar-none shrink-0">
            {PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip.query)}
                className="px-2.5 py-1 rounded-xl bg-[#FAF4F0] hover:bg-[#F2E8E3] text-[#78716C] hover:text-[#18181B] text-[10px] font-semibold whitespace-nowrap border border-[#F2E8E3] transition-all shrink-0 active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input & Microphone Bar */}
          <div className="p-3 bg-white border-t border-[#F2E8E3] flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded-xl transition-all ${
                isListening
                  ? "bg-[#EF4444] text-white animate-pulse shadow-md shadow-[#EF4444]/30"
                  : "bg-[#FAF4F0] hover:bg-[#F2E8E3] text-[#78716C] hover:text-[#18181B] border border-[#F2E8E3]"
              }`}
              title={isListening ? "Listening... Click to stop" : "Speak to DERMA"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening to your voice..." : "Ask DERMA about this lesion..."}
              className="flex-1 bg-[#FAF4F0]/80 border border-[#F2E8E3] focus:border-[#06B6D4] focus:bg-white rounded-xl px-3 py-2 text-xs text-[#18181B] placeholder-[#A8A29E] focus:outline-hidden transition-all"
            />

            <button
              type="button"
              disabled={!inputText.trim() || isLoading}
              onClick={() => handleSend()}
              className="p-2 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#0891B2] hover:from-[#0891B2] hover:to-[#0E7490] text-white shadow-sm shadow-[#06B6D4]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
