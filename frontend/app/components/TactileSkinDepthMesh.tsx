"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RotateCcw } from "lucide-react";

interface TactileSkinDepthMeshProps {
  imageUrl: string;
  className?: string;
}

export default function TactileSkinDepthMesh({
  imageUrl,
  className = "",
}: TactileSkinDepthMeshProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    setIsLoading(true);
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 280;

    // 1. Scene with soft warm alabaster background
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#FDF5F2"); // soft warm blush

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, -6.5, 6.5);

    // 3. Renderer with natural skin-tone tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. Smooth natural orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.minDistance = 4;
    controls.maxDistance = 14;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // 5. Warm Skin-Toned Studio Lighting (NO cyber lights!)
    const ambientLight = new THREE.AmbientLight(0xFFF6F0, 1.4); // warm soft ambient
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xFFE4D6, 1.6); // warm peach key light
    keyLight.position.set(4, 6, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xFDF0E9, 0.8); // soft warm fill
    fillLight.position.set(-4, -4, 5);
    scene.add(fillLight);

    // 6. Load Image & Create Tactile Relief Plane
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const sampleRes = 96;
      const canvas = document.createElement("canvas");
      canvas.width = sampleRes;
      canvas.height = sampleRes;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0, sampleRes, sampleRes);
        const imgData = ctx.getImageData(0, 0, sampleRes, sampleRes).data;

        const geometry = new THREE.PlaneGeometry(6.5, 6.5, sampleRes - 1, sampleRes - 1);
        const posAttr = geometry.attributes.position;
        const count = posAttr.count;

        for (let i = 0; i < count; i++) {
          const pixelIdx = i * 4;
          const r = imgData[pixelIdx] / 255;
          const g = imgData[pixelIdx + 1] / 255;
          const b = imgData[pixelIdx + 2] / 255;

          // Inverted luminance for subtle, tactile surface relief
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const elevation = (1.0 - lum) * 0.95; // gentle, natural skin elevation
          posAttr.setZ(i, elevation);
        }

        geometry.computeVertexNormals();

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.65, // soft natural skin roughness
          metalness: 0.05,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 8;
        scene.add(mesh);

        setIsLoading(false);
      }
    };

    // 7. Render Loop
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      renderer.render(scene, camera);
    };
    animate();

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
  }, [imageUrl]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-[#FDF5F2] rounded-[20px] overflow-hidden select-none ${className}`}>
      {/* Gentle Floating Instruction */}
      <div className="absolute bottom-3 left-3 z-10 px-3 py-1 bg-white/80 backdrop-blur-md rounded-full border border-[#F3E8E2] text-[11px] font-medium text-[#8A817C] pointer-events-none shadow-sm">
        Drag to rotate surface • Scroll to zoom
      </div>

      <div ref={mountRef} className="w-full h-full min-h-[280px] cursor-grab active:cursor-grabbing" />

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FDF5F2] z-20">
          <div className="w-6 h-6 border-2 border-[#F2765E] border-t-transparent rounded-full animate-spin mb-2" />
          <span className="text-xs font-medium text-[#8A817C]">Rendering surface relief...</span>
        </div>
      )}
    </div>
  );
}
