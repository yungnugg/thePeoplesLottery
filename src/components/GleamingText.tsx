'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export default function GleamingText() {
  const textRef = useRef<THREE.Mesh>(null);

  // Animate the text to make it gleam
  useFrame((state) => {
    if (textRef.current) {
      // Subtle rotation for gleam effect
      textRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      // Pulse the emissive intensity for extra gleam
      const material = textRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        material.emissive.setScalar(Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.4);
      }
    }
  });

  return (
    <Text
      ref={textRef}
      fontSize={0.3}
      color="#C0C0C0"
      anchorX="center"
      anchorY="middle"
      font="/fonts/helvetiker_regular.typeface.json"
    >
      With every click!
      <meshStandardMaterial
        color="#C0C0C0"
        metalness={0.9}
        roughness={0.1}
        emissive="#FFFFFF"
        emissiveIntensity={0.4}
      />
    </Text>
  );
}