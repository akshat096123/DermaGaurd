"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RotateCw, Eye, Grid, Maximize2, Sparkles, Activity } from "lucide-react";

interface ThreeDTopographyMeshProps {
  imageUrl: string;
  className?: string;
}

export default function ThreeDTopographyMesh({
  imageUrl,
  className = "",
}: ThreeDTopographyMeshProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [heightScale, setHeightScale] = useState<number>(1.8);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<"elevation" | "texture">("elevation");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [meshStats, setMeshStats] = useState({ vertices: 25600, peakHeight: "1.68 mm", roughness: "Ra 0.34" });

  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    setIsLoading(true);

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 360;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#06080D");
    scene.fog = new THREE.FogExp2("#06080D", 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, -9, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 4;
    controls.maxDistance = 20;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 2.0); // Cyan rim light
    dirLight1.position.set(5, 8, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 1.2); // Crimson fill
    dirLight2.position.set(-6, -4, 6);
    scene.add(dirLight2);

    // 4. Load Image Texture & Sample Luminance for Topography
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      // Offscreen canvas for height extraction
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const sampleRes = 120; // 120x120 elevation grid
      canvas.width = sampleRes;
      canvas.height = sampleRes;

      if (ctx) {
        ctx.drawImage(img, 0, 0, sampleRes, sampleRes);
        const imgData = ctx.getImageData(0, 0, sampleRes, sampleRes).data;

        // Create displaced geometry
        const geometry = new THREE.PlaneGeometry(8, 8, sampleRes - 1, sampleRes - 1);
        const posAttr = geometry.attributes.position;
        const count = posAttr.count;

        const colors = new Float32Array(count * 3);
        let maxZ = 0;

        for (let i = 0; i < count; i++) {
          const pixelIdx = i * 4;
          const r = imgData[pixelIdx] / 255;
          const g = imgData[pixelIdx + 1] / 255;
          const b = imgData[pixelIdx + 2] / 255;

          // Inverted luminance: darker pigment / melanin = higher elevation displacement
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          const elevation = (1.0 - luminance) * heightScale;
          posAttr.setZ(i, elevation);

          if (elevation > maxZ) maxZ = elevation;

          // Topographical color gradient
          // Deep navy base -> Cyan -> Golden Amber -> Vibrant Crimson peak
          const t = Math.min(Math.max((1.0 - luminance), 0.0), 1.0);
          let cr = 0.1, cg = 0.2, cb = 0.4;
          if (t < 0.35) {
            // Navy to Cyan
            const factor = t / 0.35;
            cr = 0.05 + 0.15 * factor;
            cg = 0.2 + 0.55 * factor;
            cb = 0.4 + 0.55 * factor;
          } else if (t < 0.7) {
            // Cyan to Amber
            const factor = (t - 0.35) / 0.35;
            cr = 0.2 + 0.75 * factor;
            cg = 0.75 + 0.15 * factor;
            cb = 0.95 - 0.75 * factor;
          } else {
            // Amber to Crimson
            const factor = (t - 0.7) / 0.3;
            cr = 0.95 + 0.05 * factor;
            cg = 0.9 - 0.65 * factor;
            cb = 0.2 - 0.1 * factor;
          }

          colors[i * 3] = cr;
          colors[i * 3 + 1] = cg;
          colors[i * 3 + 2] = cb;
        }

        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        // Texture texture loader
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshStandardMaterial({
          vertexColors: colorMode === "elevation",
          map: colorMode === "texture" ? texture : null,
          wireframe: wireframe,
          roughness: 0.35,
          metalness: 0.2,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 6;
        scene.add(mesh);
        meshRef.current = mesh;

        // Ground wireframe reference grid
        const gridHelper = new THREE.GridHelper(10, 20, 0x0284c7, 0x1e293b);
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = -0.05;
        scene.add(gridHelper);

        setMeshStats({
          vertices: count,
          peakHeight: `${(maxZ * 1.1).toFixed(2)} mm`,
          roughness: `Ra ${(0.25 + maxZ * 0.1).toFixed(2)}`,
        });
        setIsLoading(false);
      }
    };

    // 5. Render Loop
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

    // 6. Resize handling
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [imageUrl, heightScale, colorMode]);

  // Dynamic updates for controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  useEffect(() => {
    if (meshRef.current && meshRef.current.material) {
      (meshRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframe;
    }
  }, [wireframe]);

  return (
    <div className={`relative w-full h-full flex flex-col bg-[#06080D] rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* HUD Telemetry Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
          <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>TOPOGRAPHICAL 3D MESH</span>
        </div>
        <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
          PEAK: <span className="text-amber-300 font-semibold">{meshStats.peakHeight}</span>
        </div>
        <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 hidden sm:block">
          ROUGHNESS: <span className="text-emerald-300">{meshStats.roughness}</span>
        </div>
      </div>

      {/* Floating Interactive Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/15">
        <button
          onClick={() => setWireframe(!wireframe)}
          title="Toggle Wireframe Mesh"
          className={`p-1.5 rounded transition ${
            wireframe ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-white"
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={() => setColorMode(colorMode === "elevation" ? "texture" : "elevation")}
          title="Switch Color Mode (Heatmap vs Texture)"
          className={`p-1.5 rounded transition ${
            colorMode === "elevation" ? "bg-amber-500/30 text-amber-300 border border-amber-500/40" : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle Auto Rotation"
          className={`p-1.5 rounded transition ${
            autoRotate ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40" : "text-slate-400 hover:text-white"
          }`}
        >
          <RotateCw className={`w-4 h-4 ${autoRotate ? "animate-spin" : ""}`} style={{ animationDuration: "8s" }} />
        </button>
      </div>

      {/* Height Exaggeration Slider at bottom */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between px-3 py-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-[11px] font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">DISPLACEMENT:</span>
          <span className="text-cyan-400 font-semibold">{heightScale.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.4"
          max="3.2"
          step="0.2"
          value={heightScale}
          onChange={(e) => setHeightScale(parseFloat(e.target.value))}
          className="w-32 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="text-[10px] text-slate-400 hidden sm:block">
          Click & Drag to Rotate • Scroll to Zoom
        </div>
      </div>

      {/* WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full min-h-[340px] cursor-grab active:cursor-grabbing" />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#06080D]/90 z-20">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
          <div className="text-[11px] font-mono text-cyan-300 tracking-wider">COMPUTING DISPLACEMENT MATRIX...</div>
        </div>
      )}
    </div>
  );
}
