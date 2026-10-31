"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Compass,
  RotateCcw,
  Plus,
  Trash2,
  Send,
  Eye,
  Calendar,
  Camera,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  User,
  X,
  Maximize2,
  Info,
} from "lucide-react";

export interface BodyPin {
  id: string;
  x: number;
  y: number;
  z: number;
  zone: string;
  date: string;
  notes: string;
  urgency: "LOW" | "MODERATE" | "HIGH";
  photoUrl?: string;
  sampleId?: string;
}

interface BodyMap3DProps {
  initialZone?: string;
  onSendToScreening?: (data: { zone: string; imageUrl?: string; notes?: string }) => void;
  onClose?: () => void;
}

const COMMON_ZONES = [
  "face",
  "scalp",
  "neck",
  "chest",
  "abdomen",
  "back",
  "upper extremity",
  "hand",
  "lower extremity",
  "foot",
];

const PRESET_SPOTS: BodyPin[] = [
  {
    id: "pin-1",
    x: 0.15,
    y: 1.45,
    z: -0.38,
    zone: "back",
    date: "2026-10-15",
    notes: "Irregular pigment border noticed on mid-upper back. Moderate itching.",
    urgency: "HIGH",
    photoUrl: "/samples/ISIC_0029081.jpg",
    sampleId: "ISIC_0029081",
  },
  {
    id: "pin-2",
    x: 1.12,
    y: 1.55,
    z: 0.05,
    zone: "upper extremity",
    date: "2026-09-28",
    notes: "Stable brown macule on right upper arm, uniform pigment, no evolution.",
    urgency: "LOW",
    photoUrl: "/samples/ISIC_0024693.jpg",
    sampleId: "ISIC_0024693",
  },
  {
    id: "pin-3",
    x: -0.48,
    y: -1.75,
    z: 0.22,
    zone: "lower extremity",
    date: "2026-10-02",
    notes: "Dark asymmetric macule on left calf, slowly enlarging over 6 months.",
    urgency: "HIGH",
    photoUrl: "/samples/ISIC_0026993.jpg",
    sampleId: "ISIC_0026993",
  },
];

export default function BodyMap3D({
  initialZone,
  onSendToScreening,
  onClose,
}: BodyMap3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stored Body Pins
  const [pins, setPins] = useState<BodyPin[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dermaguard_body_pins");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn("Could not load pins:", e);
      }
    }
    return PRESET_SPOTS;
  });

  const [selectedPin, setSelectedPin] = useState<BodyPin | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<"front" | "back" | "left" | "right" | "reset">("front");

  // New Spot Drawer State
  const [isAddingSpot, setIsAddingSpot] = useState<boolean>(false);
  const [newPinPoint, setNewPinPoint] = useState<{ x: number; y: number; z: number; zone: string } | null>(null);
  const [newNotes, setNewNotes] = useState<string>("");
  const [newUrgency, setNewUrgency] = useState<"LOW" | "MODERATE" | "HIGH">("MODERATE");
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>("");

  // Persist pins to LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("dermaguard_body_pins", JSON.stringify(pins));
      } catch (e) {
        console.warn("Could not save pins:", e);
      }
    }
  }, [pins]);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const markersGroupRef = useRef<THREE.Group | null>(null);
  const mannequinGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 650;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.5;
    controls.maxDistance = 12;
    controls.target.set(0, 0.2, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff5ea, 1.8);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 0.6);
    dirLight2.position.set(-6, -2, -4);
    scene.add(dirLight2);

    // Subtle Ground Shadow Disc
    const groundGeom = new THREE.CircleGeometry(2.4, 32);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -3.1;
    scene.add(groundMesh);

    // =========================================================================
    // PROCEDURAL 3D HUMANOID MANNEQUIN
    // =========================================================================
    const mannequinGroup = new THREE.Group();
    scene.add(mannequinGroup);
    mannequinGroupRef.current = mannequinGroup;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf5eee8,
      roughness: 0.35,
      metalness: 0.1,
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0xe5dcd4,
      roughness: 0.4,
      metalness: 0.15,
    });

    // 1. Head & Scalp
    const headGeom = new THREE.SphereGeometry(0.55, 32, 32);
    headGeom.scale(0.85, 1.05, 0.95);
    const headMesh = new THREE.Mesh(headGeom, bodyMat);
    headMesh.position.set(0, 2.75, 0);
    headMesh.userData = { zone: "face" };
    mannequinGroup.add(headMesh);

    // 2. Neck
    const neckGeom = new THREE.CylinderGeometry(0.24, 0.28, 0.38, 24);
    const neckMesh = new THREE.Mesh(neckGeom, bodyMat);
    neckMesh.position.set(0, 2.2, 0);
    neckMesh.userData = { zone: "neck" };
    mannequinGroup.add(neckMesh);

    // 3. Torso (Chest & Back)
    const chestGeom = new THREE.CylinderGeometry(0.68, 0.54, 0.95, 24);
    chestGeom.scale(1.25, 1.0, 0.72);
    const chestMesh = new THREE.Mesh(chestGeom, bodyMat);
    chestMesh.position.set(0, 1.55, 0);
    chestMesh.userData = { zone: "chest", backZone: "back" };
    mannequinGroup.add(chestMesh);

    // 4. Abdomen & Lower Back
    const abdomenGeom = new THREE.CylinderGeometry(0.54, 0.58, 0.75, 24);
    abdomenGeom.scale(1.15, 1.0, 0.7);
    const abdomenMesh = new THREE.Mesh(abdomenGeom, bodyMat);
    abdomenMesh.position.set(0, 0.75, 0);
    abdomenMesh.userData = { zone: "abdomen", backZone: "back" };
    mannequinGroup.add(abdomenMesh);

    // 5. Pelvis / Hips
    const pelvisGeom = new THREE.CylinderGeometry(0.58, 0.5, 0.5, 24);
    pelvisGeom.scale(1.15, 1.0, 0.75);
    const pelvisMesh = new THREE.Mesh(pelvisGeom, bodyMat);
    pelvisMesh.position.set(0, 0.2, 0);
    pelvisMesh.userData = { zone: "abdomen", backZone: "back" };
    mannequinGroup.add(pelvisMesh);

    // Helper for symmetrical limbs
    const createLimb = (
      name: string,
      geom: THREE.BufferGeometry,
      pos: [number, number, number],
      rot: [number, number, number],
      zone: string
    ) => {
      const mesh = new THREE.Mesh(geom, bodyMat);
      mesh.position.set(...pos);
      mesh.rotation.set(...rot);
      mesh.userData = { zone };
      mannequinGroup.add(mesh);
      return mesh;
    };

    // Shoulders
    const shoulderGeom = new THREE.SphereGeometry(0.24, 20, 20);
    createLimb("l_shoulder", shoulderGeom, [-0.95, 1.9, 0], [0, 0, 0], "upper extremity");
    createLimb("r_shoulder", shoulderGeom, [0.95, 1.9, 0], [0, 0, 0], "upper extremity");

    // Upper Arms
    const upperArmGeom = new THREE.CylinderGeometry(0.18, 0.15, 0.8, 16);
    createLimb("l_upper_arm", upperArmGeom, [-1.08, 1.4, 0], [0, 0, -0.15], "upper extremity");
    createLimb("r_upper_arm", upperArmGeom, [1.08, 1.4, 0], [0, 0, 0.15], "upper extremity");

    // Forearms
    const foreArmGeom = new THREE.CylinderGeometry(0.14, 0.12, 0.75, 16);
    createLimb("l_forearm", foreArmGeom, [-1.22, 0.65, 0.05], [0, 0, -0.1], "upper extremity");
    createLimb("r_forearm", foreArmGeom, [1.22, 0.65, 0.05], [0, 0, 0.1], "upper extremity");

    // Hands
    const handGeom = new THREE.SphereGeometry(0.16, 16, 16);
    handGeom.scale(0.8, 1.3, 0.5);
    createLimb("l_hand", handGeom, [-1.32, 0.15, 0.05], [0, 0, 0], "hand");
    createLimb("r_hand", handGeom, [1.32, 0.15, 0.05], [0, 0, 0], "hand");

    // Thighs
    const thighGeom = new THREE.CylinderGeometry(0.25, 0.2, 1.1, 20);
    createLimb("l_thigh", thighGeom, [-0.38, -0.55, 0], [0, 0, -0.04], "lower extremity");
    createLimb("r_thigh", thighGeom, [0.38, -0.55, 0], [0, 0, 0.04], "lower extremity");

    // Calves
    const calfGeom = new THREE.CylinderGeometry(0.19, 0.14, 1.1, 20);
    createLimb("l_calf", calfGeom, [-0.42, -1.65, 0], [0, 0, 0], "lower extremity");
    createLimb("r_calf", calfGeom, [0.42, -1.65, 0], [0, 0, 0], "lower extremity");

    // Feet
    const footGeom = new THREE.BoxGeometry(0.25, 0.16, 0.55);
    createLimb("l_foot", footGeom, [-0.42, -2.3, 0.12], [0, 0, 0], "foot");
    createLimb("r_foot", footGeom, [0.42, -2.3, 0.12], [0, 0, 0], "foot");

    // Group for Pins / Markers
    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // Animation Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      controls.update();

      // Smooth camera interpolation for presets
      if (targetCamPosRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.08);
        if (camera.position.distanceTo(targetCamPosRef.current) < 0.05) {
          targetCamPosRef.current = null;
        }
      }

      // Animate glowing pin rings
      if (markersGroupRef.current) {
        const time = clock.getElapsedTime();
        markersGroupRef.current.children.forEach((marker: any) => {
          const ring = marker.children.find((c: any) => c.name === "beaconRing");
          if (ring) {
            ring.scale.setScalar(1 + Math.sin(time * 3 + marker.position.x) * 0.2);
            ring.rotation.z += 0.02;
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 650;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      bodyMat.dispose();
      jointMat.dispose();
      controls.dispose();
    };
  }, []);

  // Update 3D Markers whenever `pins` changes
  useEffect(() => {
    if (!markersGroupRef.current) return;
    const group = markersGroupRef.current;

    // Clear old markers
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
    }

    // Build 3D Pins
    pins.forEach((pin) => {
      const pinContainer = new THREE.Group();
      pinContainer.position.set(pin.x, pin.y, pin.z);
      pinContainer.userData = { pinId: pin.id };

      const pinColor =
        pin.urgency === "HIGH" ? 0xf43f5e : pin.urgency === "MODERATE" ? 0xf59e0b : 0x10b981;

      // Pin Pinhead
      const headGeom = new THREE.SphereGeometry(0.08, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: pinColor,
        emissive: pinColor,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const head = new THREE.Mesh(headGeom, headMat);
      pinContainer.add(head);

      // Pin Needle
      const needleGeom = new THREE.ConeGeometry(0.04, 0.2, 12);
      needleGeom.rotateX(Math.PI);
      const needleMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.8,
        roughness: 0.2,
      });
      const needle = new THREE.Mesh(needleGeom, needleMat);
      needle.position.z = -0.09;
      pinContainer.add(needle);

      // Pulsating Beacon Ring
      const ringGeom = new THREE.TorusGeometry(0.14, 0.015, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pinColor,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.name = "beaconRing";
      pinContainer.add(ring);

      group.add(pinContainer);
    });
  }, [pins]);

  // Raycasting for Mouse Interaction (Hover & Click Placement)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !mannequinGroupRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // First check if an existing marker was clicked
    if (markersGroupRef.current) {
      const markerHits = raycaster.intersectObjects(markersGroupRef.current.children, true);
      if (markerHits.length > 0) {
        let parent: any = markerHits[0].object;
        while (parent && !parent.userData?.pinId) {
          parent = parent.parent;
        }
        if (parent?.userData?.pinId) {
          const matched = pins.find((p) => p.id === parent.userData.pinId);
          if (matched) {
            setSelectedPin(matched);
            return;
          }
        }
      }
    }

    // Otherwise check mannequin body surface
    const intersects = raycaster.intersectObjects(mannequinGroupRef.current.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      let zone = hit.object.userData?.zone || "skin";

      // If clicked on torso with normal facing backwards, classify as "back"
      if (hit.point.z < -0.05 && hit.object.userData?.backZone) {
        zone = "back";
      }

      setNewPinPoint({
        x: Number(hit.point.x.toFixed(2)),
        y: Number(hit.point.y.toFixed(2)),
        z: Number(hit.point.z.toFixed(2)),
        zone,
      });
      setIsAddingSpot(true);
    }
  };

  // Hover detection for anatomical zone tooltip
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !mannequinGroupRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(mannequinGroupRef.current.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      let zone = hit.object.userData?.zone || "skin";
      if (hit.point.z < -0.05 && hit.object.userData?.backZone) {
        zone = "back";
      }
      setHoveredZone(zone);
    } else {
      setHoveredZone(null);
    }
  };

  // Camera Presets
  const setPresetView = (view: "front" | "back" | "left" | "right" | "reset") => {
    setActivePreset(view);
    if (!controlsRef.current) return;

    controlsRef.current.target.set(0, 0.2, 0);

    if (view === "front") {
      targetCamPosRef.current = new THREE.Vector3(0, 0.4, 7.5);
    } else if (view === "back") {
      targetCamPosRef.current = new THREE.Vector3(0, 0.4, -7.5);
    } else if (view === "left") {
      targetCamPosRef.current = new THREE.Vector3(-7.5, 0.4, 0);
    } else if (view === "right") {
      targetCamPosRef.current = new THREE.Vector3(7.5, 0.4, 0);
    } else if (view === "reset") {
      targetCamPosRef.current = new THREE.Vector3(0, 0.4, 7.5);
    }
  };

  // Add Spot Confirmation
  const handleConfirmAddSpot = () => {
    if (!newPinPoint) return;
    const newSpot: BodyPin = {
      id: `spot-${Date.now()}`,
      x: newPinPoint.x,
      y: newPinPoint.y,
      z: newPinPoint.z,
      zone: newPinPoint.zone,
      date: new Date().toISOString().split("T")[0],
      notes: newNotes.trim() || `Lesion logged on ${newPinPoint.zone}`,
      urgency: newUrgency,
      photoUrl: newPhotoUrl || undefined,
    };

    setPins((prev) => [...prev, newSpot]);
    setSelectedPin(newSpot);
    setIsAddingSpot(false);
    setNewPinPoint(null);
    setNewNotes("");
    setNewPhotoUrl("");
  };

  // Delete Spot
  const handleDeleteSpot = (id: string) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
    if (selectedPin?.id === id) setSelectedPin(null);
  };

  return (
    <div className="relative w-full rounded-3xl bg-white/90 backdrop-blur-2xl border border-[#F2E8E3] shadow-[0_20px_50px_-8px_rgba(28,25,23,0.06)] overflow-hidden flex flex-col lg:flex-row min-h-[640px]">
      {/* ===================================================================== */}
      {/* 3D MANNEQUIN CANVAS VIEWPORT */}
      {/* ===================================================================== */}
      <div
        ref={mountRef}
        className="relative flex-1 bg-gradient-to-b from-[#FAF4F0]/60 via-[#FFFFFF]/80 to-[#F5ECE5]/40 min-h-[500px] flex items-center justify-center overflow-hidden"
      >
        {/* Subtle Anatomical Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#E85D44_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        {/* View Controls & Presets Bar */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#F2E8E3] shadow-sm">
          <span className="text-[10px] font-bold text-[#78716C] px-2 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#E85D44]" /> View:
          </span>
          {(["front", "back", "left", "right", "reset"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setPresetView(view)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activePreset === view
                  ? "bg-[#E85D44] text-white shadow-xs"
                  : "bg-transparent text-[#78716C] hover:text-[#18181B] hover:bg-[#FAF4F0]"
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Anatomical Zone Hover Tooltip */}
        {hoveredZone && (
          <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#E85D44]/30 text-xs font-extrabold text-[#E85D44] shadow-md flex items-center gap-1.5 animate-in fade-in zoom-in-95">
            <span className="w-2 h-2 rounded-full bg-[#E85D44] animate-ping" />
            <span className="capitalize">Zone: {hoveredZone}</span>
          </div>
        )}

        {/* Raycasting Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
        />

        {/* Instructions Overlay */}
        <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-[#F2E8E3] text-[11px] text-[#78716C] shadow-xs flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Click anywhere on the body to drop a pin • Drag to rotate 3D view</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SLIDE-OVER / SIDEBAR: PERSONAL SKIN LOG */}
      {/* ===================================================================== */}
      <div className="w-full lg:w-[380px] bg-white border-t lg:border-t-0 lg:border-l border-[#F2E8E3] flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-[#F2E8E3] bg-[#FAF8F6]/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E85D44]/10 text-[#E85D44] flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#18181B]">Skin Log & Spot Tracker</h3>
              <p className="text-[10px] text-[#78716C]">{pins.length} anatomical spots recorded</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewPinPoint({ x: 0, y: 1.5, z: 0.5, zone: "chest" });
              setIsAddingSpot(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E85D44] hover:bg-[#D4472E] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Spot</span>
          </button>
        </div>

        {/* Spot Details / Add Spot Drawer */}
        {isAddingSpot && newPinPoint && (
          <div className="p-4 bg-[#FAF4F0]/90 border-b border-[#F2E8E3] animate-in slide-in-from-top-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-[#E85D44] uppercase tracking-wider">
                Log New Lesion Location
              </span>
              <button
                type="button"
                onClick={() => setIsAddingSpot(false)}
                className="p-1 rounded-lg hover:bg-white text-[#78716C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-[#78716C] uppercase">Anatomical Zone</label>
                <select
                  value={newPinPoint.zone}
                  onChange={(e) => setNewPinPoint({ ...newPinPoint, zone: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border border-[#F2E8E3] rounded-xl text-xs font-bold text-[#18181B] focus:outline-hidden"
                >
                  {COMMON_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#78716C] uppercase">Clinical Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Asymmetric mole, changed color recently..."
                  className="w-full mt-1 p-2 bg-white border border-[#F2E8E3] rounded-xl text-xs text-[#18181B] placeholder-[#A8A29E] focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#78716C] uppercase">Visual Risk Priority</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {(["LOW", "MODERATE", "HIGH"] as const).map((urg) => (
                    <button
                      key={urg}
                      type="button"
                      onClick={() => setNewUrgency(urg)}
                      className={`py-1 rounded-xl text-[10px] font-extrabold uppercase border transition-all ${
                        newUrgency === urg
                          ? urg === "HIGH"
                            ? "bg-[#F43F5E] text-white border-[#F43F5E]"
                            : urg === "MODERATE"
                            ? "bg-[#F59E0B] text-white border-[#F59E0B]"
                            : "bg-[#10B981] text-white border-[#10B981]"
                          : "bg-white text-[#78716C] border-[#F2E8E3]"
                      }`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmAddSpot}
                  className="flex-1 py-2 rounded-xl bg-[#E85D44] hover:bg-[#D4472E] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  Save Spot to Map
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSpot(false)}
                  className="px-3 py-2 rounded-xl bg-white border border-[#F2E8E3] text-xs font-bold text-[#78716C]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Spot Detail Card */}
        {selectedPin && !isAddingSpot && (
          <div className="p-4 bg-gradient-to-br from-[#FAF4F0] to-white border-b border-[#F2E8E3]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                    selectedPin.urgency === "HIGH"
                      ? "bg-[#F43F5E]/15 text-[#E11D48] border border-[#F43F5E]/30"
                      : selectedPin.urgency === "MODERATE"
                      ? "bg-[#F59E0B]/15 text-[#D97706] border border-[#F59E0B]/30"
                      : "bg-[#10B981]/15 text-[#059669] border border-[#10B981]/30"
                  }`}
                >
                  {selectedPin.urgency} Priority
                </span>
                <h4 className="text-sm font-extrabold text-[#18181B] mt-1 capitalize">
                  {selectedPin.zone} Spot
                </h4>
                <p className="text-[10px] text-[#78716C] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" /> Logged on {selectedPin.date}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteSpot(selectedPin.id)}
                className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#EF4444] hover:bg-white transition-colors"
                title="Delete spot"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {selectedPin.photoUrl && (
              <div className="mt-2.5 rounded-xl overflow-hidden border border-[#F2E8E3] max-h-32">
                <img
                  src={selectedPin.photoUrl}
                  alt={selectedPin.zone}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <p className="text-xs text-[#57534E] mt-2 bg-white/80 p-2.5 rounded-xl border border-[#F2E8E3] leading-relaxed">
              {selectedPin.notes}
            </p>

            {/* SEND TO SCREENING BUTTON */}
            <button
              type="button"
              onClick={() => {
                onSendToScreening?.({
                  zone: selectedPin.zone,
                  imageUrl: selectedPin.photoUrl,
                  notes: selectedPin.notes,
                });
              }}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#E85D44] to-[#D4472E] text-white text-xs font-bold shadow-md shadow-[#E85D44]/25 hover:shadow-lg transition-all active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Spot to 6-Agent Screening Pipeline</span>
            </button>
          </div>
        )}

        {/* Spots List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {pins.length === 0 ? (
            <div className="p-8 text-center text-[#A8A29E] text-xs">
              <User className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#E85D44]" />
              No spots logged yet. Click any anatomical zone on the 3D model to drop a pin.
            </div>
          ) : (
            pins.map((pin) => {
              const isSelected = selectedPin?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => setSelectedPin(pin)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-white border-[#E85D44] shadow-md ring-2 ring-[#E85D44]/20"
                      : "bg-[#FAF8F6]/60 hover:bg-white border-[#F2E8E3] hover:border-[#E5DCD4]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#18181B] capitalize">
                      {pin.zone}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pin.urgency === "HIGH"
                          ? "bg-[#F43F5E]"
                          : pin.urgency === "MODERATE"
                          ? "bg-[#F59E0B]"
                          : "bg-[#10B981]"
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-[#78716C] truncate mt-1">{pin.notes}</p>
                  <span className="text-[9px] text-[#A8A29E] mt-1 block">{pin.date}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
