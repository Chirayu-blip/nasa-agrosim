import React, { useState, useRef, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Sky, 
  Html, 
  Environment, 
  ContactShadows,
  Grid,
  Sparkles,
  Float
} from '@react-three/drei';
import * as THREE from 'three';

import { 
  WheatCrop, CornCrop, RiceCrop, SoybeanCrop, TomatoCrop, PotatoCrop, EmptyPlot 
} from './CropModels';
import { WeatherSystem } from './WeatherEffects';
import { Farmer, Chicken, Cow, Tractor, Barn, Windmill, Fence, Well, Tree } from './FarmObjects';

// Ground with grass texture effect
function Ground({ isNight }) {
  const groundRef = useRef();
  
  return (
    <group>
      {/* Main ground */}
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[50, 50, 50, 50]} />
        <meshStandardMaterial 
          color={isNight ? "#1a3d1a" : "#4ade80"} 
          roughness={0.95}
          metalness={0}
        />
      </mesh>
      
      {/* Grass patches for texture */}
      {useMemo(() => (
        Array.from({ length: 200 }).map((_, i) => {
          const x = (Math.random() - 0.5) * 40;
          const z = (Math.random() - 0.5) * 40;
          // Avoid placing in farm area
          if (Math.abs(x) < 4 && Math.abs(z) < 4) return null;
          return (
            <mesh key={i} position={[x, 0.02, z]} rotation={[0, Math.random() * Math.PI, 0]}>
              <coneGeometry args={[0.03, 0.1, 3]} />
              <meshStandardMaterial color={isNight ? "#166534" : "#22c55e"} />
            </mesh>
          );
        })
      ), [isNight])}
      
      {/* Dirt path to farm */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 5]}>
        <planeGeometry args={[1.5, 8]} />
        <meshStandardMaterial color="#92400e" roughness={1} />
      </mesh>
      
      {/* Path texture */}
      {useMemo(() => (
        Array.from({ length: 20 }).map((_, i) => (
          <mesh key={i} position={[(Math.random() - 0.5) * 1.2, 0.001, 2 + i * 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.08 + Math.random() * 0.06, 6]} />
            <meshStandardMaterial color="#78350f" roughness={1} />
          </mesh>
        ))
      ), [])}
    </group>
  );
}

// Farm plot grid - the main planting area with IMPROVED click detection
function PlotGrid({ plots, selectedCrop, onPlotClick, onHarvest, selectedPlot }) {
  const spacing = 0.9;
  const startX = -((Math.sqrt(plots.length) - 1) * spacing) / 2;
  const cols = Math.ceil(Math.sqrt(plots.length));
  
  return (
    <group position={[0, 0, 0]}>
      {/* Farm area base - raised wooden platform */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[cols * spacing + 1, 0.08, cols * spacing + 1]} />
        <meshStandardMaterial color="#78350f" roughness={0.95} />
      </mesh>
      
      {/* Corner posts */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([xDir, zDir], i) => (
        <mesh key={i} position={[xDir * (cols * spacing / 2 + 0.3), 0.15, zDir * (cols * spacing / 2 + 0.3)]}>
          <cylinderGeometry args={[0.05, 0.06, 0.25, 8]} />
          <meshStandardMaterial color="#5c4033" roughness={0.95} />
        </mesh>
      ))}
      
      {plots.map((plot, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = startX + col * spacing;
        const z = startX + row * spacing;
        const isSelected = selectedPlot === index;
        
        // Check if plot has a crop - backend uses crop_id, status
        const hasCrop = plot.crop_id || plot.crop_type || plot.cropType || (plot.status && plot.status !== 'empty');
        
        return (
          <group key={plot.id || index} position={[x, 0.08, z]}>
            {/* Selection indicator */}
            {isSelected && (
              <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.35, 0.42, 32]} />
                <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
              </mesh>
            )}
            
            {hasCrop ? (
              <PlantedCrop 
                plot={{ 
                  ...plot, 
                  cropType: plot.crop_id || plot.crop_type || plot.cropType || 'wheat',
                  plantedAt: plot.planted_at || plot.plantedAt || Date.now() - (plot.growth_progress || 0) * 100,
                  growthTime: plot.growth_days || 30,
                  growth_stage: plot.growth_progress || 0
                }} 
                onClick={() => onPlotClick(index)}  // Select the plot to show action panel
              />
            ) : (
              <EmptyPlot 
                onClick={() => onPlotClick(index)} 
                selectedCrop={selectedCrop}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

// Component for planted crops
function PlantedCrop({ plot, onClick }) {
  const CropComponents = {
    wheat: WheatCrop,
    corn: CornCrop,
    rice: RiceCrop,
    soybean: SoybeanCrop,
    tomato: TomatoCrop,
    potato: PotatoCrop
  };
  
  const cropType = (plot.cropType || plot.crop_type || 'wheat').toLowerCase();
  const CropComponent = CropComponents[cropType] || WheatCrop;
  
  // Calculate growth - support both time-based and stage-based
  let growthPercent, growthStage, isReady;
  
  if (plot.growth_stage !== undefined) {
    // Game state provides growth_stage directly (0-100)
    growthPercent = (plot.growth_stage || 0) / 100;
    growthStage = Math.floor(growthPercent * 4);
    isReady = plot.ready_to_harvest || growthPercent >= 1;
  } else {
    // Calculate from planted time
    growthPercent = Math.min(1, (Date.now() - (plot.plantedAt || Date.now())) / ((plot.growthTime || 30) * 1000));
    growthStage = Math.floor(growthPercent * 4);
    isReady = growthPercent >= 1;
  }
  
  return (
    <group>
      {/* Invisible clickable area for planted crops */}
      <mesh 
        position={[0, 0.3, 0]}
        onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[0.7, 0.6, 0.7]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      
      <CropComponent growthStage={growthStage} />
      
      {/* Progress indicator */}
      {!isReady && (
        <Html position={[0, 0.6, 0]} center>
          <div className="bg-black/70 rounded-full px-2 py-1 text-xs text-white whitespace-nowrap">
            {Math.floor(growthPercent * 100)}%
          </div>
        </Html>
      )}
      
      {/* Harvest indicator */}
      {isReady && (
        <>
          <Float speed={4} rotationIntensity={0} floatIntensity={0.3}>
            <Html position={[0, 0.8, 0]} center>
              <div className="bg-green-500 text-white rounded-lg px-3 py-1 text-sm font-bold animate-pulse shadow-lg cursor-pointer">
                🌾 HARVEST
              </div>
            </Html>
          </Float>
          {/* Sparkle effect for ready crops */}
          <Sparkles count={20} scale={0.8} size={2} speed={0.5} color="#fbbf24" />
        </>
      )}
    </group>
  );
}

// Scene lighting based on time of day
function SceneLighting({ isNight, weather }) {
  const isStormy = weather === 'storm' || weather === 'rainy';
  
  return (
    <>
      {/* Ambient light - always present */}
      <ambientLight intensity={isNight ? 0.15 : (isStormy ? 0.4 : 0.6)} />
      
      {/* Main directional light (sun/moon) */}
      <directionalLight
        position={isNight ? [5, 10, -5] : [10, 15, 5]}
        intensity={isNight ? 0.3 : (isStormy ? 0.5 : 1.2)}
        color={isNight ? "#a5b4fc" : (isStormy ? "#94a3b8" : "#fff7ed")}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      
      {/* Fill light */}
      <directionalLight
        position={[-8, 8, -8]}
        intensity={isNight ? 0.05 : 0.3}
        color={isNight ? "#6366f1" : "#fef3c7"}
      />
      
      {/* Hemisphere light for natural outdoor feel */}
      <hemisphereLight
        args={[
          isNight ? "#1e1b4b" : "#87ceeb",
          isNight ? "#1a1a2e" : "#4ade80",
          isNight ? 0.2 : 0.5
        ]}
      />
      
      {/* Point light near barn for warm glow at night */}
      {isNight && (
        <pointLight position={[-6, 1.5, 3]} intensity={0.8} color="#fbbf24" distance={5} />
      )}
    </>
  );
}

// Main 3D Farm World component
export default function Farm3DWorld({ 
  // Support both direct props and gameState prop
  gameState,
  plots: directPlots, 
  selectedCrop, 
  onPlotClick, 
  onHarvest,
  selectedPlot,
  lastAction,
  weather: directWeather = 'sunny',
  timeOfDay = 'day',
  isNight: directIsNight = false,
  money: directMoney = 0,
  day: directDay = 1
}) {
  const [cameraPosition, setCameraPosition] = useState([8, 8, 8]);
  const [localSelectedCrop, setLocalSelectedCrop] = useState(null);
  
  // Extract data from gameState or use direct props
  const plots = gameState?.plots || directPlots || Array(9).fill({ cropType: null });
  const money = gameState?.budget || directMoney;
  const day = gameState?.current_day || directDay;
  const weather = directWeather === 'stormy' ? 'storm' : directWeather;
  const isNight = timeOfDay === 'night' || directIsNight;
  
  // Handle plot click - either use provided handler or internal state
  const handlePlotClick = (index) => {
    if (onPlotClick) {
      onPlotClick(index);
    }
  };
  
  // Handle harvest
  const handleHarvest = (index) => {
    if (onHarvest) {
      onHarvest(index);
    } else if (onPlotClick) {
      // If no harvest handler, use plot click which opens action panel
      onPlotClick(index);
    }
  };
  
  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={[isNight ? '#0f172a' : '#87ceeb']} />
        
        <Suspense fallback={null}>
          {/* Sky */}
          {!isNight && weather !== 'storm' && (
            <Sky 
              sunPosition={weather === 'rainy' ? [0, 1, 0] : [100, 50, 100]} 
              turbidity={weather === 'rainy' ? 20 : 8}
              rayleigh={weather === 'rainy' ? 4 : 2}
              mieCoefficient={0.005}
              mieDirectionalG={0.8}
            />
          )}
          
          {/* Lighting */}
          <SceneLighting isNight={isNight} weather={weather} />
          
          {/* Contact shadows for realism */}
          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.4}
            scale={30}
            blur={2}
            far={10}
            color={isNight ? "#1e1b4b" : "#1f2937"}
          />
          
          {/* Weather effects */}
          <WeatherSystem weather={weather} isNight={isNight} />
          
          {/* Ground */}
          <Ground isNight={isNight} />
          
          {/* Farm plots - the main planting area */}
          <PlotGrid 
            plots={plots}
            selectedCrop={selectedCrop || localSelectedCrop}
            onPlotClick={handlePlotClick}
            onHarvest={handleHarvest}
            selectedPlot={selectedPlot}
          />
          
          {/* Farm decorations */}
          <Farmer position={[-8, 0, -8]} isWorking={selectedCrop !== null} />
          
          <Barn position={[-6, 0, 3]} />
          <Windmill position={[7, 0, -5]} />
          <Well position={[4, 0, 3]} />
          <Tractor position={[-4, 0, -4]} />
          
          {/* Animals */}
          <Chicken position={[3.5, 0, -2]} />
          <Chicken position={[4.2, 0, -1.5]} />
          <Chicken position={[3, 0, -2.5]} />
          <Cow position={[-7, 0, -4]} />
          <Cow position={[-8.5, 0, -5]} />
          
          {/* Trees */}
          <Tree position={[8, 0, 6]} type="oak" />
          <Tree position={[-9, 0, 7]} type="pine" />
          <Tree position={[10, 0, -3]} type="oak" />
          <Tree position={[-10, 0, -6]} type="pine" />
          <Tree position={[9, 0, 0]} type="oak" />
          
          {/* Fences */}
          <Fence start={[-6, 0, 6]} end={[-2, 0, 6]} segments={4} />
          <Fence start={[-6, 0, 6]} end={[-6, 0, 1]} segments={4} />
          <Fence start={[5, 0, 5]} end={[10, 0, 5]} segments={5} />
          
          {/* Camera controls */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={25}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 6}
            target={[0, 0, 0]}
            dampingFactor={0.05}
            enableDamping={true}
          />
        </Suspense>
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="text-lg font-bold">💰 ${money}</div>
          <div className="text-sm opacity-80">Day {day}</div>
        </div>
        
        {selectedCrop && (
          <div className="bg-green-600/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white animate-pulse">
            <div className="text-sm font-bold">🌱 Planting: {selectedCrop}</div>
            <div className="text-xs">Click on empty plots!</div>
          </div>
        )}
      </div>
      
      {/* Weather indicator */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white pointer-events-none">
        <div className="text-2xl">
          {weather === 'sunny' && '☀️'}
          {weather === 'cloudy' && '⛅'}
          {weather === 'rainy' && '🌧️'}
          {weather === 'storm' && '⛈️'}
        </div>
        <div className="text-sm">{isNight ? '🌙 Night' : '☀️ Day'}</div>
      </div>
      
      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm pointer-events-none">
        <span className="opacity-80">🖱️ Left click + drag to rotate • Scroll to zoom • Right click + drag to pan</span>
      </div>
    </div>
  );
}
