import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Realistic animated clouds
export function Cloud({ position, scale = 1, speed = 0.02 }) {
  const cloudRef = useRef();
  const initialX = position[0];
  
  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.position.x = initialX + Math.sin(state.clock.elapsedTime * speed) * 5;
    }
  });

  return (
    <group ref={cloudRef} position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.95} roughness={1} />
      </mesh>
      <mesh position={[0.7, 0.1, 0]}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.95} roughness={1} />
      </mesh>
      <mesh position={[-0.6, 0.15, 0]}>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color="#f8fafc" transparent opacity={0.95} roughness={1} />
      </mesh>
      <mesh position={[0.3, 0.4, 0]}>
        <sphereGeometry args={[0.45, 12, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.95} roughness={1} />
      </mesh>
      <mesh position={[-0.3, 0.3, 0.2]}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color="#f1f5f9" transparent opacity={0.9} roughness={1} />
      </mesh>
    </group>
  );
}

// Realistic rain with splash effects
export function Rain({ intensity = 100, heavy = false }) {
  const rainRef = useRef();
  
  const raindrops = useMemo(() => {
    return Array.from({ length: intensity }).map((_, i) => ({
      x: (Math.random() - 0.5) * 25,
      y: Math.random() * 12,
      z: (Math.random() - 0.5) * 25,
      speed: 0.15 + Math.random() * 0.1,
      length: heavy ? 0.4 : 0.25
    }));
  }, [intensity, heavy]);

  useFrame(() => {
    if (rainRef.current) {
      rainRef.current.children.forEach((drop, i) => {
        drop.position.y -= raindrops[i].speed;
        if (drop.position.y < 0) {
          drop.position.y = 12;
          drop.position.x = (Math.random() - 0.5) * 25;
          drop.position.z = (Math.random() - 0.5) * 25;
        }
      });
    }
  });

  return (
    <group ref={rainRef}>
      {raindrops.map((drop, i) => (
        <mesh key={i} position={[drop.x, drop.y, drop.z]}>
          <cylinderGeometry args={[0.008, 0.008, drop.length, 4]} />
          <meshBasicMaterial color="#93c5fd" transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Storm clouds with lightning
export function StormCloud({ position, scale = 1.5 }) {
  const cloudRef = useRef();
  const lightningRef = useRef();
  
  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.position.x += 0.003;
      if (cloudRef.current.position.x > 15) {
        cloudRef.current.position.x = -15;
      }
    }
    
    // Random lightning flash
    if (lightningRef.current) {
      if (Math.random() > 0.995) {
        lightningRef.current.visible = true;
        setTimeout(() => {
          if (lightningRef.current) lightningRef.current.visible = false;
        }, 100);
      }
    }
  });

  return (
    <group ref={cloudRef} position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#374151" transparent opacity={0.98} roughness={1} />
      </mesh>
      <mesh position={[1, 0.1, 0]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial color="#4b5563" transparent opacity={0.98} roughness={1} />
      </mesh>
      <mesh position={[-0.8, 0.1, 0.2]}>
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshStandardMaterial color="#374151" transparent opacity={0.98} roughness={1} />
      </mesh>
      <mesh position={[0.5, 0.5, 0]}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#1f2937" transparent opacity={0.95} roughness={1} />
      </mesh>
      
      {/* Lightning bolt */}
      <group ref={lightningRef} visible={false} position={[0, -1, 0]}>
        <mesh>
          <boxGeometry args={[0.05, 2, 0.05]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <pointLight color="#fef08a" intensity={100} distance={20} />
      </group>
    </group>
  );
}

// Detailed sun with god rays
export function Sun({ position = [10, 12, 5], intensity = 1 }) {
  const sunRef = useRef();
  const raysRef = useRef();
  
  useFrame((state) => {
    if (raysRef.current) {
      raysRef.current.rotation.z += 0.002;
    }
  });

  return (
    <group ref={sunRef} position={position}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#fcd34d" />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[1.7, 32, 32]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.4} />
      </mesh>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#fef9c3" transparent opacity={0.2} />
      </mesh>
      {/* Rotating rays */}
      <group ref={raysRef}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh 
            key={i} 
            position={[Math.cos((i / 12) * Math.PI * 2) * 2.5, Math.sin((i / 12) * Math.PI * 2) * 2.5, 0]}
            rotation={[0, 0, (i / 12) * Math.PI * 2]}
          >
            <coneGeometry args={[0.15, 1, 4]} />
            <meshBasicMaterial color="#fcd34d" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      {/* Light source */}
      <pointLight intensity={intensity * 3} distance={60} color="#fff7ed" />
    </group>
  );
}

// Realistic moon with craters
export function Moon({ position = [-8, 10, -5] }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial 
          color="#e5e7eb" 
          emissive="#d1d5db" 
          emissiveIntensity={0.2}
          roughness={0.9}
        />
      </mesh>
      {/* Craters */}
      {[[0.4, 0.3, 0.9, 0.15], [-0.5, -0.2, 0.85, 0.12], [0.1, -0.5, 0.9, 0.1], [-0.3, 0.5, 0.85, 0.08]].map((crater, i) => (
        <mesh key={i} position={[crater[0], crater[1], crater[2]]}>
          <sphereGeometry args={[crater[3], 12, 12]} />
          <meshStandardMaterial color="#9ca3af" roughness={1} />
        </mesh>
      ))}
      {/* Glow */}
      <mesh>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#f3f4f6" transparent opacity={0.1} />
      </mesh>
      <pointLight intensity={0.8} distance={40} color="#e5e7eb" />
    </group>
  );
}

// Twinkling stars
export function Stars({ count = 300 }) {
  const starsRef = useRef();
  
  const starData = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      x: (Math.random() - 0.5) * 120,
      y: 15 + Math.random() * 35,
      z: (Math.random() - 0.5) * 120,
      size: 0.02 + Math.random() * 0.06,
      twinkleSpeed: 1 + Math.random() * 3,
      twinkleOffset: Math.random() * Math.PI * 2
    }));
  }, [count]);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.children.forEach((star, i) => {
        const data = starData[i];
        star.material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * data.twinkleSpeed + data.twinkleOffset) * 0.4;
        star.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * data.twinkleSpeed + data.twinkleOffset) * 0.3);
      });
    }
  });

  return (
    <group ref={starsRef}>
      {starData.map((star, i) => (
        <mesh key={i} position={[star.x, star.y, star.z]}>
          <sphereGeometry args={[star.size, 4, 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Complete weather system
export function WeatherSystem({ weather = 'sunny', timeOfDay = 'day' }) {
  const isNight = timeOfDay === 'night';
  const isRaining = weather === 'rainy' || weather === 'stormy';
  const isStormy = weather === 'stormy';
  const isCloudy = weather === 'cloudy';
  
  return (
    <group>
      {/* Sun during day (not stormy) */}
      {!isNight && !isStormy && (
        <Sun intensity={isCloudy ? 0.5 : isRaining ? 0.3 : 1} position={[15, 18, 10]} />
      )}
      
      {/* Moon and stars at night */}
      {isNight && (
        <>
          <Moon position={[-10, 15, -8]} />
          <Stars count={400} />
        </>
      )}
      
      {/* Clouds for sunny/cloudy weather */}
      {!isStormy && (
        <>
          <Cloud position={[-8, 10, -5]} scale={1.2} speed={0.015} />
          <Cloud position={[5, 11, -8]} scale={0.9} speed={0.02} />
          <Cloud position={[12, 9, -3]} scale={1.1} speed={0.018} />
          {isCloudy && (
            <>
              <Cloud position={[-3, 8, -4]} scale={1.4} speed={0.012} />
              <Cloud position={[8, 9, -6]} scale={1.3} speed={0.016} />
              <Cloud position={[-12, 10, -5]} scale={1.0} speed={0.022} />
            </>
          )}
        </>
      )}
      
      {/* Storm clouds */}
      {isStormy && (
        <>
          <StormCloud position={[-6, 8, -3]} scale={1.8} />
          <StormCloud position={[3, 7, -4]} scale={2.2} />
          <StormCloud position={[10, 8, -2]} scale={1.6} />
          <StormCloud position={[-2, 9, -5]} scale={1.4} />
        </>
      )}
      
      {/* Rain */}
      {isRaining && <Rain intensity={isStormy ? 250 : 120} heavy={isStormy} />}
      
      {/* Fog for rain/storm */}
      {isRaining && (
        <fog attach="fog" args={[isStormy ? '#374151' : '#94a3b8', 10, 40]} />
      )}
    </group>
  );
}
