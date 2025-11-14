'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import { Text3D, Center } from '@react-three/drei';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import * as THREE from 'three';

export default function PreciousMetalText() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [font, setFont] = useState<any>(null);

  // Load font
  useEffect(() => {
    const loader = new FontLoader();
    loader.load(
      'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
      (loadedFont) => {
        setFont(loadedFont);
      },
      undefined,
      (error) => {
        console.error('Error loading font:', error);
      }
    );
  }, []);

  // Animate the text to make it gleam
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation for 3D effect
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;

      // Dynamic metal properties
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        // Animate metalness and roughness for realistic metal effect
        material.metalness = 0.9 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        material.roughness = 0.1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      }
    }
  });

  if (!font) {
    return null; // Don't render until font is loaded
  }

  const geometry = new TextGeometry('With every click!', {
    font: font,
    size: 0.4,
    depth: 0.15,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5,
  });

  // Center the geometry
  geometry.computeBoundingBox();
  if (geometry.boundingBox) {
    const centerOffsetX = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    const centerOffsetY = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
    geometry.translate(centerOffsetX, centerOffsetY, 0);
  }

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#FFD700" // Gold color
        metalness={0.95}
        roughness={0.05}
        emissive="#FFD700"
        emissiveIntensity={0.1}
        envMapIntensity={1.0}
      />
    </mesh>
  );
}

// Wrapper component with Canvas and lighting
export function PreciousMetalTextCanvas() {
  return (
    <div className="mb-8" style={{ height: '120px', width: '100%' }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        {/* Realistic lighting setup for metal */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-5, 5, 5]} intensity={0.8} color="#FFE4B5" />
        <pointLight position={[5, -5, 5]} intensity={0.6} color="#FFF8DC" />

        {/* Environment for reflections */}
        <mesh position={[0, 0, -10]}>
          <sphereGeometry args={[50, 32, 32]} />
          <meshBasicMaterial color="#000000" side={THREE.BackSide} />
        </mesh>

        <Center>
          <PreciousMetalText />
        </Center>
      </Canvas>
    </div>
  );
}