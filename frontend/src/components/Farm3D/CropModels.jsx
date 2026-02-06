import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Wheat - Golden stalks swaying realistically
export function WheatCrop({ position, growth = 1, onClick }) {
  const groupRef = useRef();
  const stalksCount = 16;
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child.type === 'Group') {
          const windStrength = 0.08;
          child.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + i * 0.3) * windStrength;
          child.rotation.x = Math.cos(state.clock.elapsedTime * 1.2 + i * 0.2) * windStrength * 0.5;
        }
      });
    }
  });

  const height = 0.4 + growth * 0.8;
  const stalkColor = growth < 0.4 ? '#22c55e' : growth < 0.7 ? '#84cc16' : '#d4a017';
  const grainColor = growth > 0.8 ? '#f59e0b' : '#c9a227';

  return (
    <group position={position} ref={groupRef} onClick={onClick}>
      {Array.from({ length: stalksCount }).map((_, i) => {
        const angle = (i / stalksCount) * Math.PI * 2;
        const radius = 0.12 + Math.random() * 0.08;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const heightVariation = 0.85 + Math.random() * 0.3;
        
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, (height * heightVariation) / 2, 0]}>
              <cylinderGeometry args={[0.008, 0.012, height * heightVariation, 6]} />
              <meshStandardMaterial color={stalkColor} roughness={0.8} />
            </mesh>
            {growth > 0.5 && (
              <group position={[0, height * heightVariation + 0.06, 0]}>
                <mesh>
                  <capsuleGeometry args={[0.02, 0.1 * growth, 4, 8]} />
                  <meshStandardMaterial color={grainColor} roughness={0.6} />
                </mesh>
              </group>
            )}
            {growth > 0.2 && (
              <mesh position={[0.02, height * 0.4, 0]} rotation={[0, i * 0.5, 0.6]}>
                <boxGeometry args={[0.15, 0.008, 0.02]} />
                <meshStandardMaterial color="#65a30d" side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// Corn - Tall stalks with detailed cobs
export function CornCrop({ position, growth = 1, onClick }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
    }
  });

  const height = 0.6 + growth * 1.8;
  const leafColor = growth < 0.3 ? '#22c55e' : '#166534';

  return (
    <group position={position} ref={groupRef} onClick={onClick}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.04, height, 8]} />
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </mesh>
      
      {growth > 0.2 && Array.from({ length: 8 }).map((_, i) => {
        const leafHeight = 0.15 + (i * height / 10);
        const angle = (i * 45) * (Math.PI / 180);
        const leafLength = 0.25 + growth * 0.35;
        
        return (
          <group key={i} position={[0, leafHeight, 0]} rotation={[0, angle, 0]}>
            <mesh position={[leafLength / 2, 0, 0]} rotation={[0, 0, 0.4 + i * 0.05]}>
              <boxGeometry args={[leafLength, 0.008, 0.06 + growth * 0.03]} />
              <meshStandardMaterial color={leafColor} side={THREE.DoubleSide} roughness={0.7} />
            </mesh>
          </group>
        );
      })}
      
      {growth > 0.6 && (
        <group position={[0.06, height * 0.55, 0]} rotation={[0, 0, 0.25]}>
          <mesh>
            <capsuleGeometry args={[0.04, 0.14, 8, 12]} />
            <meshStandardMaterial color={growth > 0.9 ? '#fbbf24' : '#a3e635'} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.1, 0]} rotation={[0.2, 0, 0]}>
            <coneGeometry args={[0.05, 0.08, 6]} />
            <meshStandardMaterial color="#84cc16" />
          </mesh>
        </group>
      )}
      
      {growth > 0.7 && (
        <group position={[0, height + 0.05, 0]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} rotation={[0.4, i * 1, 0.3]}>
              <cylinderGeometry args={[0.004, 0.002, 0.12, 4]} />
              <meshStandardMaterial color="#f5d742" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

// Rice - Paddy with water
export function RiceCrop({ position, growth = 1, onClick }) {
  const groupRef = useRef();
  const waterRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child.type === 'Group') {
          child.rotation.z = Math.sin(state.clock.elapsedTime * 2.5 + i * 0.4) * 0.12;
        }
      });
    }
    if (waterRef.current) {
      waterRef.current.material.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const height = 0.25 + growth * 0.55;
  const color = growth < 0.5 ? '#4ade80' : growth < 0.8 ? '#84cc16' : '#a3e635';

  return (
    <group position={position} onClick={onClick}>
      <mesh ref={waterRef} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 24]} />
        <meshStandardMaterial color="#0ea5e9" transparent opacity={0.4} roughness={0.1} metalness={0.3} />
      </mesh>
      
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.3, 24]} />
        <meshStandardMaterial color="#78350f" roughness={1} />
      </mesh>
      
      <group ref={groupRef}>
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const radius = 0.08 + Math.random() * 0.12;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          
          return (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, height / 2, 0]}>
                <cylinderGeometry args={[0.006, 0.01, height, 4]} />
                <meshStandardMaterial color={color} roughness={0.7} />
              </mesh>
              {growth > 0.6 && (
                <group position={[0, height, 0]} rotation={[0.5 + growth * 0.3, i * 0.3, 0]}>
                  <mesh position={[0.03, -0.02, 0]}>
                    <capsuleGeometry args={[0.012, 0.04, 4, 6]} />
                    <meshStandardMaterial color="#fef9c3" roughness={0.6} />
                  </mesh>
                </group>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}

// Soybean - Bushy plant
export function SoybeanCrop({ position, growth = 1, onClick }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.03;
    }
  });

  const height = 0.35 + growth * 0.5;
  
  return (
    <group position={position} ref={groupRef} onClick={onClick}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.025, height, 6]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
      
      {growth > 0.2 && Array.from({ length: 6 }).map((_, i) => {
        const y = 0.12 + i * (height / 7);
        const angle = i * 60 * (Math.PI / 180);
        
        return (
          <group key={i} position={[0, y, 0]} rotation={[0, angle, 0]}>
            {growth > 0.3 && (
              <group position={[0.1, 0.02, 0]}>
                {[0, -30, 30].map((deg, j) => (
                  <mesh key={j} rotation={[0.2, deg * Math.PI / 180, 0.1]}>
                    <sphereGeometry args={[0.035 + growth * 0.015, 8, 6]} />
                    <meshStandardMaterial color="#22c55e" roughness={0.6} flatShading />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        );
      })}
      
      {growth > 0.7 && Array.from({ length: 6 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[Math.cos(i) * 0.08, 0.15 + i * 0.08, Math.sin(i) * 0.08]}
          rotation={[0.3, i * 0.8, 0.2]}
        >
          <capsuleGeometry args={[0.015, 0.05, 4, 6]} />
          <meshStandardMaterial color={growth > 0.9 ? '#a3a042' : '#84cc16'} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Tomato - Vine with fruits
export function TomatoCrop({ position, growth = 1, onClick }) {
  const height = 0.5 + growth * 0.7;
  
  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, height / 2 + 0.15, 0]}>
        <cylinderGeometry args={[0.012, 0.012, height + 0.4, 6]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
      
      <mesh position={[0.025, height / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.02, height, 6]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
      
      {growth > 0.2 && Array.from({ length: 7 }).map((_, i) => (
        <mesh 
          key={i}
          position={[0.04 * (i % 2 === 0 ? 1 : -1), 0.12 + i * 0.1, 0.03]}
          rotation={[0.2, 0, i % 2 === 0 ? 0.4 : -0.4]}
        >
          <dodecahedronGeometry args={[0.04 + growth * 0.02, 0]} />
          <meshStandardMaterial color="#22c55e" flatShading roughness={0.7} />
        </mesh>
      ))}
      
      {growth > 0.5 && Array.from({ length: 5 }).map((_, i) => {
        const tomatoGrowth = Math.max(0, (growth - 0.5) * 2 - i * 0.15);
        const tomatoColor = tomatoGrowth > 0.8 ? '#dc2626' : tomatoGrowth > 0.5 ? '#f97316' : '#84cc16';
        
        return (
          <group key={i} position={[0.08 * (i % 2 === 0 ? 1 : -1), 0.2 + i * 0.12, 0.06]}>
            <mesh>
              <sphereGeometry args={[0.025 + tomatoGrowth * 0.03, 16, 16]} />
              <meshStandardMaterial color={tomatoColor} roughness={0.3} metalness={0.1} />
            </mesh>
            <mesh position={[0, 0.035, 0]}>
              <coneGeometry args={[0.015, 0.02, 5]} />
              <meshStandardMaterial color="#15803d" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// Potato - Underground crop
export function PotatoCrop({ position, growth = 1, onClick }) {
  const leavesRef = useRef();
  
  useFrame((state) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
    }
  });

  const height = 0.25 + growth * 0.4;
  
  return (
    <group position={position} onClick={onClick}>
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#92400e" roughness={1} />
      </mesh>
      
      {growth > 0.5 && Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.12, 0.03, Math.sin(angle) * 0.12 + 0.05]}>
            <sphereGeometry args={[0.035 + growth * 0.02, 10, 10]} />
            <meshStandardMaterial color="#d4a574" roughness={0.9} />
          </mesh>
        );
      })}
      
      <group ref={leavesRef} position={[0, 0.1, 0]}>
        {growth > 0.15 && Array.from({ length: 5 }).map((_, i) => {
          const angle = (i / 5) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(angle) * 0.04, 0, Math.sin(angle) * 0.04]}>
              <mesh position={[0, height / 2, 0]} rotation={[0.15, angle, 0]}>
                <cylinderGeometry args={[0.008, 0.015, height, 4]} />
                <meshStandardMaterial color="#166534" roughness={0.8} />
              </mesh>
              {growth > 0.3 && (
                <mesh position={[Math.cos(angle) * 0.06, height * 0.8, Math.sin(angle) * 0.06]}>
                  <dodecahedronGeometry args={[0.04, 0]} />
                  <meshStandardMaterial color="#22c55e" flatShading roughness={0.7} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
      
      {growth > 0.75 && (
        <mesh position={[0, height + 0.15, 0]}>
          <dodecahedronGeometry args={[0.025, 0]} />
          <meshStandardMaterial color="#e879f9" />
        </mesh>
      )}
    </group>
  );
}

// Improved Empty Plot with MUCH better click detection
export function EmptyPlot({ position, onClick, selectedCrop }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.position.y = 0.03 + Math.sin(state.clock.elapsedTime * 3) * 0.02;
    }
  });

  return (
    <group position={position}>
      {/* LARGE invisible clickable area - bigger for easy clicking */}
      <mesh 
        position={[0, 0.2, 0]}
        onClick={(e) => { 
          e.stopPropagation(); 
          console.log('Empty plot clicked!'); 
          onClick && onClick(e); 
        }}
        onPointerOver={(e) => { 
          e.stopPropagation(); 
          setHovered(true); 
          document.body.style.cursor = 'pointer'; 
        }}
        onPointerOut={() => { 
          setHovered(false); 
          document.body.style.cursor = 'auto'; 
        }}
      >
        <boxGeometry args={[0.8, 0.4, 0.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      
      {/* Visible soil */}
      <mesh ref={meshRef} position={[0, 0.025, 0]}>
        <boxGeometry args={[0.52, 0.05, 0.52]} />
        <meshStandardMaterial 
          color={hovered ? "#a3612e" : "#5c2d0e"} 
          roughness={1}
        />
      </mesh>
      
      {/* Soil furrows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 0.055, -0.18 + i * 0.09]}>
          <boxGeometry args={[0.44, 0.018, 0.04]} />
          <meshStandardMaterial color={hovered ? "#8b4513" : "#3d1f0d"} roughness={1} />
        </mesh>
      ))}
      
      {/* Always show "plant here" indicator */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.24, 6]} />
        <meshBasicMaterial color={hovered ? "#22c55e" : "#4ade80"} transparent opacity={hovered ? 1 : 0.5} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Hover effects */}
      {hovered && (
        <>
          {/* Bright glow ring */}
          <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.26, 0.34, 32]} />
            <meshBasicMaterial color="#22c55e" transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          
          {/* Large plus sign */}
          <group position={[0, 0.15, 0]}>
            <mesh>
              <boxGeometry args={[0.22, 0.04, 0.07]} />
              <meshBasicMaterial color="#16a34a" />
            </mesh>
            <mesh>
              <boxGeometry args={[0.07, 0.04, 0.22]} />
              <meshBasicMaterial color="#16a34a" />
            </mesh>
          </group>
          
          {/* Floating text label */}
          <Html position={[0, 0.4, 0]} center>
            <div className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-xl font-bold text-sm whitespace-nowrap animate-bounce">
              🌱 Click to Plant!
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

// Get crop component by type
export function getCropComponent(cropType) {
  const crops = {
    wheat: WheatCrop,
    corn: CornCrop,
    rice: RiceCrop,
    soybean: SoybeanCrop,
    tomato: TomatoCrop,
    potato: PotatoCrop
  };
  return crops[cropType?.toLowerCase()] || WheatCrop;
}
