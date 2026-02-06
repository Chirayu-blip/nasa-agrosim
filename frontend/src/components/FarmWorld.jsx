import { useState, useEffect } from 'react'
import clsx from 'clsx'

// Crop growth stages with visual representations
const CROP_STAGES = {
  wheat: ['🌱', '🌿', '🌾', '🌾'],
  corn: ['🌱', '🌿', '🌽', '🌽'],
  rice: ['🌱', '🌿', '🌾', '🍚'],
  soybean: ['🌱', '🌿', '🫛', '🫘'],
  tomato: ['🌱', '🪴', '🍅', '🍅'],
  potato: ['🌱', '🌿', '🥔', '🥔'],
}

// Get growth stage (0-3) based on progress
const getGrowthStage = (progress) => {
  if (progress >= 100) return 3
  if (progress >= 60) return 2
  if (progress >= 30) return 1
  return 0
}

function FarmPlot2D({ plot, onAction, disabled, weather }) {
  const [showWaterEffect, setShowWaterEffect] = useState(false)
  const [showFertEffect, setShowFertEffect] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const cropStages = CROP_STAGES[plot.crop_id] || ['🌱', '🌿', '🌿', '🌿']
  const currentStage = getGrowthStage(plot.growth_progress)
  const cropEmoji = cropStages[currentStage]

  const handleWater = () => {
    setShowWaterEffect(true)
    setTimeout(() => setShowWaterEffect(false), 1000)
    onAction('water', plot.id)
  }

  const handleFertilize = () => {
    setShowFertEffect(true)
    setTimeout(() => setShowFertEffect(false), 1000)
    onAction('fertilize', plot.id)
  }

  // Soil color based on water level
  const getSoilColor = () => {
    if (plot.water_level > 70) return 'bg-amber-700'
    if (plot.water_level > 40) return 'bg-amber-600'
    if (plot.water_level > 20) return 'bg-amber-500'
    return 'bg-amber-400' // Dry soil
  }

  return (
    <div
      className={clsx(
        'relative w-full aspect-square rounded-lg overflow-hidden transition-all duration-300',
        'border-4',
        plot.status === 'ready' ? 'border-yellow-400 shadow-lg shadow-yellow-200' : 'border-amber-800',
        isHovered && 'scale-105 z-10',
        disabled && 'opacity-50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Soil Background */}
      <div className={clsx('absolute inset-0', getSoilColor())}>
        {/* Soil texture lines */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="absolute w-full h-px bg-amber-900" style={{ top: `${25 * (i + 1)}%` }} />
          ))}
        </div>
      </div>

      {/* Water Effect */}
      {showWaterEffect && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-fall"
              style={{
                left: `${Math.random() * 80 + 10}%`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            >
              💧
            </div>
          ))}
        </div>
      )}

      {/* Fertilizer Effect */}
      {showFertEffect && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-xl animate-sparkle"
              style={{
                left: `${Math.random() * 70 + 15}%`,
                top: `${Math.random() * 70 + 15}%`,
                animationDelay: `${Math.random() * 0.3}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      {/* Crop Display */}
      <div className="absolute inset-0 flex items-center justify-center">
        {plot.status === 'empty' ? (
          <button
            onClick={() => onAction('plant', plot.id)}
            disabled={disabled}
            className="w-full h-full flex items-center justify-center hover:bg-amber-500/30 transition-colors group"
          >
            <span className="text-4xl opacity-30 group-hover:opacity-70 transition-opacity">🌱</span>
          </button>
        ) : (
          <div className={clsx(
            'text-5xl transition-all',
            plot.status === 'growing' && 'animate-sway',
            plot.status === 'ready' && 'animate-bounce-slow'
          )}>
            {cropEmoji}
          </div>
        )}
      </div>

      {/* Health/Water Indicators */}
      {plot.status !== 'empty' && (
        <>
          {/* Water level bar */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/30">
            <div 
              className={clsx(
                'h-full transition-all',
                plot.water_level > 50 ? 'bg-blue-400' : plot.water_level > 25 ? 'bg-blue-300' : 'bg-red-400'
              )}
              style={{ width: `${plot.water_level}%` }}
            />
          </div>

          {/* Health indicator */}
          {plot.health < 50 && (
            <div className="absolute top-1 right-1 text-lg animate-pulse">⚠️</div>
          )}

          {/* Growth progress */}
          <div className="absolute top-1 left-1 bg-black/50 rounded px-1 text-xs text-white">
            {Math.round(plot.growth_progress)}%
          </div>
        </>
      )}

      {/* Hover Actions */}
      {isHovered && plot.status !== 'empty' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
          {plot.status === 'ready' ? (
            <button
              onClick={() => onAction('harvest', plot.id)}
              disabled={disabled}
              className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transform hover:scale-110 transition-all"
            >
              🌾 Harvest!
            </button>
          ) : (
            <>
              <button
                onClick={handleWater}
                disabled={disabled}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transform hover:scale-110 transition-all"
                title="Water ($10)"
              >
                💧
              </button>
              <button
                onClick={handleFertilize}
                disabled={disabled}
                className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transform hover:scale-110 transition-all"
                title="Fertilize ($50)"
              >
                ✨
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function FarmWorld({ plots, onAction, disabled, weather, season, dayTime }) {
  const [clouds, setClouds] = useState([])

  // Generate random clouds
  useEffect(() => {
    const newClouds = [...Array(5)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 30 + 40,
      speed: Math.random() * 20 + 30,
      delay: Math.random() * 10,
    }))
    setClouds(newClouds)
  }, [])

  // Sky color based on time/weather
  const getSkyGradient = () => {
    if (weather?.precipitation > 5) {
      return 'from-gray-400 to-gray-600' // Rainy
    }
    return 'from-sky-400 to-sky-200' // Sunny
  }

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
      {/* Sky */}
      <div className={clsx('absolute inset-0 bg-gradient-to-b', getSkyGradient())}>
        {/* Sun */}
        <div className="absolute top-4 right-8 w-16 h-16 bg-yellow-300 rounded-full shadow-lg shadow-yellow-200 animate-pulse-slow" />
        
        {/* Clouds */}
        {clouds.map(cloud => (
          <div
            key={cloud.id}
            className="absolute text-white opacity-80 animate-cloud"
            style={{
              top: `${cloud.id * 8 + 5}%`,
              fontSize: `${cloud.size}px`,
              animationDuration: `${cloud.speed}s`,
              animationDelay: `${cloud.delay}s`,
            }}
          >
            ☁️
          </div>
        ))}

        {/* Rain Effect */}
        {weather?.precipitation > 5 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute text-blue-300 animate-rain"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`
                }}
              >
                |
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ground/Farm Area */}
      <div className="relative pt-24 pb-4 px-4">
        {/* Distant Mountains */}
        <div className="absolute bottom-20 left-0 right-0 flex justify-center opacity-30">
          <span className="text-8xl">⛰️</span>
          <span className="text-6xl -ml-8">⛰️</span>
          <span className="text-7xl -ml-6">⛰️</span>
        </div>

        {/* Grass */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-600 to-green-500" />

        {/* Farm Grid */}
        <div className="relative grid grid-cols-3 gap-3 p-4 bg-green-700/50 rounded-xl backdrop-blur-sm border-4 border-green-800">
          {/* Farm Sign */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-700 px-4 py-1 rounded-t-lg border-2 border-amber-900 text-white font-bold text-sm">
            🌾 Your Farm 🌾
          </div>

          {plots?.map((plot) => (
            <FarmPlot2D
              key={plot.id}
              plot={plot}
              onAction={onAction}
              disabled={disabled}
              weather={weather}
            />
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-4 left-4 text-4xl animate-sway">🌻</div>
        <div className="absolute bottom-4 right-4 text-4xl animate-sway-reverse">🌻</div>
        <div className="absolute bottom-8 left-12 text-3xl">🌳</div>
        <div className="absolute bottom-8 right-12 text-3xl">🌳</div>
        
        {/* Farmer */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-4xl animate-bounce-slow">
          👨‍🌾
        </div>

        {/* Animals */}
        <div className="absolute bottom-4 left-24 text-2xl animate-walk">🐔</div>
        <div className="absolute bottom-6 right-24 text-2xl animate-walk-reverse">🐄</div>
      </div>

      {/* Season/Weather Indicator */}
      <div className="absolute top-2 left-2 bg-white/80 backdrop-blur rounded-lg px-3 py-1 flex items-center gap-2">
        <span className="text-lg">
          {season === 'spring' ? '🌸' : season === 'summer' ? '☀️' : season === 'fall' ? '🍂' : '❄️'}
        </span>
        <span className="text-sm font-medium capitalize">{season}</span>
      </div>

      {/* Temperature Display */}
      <div className="absolute top-2 right-2 bg-white/80 backdrop-blur rounded-lg px-3 py-1 flex items-center gap-2">
        <span className="text-lg">🌡️</span>
        <span className="text-sm font-medium">{weather?.temperature || 22}°C</span>
      </div>
    </div>
  )
}
