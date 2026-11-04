"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
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
  Sparkles,
  Layers,
  Loader2,
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
  initialSex?: "male" | "female";
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
  initialSex = "male",
  onSendToScreening,
  onClose,
}: BodyMap3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Model Selection (Male vs Female) - defaults to Male
  const [modelGender, setModelGender] = useState<"male" | "female">(
    initialSex === "female" ? "female" : "male"
  );

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
  const [skinTheme, setSkinTheme] = useState<"realistic" | "holographic" | "clay">("realistic");
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);

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
  const bodyMeshesRef = useRef<THREE.Mesh[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);

  // Anatomical zone classifier based on 3D world coordinates
  const getAnatomicalZoneFromPoint = useCallback((p: THREE.Vector3): string => {
    const y = p.y;
    const x = p.x;
    const z = p.z;

    if (y >= 1.95) {
      return z >= 0 ? "face" : "scalp";
    }
    if (y >= 1.65) {
      return "neck";
    }
    if (y >= 0.75) {
      if (Math.abs(x) > 0.85) return "upper extremity";
      if (z < 0) return "back";
      return "chest";
    }
    if (y >= -0.1) {
      if (Math.abs(x) > 1.05) return "hand";
      if (Math.abs(x) > 0.65) return "upper extremity";
      if (z < 0) return "back";
      return "abdomen";
    }
    if (y >= -0.5) {
      if (Math.abs(x) > 0.95) return "hand";
      if (z < 0) return "back";
      return "abdomen";
    }
    if (y >= -2.25) {
      return "lower extremity";
    }
    return "foot";
  }, []);

  // Material generator for current theme
  const createSkinMaterial = useCallback((theme: "realistic" | "holographic" | "clay") => {
    if (theme === "realistic") {
      return new THREE.MeshStandardMaterial({
        color: 0xedd9cb, // Natural warm clinical human skin tone
        roughness: 0.45,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
    } else if (theme === "holographic") {
      return new THREE.MeshStandardMaterial({
        color: 0x06b6d4, // Cyan holographic medical contour
        roughness: 0.25,
        metalness: 0.75,
        emissive: 0x083344,
        emissiveIntensity: 0.45,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: 0xf5f2ee, // Neutral medical porcelain / studio clay
        roughness: 0.48,
        metalness: 0.02,
        side: THREE.DoubleSide,
      });
    }
  }, []);

  // Dynamically update materials when skinTheme changes
  useEffect(() => {
    if (bodyMeshesRef.current.length === 0) return;
    const newMat = createSkinMaterial(skinTheme);
    bodyMeshesRef.current.forEach((mesh) => {
      mesh.material = newMat;
    });
  }, [skinTheme, createSkinMaterial]);

  // Load Model when modelGender changes
  const loadHumanModel = useCallback(
    (gender: "male" | "female") => {
      if (!mannequinGroupRef.current) return;
      const group = mannequinGroupRef.current;

      // Remove existing model children
      while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
        if ((obj as any).geometry) (obj as any).geometry.dispose();
      }

      setIsLoadingModel(true);

      const objLoader = new OBJLoader();
      const modelUrl = gender === "male" ? "/models/male.obj" : "/models/female.obj";

      objLoader.load(
        modelUrl,
        (obj) => {
          const skinMat = createSkinMaterial(skinTheme);
          const meshes: THREE.Mesh[] = [];

          obj.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.geometry.computeVertexNormals();
              mesh.material = skinMat;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              meshes.push(mesh);
            }
          });

          bodyMeshesRef.current = meshes;

          // Compute bounds & auto-scale to standard height (~5.4 units)
          const bbox = new THREE.Box3().setFromObject(obj);
          const size = bbox.getSize(new THREE.Vector3());
          const center = bbox.getCenter(new THREE.Vector3());

          // Center model on origin
          obj.position.x = -center.x;
          obj.position.y = -center.y;
          obj.position.z = -center.z;

          const modelWrapper = new THREE.Group();
          modelWrapper.add(obj);

          const targetHeight = 5.4;
          const scale = targetHeight / (size.y || 1);
          modelWrapper.scale.set(scale, scale, scale);

          // Position model on top of the ground disc
          modelWrapper.position.set(0, 0.05, 0);

          group.add(modelWrapper);
          setIsLoadingModel(false);
        },
        undefined,
        (err) => {
          console.error(`Failed to load ${modelUrl}:`, err);
          setIsLoadingModel(false);
        }
      );
    },
    [createSkinMaterial, skinTheme]
  );

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

    // Advanced Clinical Lighting System
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    // Key Light (Warm soft directional light)
    const keyLight = new THREE.DirectionalLight(0xfff6ed, 2.0);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);

    // Fill Light (Cool clinical cyan)
    const fillLight = new THREE.DirectionalLight(0x06b6d4, 0.6);
    fillLight.position.set(-6, -1, -3);
    scene.add(fillLight);

    // Rim Light (Accentuates human body silhouette)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.85);
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    // Subtle Ground Shadow Disc
    const groundGeom = new THREE.CircleGeometry(2.4, 48);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x1c1917,
      transparent: true,
      opacity: 0.06,
    });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -2.85;
    scene.add(groundMesh);

    // Pedestal Glow Ring
    const haloGeom = new THREE.RingGeometry(2.3, 2.45, 64);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xe85d44,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = -2.84;
    scene.add(haloMesh);

    // Group for Mannequin
    // Group for Mannequin
    const mannequinGroup = new THREE.Group();
    scene.add(mannequinGroup);
    mannequinGroupRef.current = mannequinGroup;

    // Group for Pins / Markers
    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersGroupRef.current = markersGroup;

    // Animation Render Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

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
      controls.dispose();
    };
  }, []);

  // Reload human model when gender changes or on initial mount
  useEffect(() => {
    if (!mannequinGroupRef.current) return;
    loadHumanModel(modelGender);
  }, [modelGender, loadHumanModel]);

  // Handle Model Gender Change
  const handleGenderToggle = (newGender: "male" | "female") => {
    if (newGender === modelGender) return;
    setModelGender(newGender);
  };

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

    // Otherwise check human body surface
    const intersects = raycaster.intersectObjects(mannequinGroupRef.current.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const zone = getAnatomicalZoneFromPoint(hit.point);

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
      const zone = getAnatomicalZoneFromPoint(hit.point);
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
    <div className="relative w-full rounded-3xl bg-white/90 backdrop-blur-2xl border border-[#F2E8E3] shadow-[0_20px_50px_-8px_rgba(28,25,23,0.06)] overflow-hidden flex flex-col lg:flex-row min-h-[660px]">
      {/* ===================================================================== */}
      {/* 3D REAL HUMAN BODY CANVAS VIEWPORT */}
      {/* ===================================================================== */}
      <div
        ref={mountRef}
        className="relative flex-1 bg-gradient-to-b from-[#FAF4F0]/60 via-[#FFFFFF]/80 to-[#F5ECE5]/40 min-h-[520px] flex items-center justify-center overflow-hidden"
      >
        {/* Subtle Anatomical Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#E85D44_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        {/* View Controls & Presets Bar */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#F2E8E3] shadow-sm">
          {/* Gender Model Switcher */}
          <div className="flex items-center gap-1 bg-[#FAF4F0] p-0.5 rounded-xl border border-[#F2E8E3]">
            <button
              type="button"
              onClick={() => handleGenderToggle("male")}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                modelGender === "male"
                  ? "bg-[#E85D44] text-white shadow-xs"
                  : "text-[#78716C] hover:text-[#18181B]"
              }`}
            >
              ♂ Male
            </button>
            <button
              type="button"
              onClick={() => handleGenderToggle("female")}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                modelGender === "female"
                  ? "bg-[#E85D44] text-white shadow-xs"
                  : "text-[#78716C] hover:text-[#18181B]"
              }`}
            >
              ♀ Female
            </button>
          </div>

          <div className="h-4 w-px bg-[#E5DCD4]" />

          {/* Camera View Angle Presets */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#78716C] px-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[#E85D44]" /> View:
            </span>
            {(["front", "back", "left", "right", "reset"] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setPresetView(view)}
                className={`px-2 py-1 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activePreset === view
                    ? "bg-[#18181B] text-white shadow-xs"
                    : "bg-transparent text-[#78716C] hover:text-[#18181B] hover:bg-[#FAF4F0]"
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>

        {/* Shading Style Selector & Real Human Anatomy Badge */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#F2E8E3] shadow-sm">
          <div className="flex items-center gap-1 px-2 text-[10px] font-black uppercase tracking-wider text-[#78716C] border-r border-[#F2E8E3] pr-2.5">
            <Layers className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Skin Shading:</span>
          </div>
          {(
            [
              { key: "realistic", label: "Classic Skin" },
              { key: "holographic", label: "Hologram" },
              { key: "clay", label: "Studio Clay" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSkinTheme(t.key)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                skinTheme === t.key
                  ? "bg-[#0D9488] text-white shadow-xs"
                  : "bg-transparent text-[#78716C] hover:text-[#18181B] hover:bg-[#FAF4F0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Anatomical Zone Hover Tooltip */}
        {hoveredZone && (
          <div className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#E85D44]/40 text-xs font-black text-[#E85D44] shadow-md flex items-center gap-2 animate-in fade-in zoom-in-95">
            <span className="w-2 h-2 rounded-full bg-[#E85D44] animate-ping" />
            <span className="capitalize tracking-wide">Anatomical Zone: {hoveredZone}</span>
          </div>
        )}

        {/* Model Status Badge */}
        <div className="absolute top-16 left-4 z-20 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#F2E8E3] text-[10px] font-bold text-[#78716C] shadow-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span>Classic Anatomical {modelGender === "male" ? "Male" : "Female"} Model (Normal Skin Surface)</span>
        </div>

        {/* Loading Overlay */}
        {isLoadingModel && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm space-y-3">
            <Loader2 className="w-8 h-8 text-[#E85D44] animate-spin" />
            <p className="text-xs font-bold text-[#18181B]">Loading Classic 3D {modelGender === "male" ? "Male" : "Female"} Model...</p>
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
        <div className="absolute bottom-4 left-4 z-20 px-3 py-1.5 rounded-xl bg-white/85 backdrop-blur-md border border-[#F2E8E3] text-[11px] text-[#78716C] shadow-xs flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-[#0D9488]" />
          <span>Click anywhere on the body to drop a lesion pin • Drag to rotate 3D view</span>
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
              <p className="text-[10px] text-[#78716C]">{pins.length} anatomical spots recorded ({modelGender})</p>
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
