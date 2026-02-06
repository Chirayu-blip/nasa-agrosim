import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Realistic Farmer character with animations
export function Farmer({ position = [0, 0, 0], isWorking = false }) {
  const farmerRef = useRef();
  const armRef = useRef();
  const legsRef = useRef();
  
  useFrame((state) => {
    if (farmerRef.current) {
      // Idle breathing animation
      farmerRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.01;
    }
    
    if (isWorking && armRef.current) {
      armRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 8) * 0.6 - 0.8;
    }
    
    if (legsRef.current) {
      // Subtle leg movement
      legsRef.current.children[0].rotation.x = Math.sin(state.clock.elapsedTime * 4) * 0.1;
      legsRef.current.children[1].rotation.x = -Math.sin(state.clock.elapsedTime * 4) * 0.1;
    }
  });

  return (
    <group ref={farmerRef} position={position}>
      {/* Body - shirt */}
      <mesh position={[0, 0.42, 0]}>
        <capsuleGeometry args={[0.1, 0.28, 8, 16]} />
        <meshStandardMaterial color="#2563eb" roughness={0.8} />
      </mesh>
      
      {/* Overalls */}
      <mesh position={[0, 0.32, 0.02]}>
        <boxGeometry args={[0.18, 0.1, 0.12]} />
        <meshStandardMaterial color="#1e40af" roughness={0.9} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#fcd9b6" roughness={0.7} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[0.03, 0.74, 0.08]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#1e3a5f" />
      </mesh>
      <mesh position={[-0.03, 0.74, 0.08]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#1e3a5f" />
      </mesh>
      
      {/* Smile */}
      <mesh position={[0, 0.69, 0.09]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.025, 0.006, 8, 16, Math.PI]} />
        <meshBasicMaterial color="#c2410c" />
      </mesh>
      
      {/* Straw hat */}
      <group position={[0, 0.85, 0]}>
        <mesh>
          <cylinderGeometry args={[0.11, 0.11, 0.08, 16]} />
          <meshStandardMaterial color="#d4a017" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.02, 16]} />
          <meshStandardMaterial color="#c9a227" roughness={0.9} />
        </mesh>
        {/* Hat band */}
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.115, 0.115, 0.025, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.8} />
        </mesh>
      </group>
      
      {/* Left Arm */}
      <mesh position={[-0.16, 0.48, 0]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.035, 0.18, 8, 16]} />
        <meshStandardMaterial color="#2563eb" roughness={0.8} />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.26, 0.38, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#fcd9b6" roughness={0.7} />
      </mesh>
      
      {/* Right Arm (animated) */}
      <group ref={armRef} position={[0.16, 0.55, 0]}>
        <mesh rotation={[0, 0, -0.4]}>
          <capsuleGeometry args={[0.035, 0.18, 8, 16]} />
          <meshStandardMaterial color="#2563eb" roughness={0.8} />
        </mesh>
        {/* Right hand */}
        <mesh position={[0.08, -0.15, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#fcd9b6" roughness={0.7} />
        </mesh>
        {/* Tool - hoe */}
        {isWorking && (
          <group position={[0.1, -0.2, 0]} rotation={[0.5, 0, 0.3]}>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.4, 6]} />
              <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.35, 0.03]} rotation={[0.8, 0, 0]}>
              <boxGeometry args={[0.08, 0.02, 0.06]} />
              <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.5} />
            </mesh>
          </group>
        )}
      </group>
      
      {/* Legs */}
      <group ref={legsRef}>
        <mesh position={[-0.05, 0.13, 0]}>
          <capsuleGeometry args={[0.035, 0.22, 8, 16]} />
          <meshStandardMaterial color="#1e40af" roughness={0.9} />
        </mesh>
        <mesh position={[0.05, 0.13, 0]}>
          <capsuleGeometry args={[0.035, 0.22, 8, 16]} />
          <meshStandardMaterial color="#1e40af" roughness={0.9} />
        </mesh>
      </group>
      
      {/* Boots */}
      <mesh position={[-0.05, 0.025, 0.015]}>
        <boxGeometry args={[0.055, 0.05, 0.09]} />
        <meshStandardMaterial color="#422006" roughness={0.9} />
      </mesh>
      <mesh position={[0.05, 0.025, 0.015]}>
        <boxGeometry args={[0.055, 0.05, 0.09]} />
        <meshStandardMaterial color="#422006" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Animated chicken
export function Chicken({ position = [0, 0, 0] }) {
  const chickenRef = useRef();
  const headRef = useRef();
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);
  
  useFrame((state) => {
    if (chickenRef.current) {
      const time = state.clock.elapsedTime + offset;
      chickenRef.current.position.x = position[0] + Math.sin(time * 0.6) * 0.4;
      chickenRef.current.position.z = position[2] + Math.cos(time * 0.6) * 0.4;
      chickenRef.current.rotation.y = Math.atan2(Math.cos(time * 0.6), Math.sin(time * 0.6)) + Math.PI / 2;
    }
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 4 + offset) * 0.2;
    }
  });

  return (
    <group ref={chickenRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.8} />
      </mesh>
      {/* Wing */}
      <mesh position={[0.06, 0.1, 0]} rotation={[0, 0, 0.3]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#fde68a" roughness={0.8} />
      </mesh>
      {/* Head */}
      <group ref={headRef} position={[0.08, 0.17, 0]}>
        <mesh>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        {/* Beak */}
        <mesh position={[0.045, -0.01, 0]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.015, 0.035, 4]} />
          <meshStandardMaterial color="#f97316" roughness={0.6} />
        </mesh>
        {/* Comb */}
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[0.02, 0.035, 0.025]} />
          <meshStandardMaterial color="#dc2626" roughness={0.7} />
        </mesh>
        {/* Eye */}
        <mesh position={[0.03, 0.01, 0.02]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
        {/* Wattle */}
        <mesh position={[0.035, -0.025, 0]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#dc2626" roughness={0.7} />
        </mesh>
      </group>
      {/* Tail */}
      <mesh position={[-0.08, 0.13, 0]} rotation={[0, 0, 0.6]}>
        <coneGeometry args={[0.025, 0.06, 4]} />
        <meshStandardMaterial color="#fef9c3" roughness={0.8} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.02, 0.025, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.05, 4]} />
        <meshStandardMaterial color="#f97316" roughness={0.6} />
      </mesh>
      <mesh position={[0.02, 0.025, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.05, 4]} />
        <meshStandardMaterial color="#f97316" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Grazing cow
export function Cow({ position = [0, 0, 0] }) {
  const cowRef = useRef();
  const tailRef = useRef();
  const headRef = useRef();
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);
  
  useFrame((state) => {
    if (cowRef.current) {
      const time = state.clock.elapsedTime + offset;
      cowRef.current.position.x = position[0] + Math.sin(time * 0.15) * 0.25;
      cowRef.current.position.z = position[2] + Math.cos(time * 0.15) * 0.25;
      cowRef.current.rotation.y = Math.sin(time * 0.15) * 0.3;
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.4;
    }
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 + offset) * 0.1;
    }
  });

  return (
    <group ref={cowRef} position={position}>
      {/* Body */}
      <mesh position={[0, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.16, 0.35, 12, 16]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
      </mesh>
      {/* Spots */}
      <mesh position={[0.12, 0.34, 0.12]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} />
      </mesh>
      <mesh position={[-0.08, 0.32, -0.1]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} />
      </mesh>
      <mesh position={[0.02, 0.22, 0.14]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} />
      </mesh>
      
      {/* Head */}
      <group ref={headRef} position={[0.32, 0.32, 0]}>
        <mesh>
          <boxGeometry args={[0.13, 0.11, 0.11]} />
          <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
        </mesh>
        {/* Snout */}
        <mesh position={[0.08, -0.02, 0]}>
          <boxGeometry args={[0.05, 0.07, 0.09]} />
          <meshStandardMaterial color="#fecdd3" roughness={0.8} />
        </mesh>
        {/* Nostrils */}
        <mesh position={[0.105, -0.02, 0.02]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
        <mesh position={[0.105, -0.02, -0.02]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.04, 0.02, 0.05]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
        <mesh position={[0.04, 0.02, -0.05]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.02, 0.05, 0.07]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.04, 0.06, 0.025]} />
          <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
        </mesh>
        <mesh position={[-0.02, 0.05, -0.07]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.04, 0.06, 0.025]} />
          <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
        </mesh>
        {/* Horns */}
        <mesh position={[-0.01, 0.08, 0.05]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.015, 0.07, 6]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.8} />
        </mesh>
        <mesh position={[-0.01, 0.08, -0.05]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.015, 0.07, 6]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.8} />
        </mesh>
      </group>
      
      {/* Legs */}
      {[[-0.14, 0.09, 0.09], [-0.14, 0.09, -0.09], [0.14, 0.09, 0.09], [0.14, 0.09, -0.09]].map((pos, i) => (
        <group key={i}>
          <mesh position={pos}>
            <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
            <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
          </mesh>
          <mesh position={[pos[0], 0.01, pos[2]]}>
            <cylinderGeometry args={[0.028, 0.028, 0.02, 8]} />
            <meshStandardMaterial color="#1c1917" roughness={0.9} />
          </mesh>
        </group>
      ))}
      
      {/* Udder */}
      <mesh position={[0.05, 0.12, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#fecdd3" roughness={0.8} />
      </mesh>
      
      {/* Tail */}
      <group ref={tailRef} position={[-0.28, 0.32, 0]}>
        <mesh rotation={[0, 0, 0.8]}>
          <cylinderGeometry args={[0.008, 0.008, 0.18, 4]} />
          <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
        </mesh>
        <mesh position={[-0.1, -0.06, 0]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// Red tractor
export function Tractor({ position = [0, 0, 0] }) {
  const wheelsRef = useRef([]);
  const exhaustRef = useRef();
  
  useFrame((state) => {
    wheelsRef.current.forEach(wheel => {
      if (wheel) wheel.rotation.z += 0.01;
    });
    if (exhaustRef.current) {
      exhaustRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 8) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Main body */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.55, 0.28, 0.35]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Hood */}
      <mesh position={[0.32, 0.34, 0]}>
        <boxGeometry args={[0.35, 0.22, 0.32]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Grill */}
      <mesh position={[0.5, 0.32, 0]}>
        <boxGeometry args={[0.02, 0.15, 0.28]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[-0.08, 0.6, 0]}>
        <boxGeometry args={[0.28, 0.28, 0.32]} />
        <meshStandardMaterial color="#0ea5e9" transparent opacity={0.6} roughness={0.1} metalness={0.5} />
      </mesh>
      {/* Cabin roof */}
      <mesh position={[-0.08, 0.76, 0]}>
        <boxGeometry args={[0.3, 0.04, 0.34]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.7} />
      </mesh>
      {/* Exhaust pipe */}
      <mesh position={[0.38, 0.58, 0.12]}>
        <cylinderGeometry args={[0.025, 0.025, 0.25, 8]} />
        <meshStandardMaterial color="#374151" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Exhaust smoke */}
      <mesh ref={exhaustRef} position={[0.38, 0.72, 0.12]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#9ca3af" transparent opacity={0.5} />
      </mesh>
      {/* Steering wheel hint */}
      <mesh position={[-0.02, 0.55, 0.12]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.04, 0.008, 8, 16]} />
        <meshStandardMaterial color="#1c1917" roughness={0.8} />
      </mesh>
      
      {/* Back wheels (big) */}
      {[0.22, -0.22].map((z, i) => (
        <mesh key={`back-${i}`} ref={el => wheelsRef.current[i] = el} position={[-0.18, 0.18, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.1, 24]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
      ))}
      {/* Front wheels (small) */}
      {[0.18, -0.18].map((z, i) => (
        <mesh key={`front-${i}`} ref={el => wheelsRef.current[i + 2] = el} position={[0.35, 0.1, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.07, 16]} />
          <meshStandardMaterial color="#1c1917" roughness={0.9} />
        </mesh>
      ))}
      {/* Wheel hubs */}
      {[[-0.18, 0.18, 0.26], [-0.18, 0.18, -0.26]].map((pos, i) => (
        <mesh key={`hub-${i}`} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.02, 8]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Detailed barn
export function Barn({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Main structure */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.6, 1.3, 1.1]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.9} />
      </mesh>
      {/* White trim */}
      <mesh position={[0, 0.02, 0.56]}>
        <boxGeometry args={[1.62, 0.08, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.28, 0.56]}>
        <boxGeometry args={[1.62, 0.08, 0.02]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.15, 0.65, 4]} />
        <meshStandardMaterial color="#78350f" roughness={0.95} />
      </mesh>
      
      {/* Main door */}
      <mesh position={[0, 0.45, 0.56]}>
        <boxGeometry args={[0.5, 0.85, 0.03]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      {/* Door cross beams */}
      <mesh position={[0, 0.45, 0.575]}>
        <boxGeometry args={[0.48, 0.04, 0.01]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.45, 0.575]}>
        <boxGeometry args={[0.04, 0.83, 0.01]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      
      {/* Hay loft door */}
      <mesh position={[0, 1.0, 0.56]}>
        <boxGeometry args={[0.35, 0.3, 0.03]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      {/* Hay visible in loft */}
      <mesh position={[0, 0.95, 0.54]}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshStandardMaterial color="#fbbf24" roughness={1} />
      </mesh>
      
      {/* Windows */}
      {[[0.55, 0.7, 0.56], [-0.55, 0.7, 0.56]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <boxGeometry args={[0.22, 0.25, 0.03]} />
            <meshStandardMaterial color="#fef9c3" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.22, 0.02, 0.01]} />
            <meshStandardMaterial color="#ffffff" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.02, 0.25, 0.01]} />
            <meshStandardMaterial color="#ffffff" roughness={0.8} />
          </mesh>
        </group>
      ))}
      
      {/* Side windows */}
      {[[0.81, 0.7, 0.25], [0.81, 0.7, -0.25]].map((pos, i) => (
        <mesh key={`side-${i}`} position={pos}>
          <boxGeometry args={[0.03, 0.22, 0.22]} />
          <meshStandardMaterial color="#fef9c3" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Spinning windmill
export function Windmill({ position = [0, 0, 0] }) {
  const bladesRef = useRef();
  
  useFrame((state) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.z += 0.025;
    }
  });

  return (
    <group position={position}>
      {/* Base/tower */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.25, 0.4, 1.8, 8]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
      </mesh>
      {/* Stone texture rings */}
      {[0.2, 0.6, 1.0, 1.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.38 - i * 0.03, 0.015, 8, 24]} />
          <meshStandardMaterial color="#d1d5db" roughness={0.95} />
        </mesh>
      ))}
      
      {/* Cap */}
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.32, 0.35, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
      
      {/* Blades hub */}
      <mesh position={[0, 1.6, 0.28]}>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.3} />
      </mesh>
      
      {/* Blades */}
      <group ref={bladesRef} position={[0, 1.6, 0.32]}>
        {[0, 1, 2, 3].map(i => (
          <group key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
            <mesh position={[0, 0.45, 0]}>
              <boxGeometry args={[0.12, 0.85, 0.015]} />
              <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
            </mesh>
            {/* Blade frame */}
            <mesh position={[0.04, 0.45, 0]}>
              <boxGeometry args={[0.015, 0.85, 0.02]} />
              <meshStandardMaterial color="#78350f" roughness={0.9} />
            </mesh>
            <mesh position={[-0.04, 0.45, 0]}>
              <boxGeometry args={[0.015, 0.85, 0.02]} />
              <meshStandardMaterial color="#78350f" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
      
      {/* Door */}
      <mesh position={[0, 0.25, 0.31]}>
        <boxGeometry args={[0.22, 0.45, 0.02]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Wooden fence
export function Fence({ start = [0, 0, 0], end = [2, 0, 0], segments = 4 }) {
  const posts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    posts.push([
      start[0] + (end[0] - start[0]) * t,
      start[1],
      start[2] + (end[2] - start[2]) * t
    ]);
  }
  
  const length = Math.hypot(end[0] - start[0], end[2] - start[2]);
  const angle = Math.atan2(end[2] - start[2], end[0] - start[0]);
  
  return (
    <group>
      {posts.map((pos, i) => (
        <mesh key={`post-${i}`} position={[pos[0], 0.18, pos[2]]}>
          <cylinderGeometry args={[0.025, 0.035, 0.36, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.95} />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh 
        position={[(start[0] + end[0]) / 2, 0.3, (start[2] + end[2]) / 2]}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry args={[length, 0.04, 0.04]} />
        <meshStandardMaterial color="#92400e" roughness={0.95} />
      </mesh>
      {/* Bottom rail */}
      <mesh 
        position={[(start[0] + end[0]) / 2, 0.12, (start[2] + end[2]) / 2]}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry args={[length, 0.04, 0.04]} />
        <meshStandardMaterial color="#92400e" roughness={0.95} />
      </mesh>
    </group>
  );
}

// Water well
export function Well({ position = [0, 0, 0] }) {
  const bucketRef = useRef();
  const ropeRef = useRef();
  
  useFrame((state) => {
    if (bucketRef.current) {
      const swing = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
      bucketRef.current.position.y = 0.35 + swing;
      bucketRef.current.rotation.z = swing * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Stone base */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.28, 0.35, 0.36, 12]} />
        <meshStandardMaterial color="#78716c" roughness={1} />
      </mesh>
      {/* Stone texture */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[Math.cos(i * 0.8) * 0.3, 0.1 + (i % 3) * 0.1, Math.sin(i * 0.8) * 0.3]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#a8a29e" roughness={1} />
        </mesh>
      ))}
      
      {/* Water */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 12]} />
        <meshStandardMaterial color="#0ea5e9" transparent opacity={0.8} roughness={0.1} metalness={0.3} />
      </mesh>
      
      {/* Support posts */}
      <mesh position={[0.22, 0.55, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.75, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.95} />
      </mesh>
      <mesh position={[-0.22, 0.55, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.75, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.95} />
      </mesh>
      
      {/* Top beam */}
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.55, 0.05, 0.05]} />
        <meshStandardMaterial color="#78350f" roughness={0.95} />
      </mesh>
      
      {/* Crank handle */}
      <mesh position={[0.3, 0.85, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.12, 6]} />
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Rope */}
      <mesh ref={ropeRef} position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.5, 4]} />
        <meshStandardMaterial color="#a3a3a3" roughness={1} />
      </mesh>
      
      {/* Bucket */}
      <group ref={bucketRef} position={[0, 0.35, 0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.05, 0.1, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.055, 0.045, 0.08, 8]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.6} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// Tree with leaves
export function Tree({ position = [0, 0, 0], type = 'oak' }) {
  const leavesRef = useRef();
  
  useFrame((state) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.04;
      leavesRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });

  if (type === 'pine') {
    return (
      <group position={position}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.06, 0.1, 0.9, 8]} />
          <meshStandardMaterial color="#5c4033" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <coneGeometry args={[0.45, 0.55, 8]} />
          <meshStandardMaterial color="#166534" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <coneGeometry args={[0.35, 0.5, 8]} />
          <meshStandardMaterial color="#15803d" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.45, 0]}>
          <coneGeometry args={[0.25, 0.45, 8]} />
          <meshStandardMaterial color="#22c55e" roughness={0.8} />
        </mesh>
      </group>
    );
  }
  
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.7, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.95} />
      </mesh>
      <group ref={leavesRef} position={[0, 0.85, 0]}>
        <mesh>
          <dodecahedronGeometry args={[0.45, 1]} />
          <meshStandardMaterial color="#22c55e" flatShading roughness={0.8} />
        </mesh>
        <mesh position={[0.25, 0.15, 0.12]}>
          <dodecahedronGeometry args={[0.3, 1]} />
          <meshStandardMaterial color="#16a34a" flatShading roughness={0.8} />
        </mesh>
        <mesh position={[-0.2, 0.12, -0.15]}>
          <dodecahedronGeometry args={[0.35, 1]} />
          <meshStandardMaterial color="#15803d" flatShading roughness={0.8} />
        </mesh>
        <mesh position={[0.1, 0.3, -0.1]}>
          <dodecahedronGeometry args={[0.25, 1]} />
          <meshStandardMaterial color="#4ade80" flatShading roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
