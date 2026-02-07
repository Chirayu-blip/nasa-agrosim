import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Sun, CloudRain, Droplets, Leaf, DollarSign, Calendar, 
  MapPin, Award, ArrowRight, Loader2, AlertCircle, 
  Maximize2, Minimize2, Sprout, Scissors, Moon, Clock, AlertTriangle
} from 'lucide-react'
import clsx from 'clsx'
import { gameApi, cropsApi, nasaApi, earlyWarningApi } from '../services/api'
import { Farm3DWorld } from '../components/Farm3D'
import WeatherPanel from '../components/WeatherPanel'
import CropSelector from '../components/CropSelector'
import EducationalPanel from '../components/EducationalPanel'

function GamePage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [selectedPlot, setSelectedPlot] = useState(null)
  const [showCropSelector, setShowCropSelector] = useState(false)
  const [actionFeedback, setActionFeedback] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState('day')
  const [weather, setWeather] = useState('sunny')
  const [lastAction, setLastAction] = useState(null)
  const [showTutorial, setShowTutorial] = useState(true)

  // Fetch game state
  const { data: gameState, isLoading, error } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => gameApi.getGame(gameId),
    enabled: !!gameId,
    refetchInterval: false,
  })

  // Fetch crops data
  const { data: crops } = useQuery({
    queryKey: ['crops'],
    queryFn: cropsApi.getAllCrops,
  })

  // Fetch early warning alerts 
  const { data: earlyWarnings } = useQuery({
    queryKey: ['earlyWarnings', gameState?.data?.location?.latitude, gameState?.data?.location?.longitude],
    queryFn: async () => {
      const loc = gameState?.data?.location
      if (!loc?.latitude || !loc?.longitude) return null
      const res = await earlyWarningApi.getAlerts(loc.latitude, loc.longitude)
      return res.data
    },
    enabled: !!gameState?.data?.location?.latitude,
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  })

  // Sync weather from game state - using NASA POWER API data
  useEffect(() => {
    if (gameState?.data?.weather_today) {
      const weatherData = gameState.data.weather_today
      const temp = weatherData.temperature || 20
      const rain = weatherData.precipitation || 0
      const humidity = weatherData.humidity || 50
      const windSpeed = weatherData.wind_speed || 5
      const cloudCover = weatherData.cloud_cover || weatherData.solar_radiation < 15 ? 80 : 30
      
      // Determine weather based on actual conditions
      if (rain > 10 || (rain > 5 && windSpeed > 15)) {
        setWeather('stormy')  // Heavy rain or windy rain = storm
      } else if (rain > 2 || humidity > 85) {
        setWeather('rainy')   // Light rain or very humid
      } else if (cloudCover > 60 || humidity > 70) {
        setWeather('cloudy')  // Overcast or humid
      } else {
        setWeather('sunny')   // Clear skies
      }
      
      console.log('Weather synced:', { temp, rain, humidity, windSpeed, weather })
    }
  }, [gameState])

  // Day/night cycle based on game day
  useEffect(() => {
    if (gameState?.data?.current_day) {
      // Alternate time of day for variety
      setTimeOfDay(gameState.data.current_day % 3 === 0 ? 'night' : 'day')
    }
  }, [gameState?.data?.current_day])

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: ({ action, plotId, cropId, amount }) => {
      console.log('Sending action to API:', { action, plot_id: plotId, crop_id: cropId, amount })
      return gameApi.performAction(gameId, { action, plot_id: plotId, crop_id: cropId, amount })
    },
    onSuccess: (response) => {
      console.log('Action response:', response.data)
      queryClient.invalidateQueries(['game', gameId])
      setActionFeedback(response.data)
      setLastAction(response.data.action || 'action')
      setTimeout(() => setActionFeedback(null), 3000)
      setTimeout(() => setLastAction(null), 1500)
    },
    onError: (error) => {
      console.error('Action error:', error)
      setActionFeedback({ success: false, message: error.message || 'Action failed' })
      setTimeout(() => setActionFeedback(null), 3000)
    }
  })

  // Advance day mutation
  const advanceDayMutation = useMutation({
    mutationFn: () => gameApi.advanceDay(gameId),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['game', gameId])
      if (response.data.events?.length > 0) {
        setActionFeedback({ 
          success: true, 
          message: response.data.events.join('\n') 
        })
        setTimeout(() => setActionFeedback(null), 5000)
      }
    },
  })

  // Handle plot click from 3D world
  const handlePlotClick = (plotIndex) => {
    console.log('Plot clicked:', plotIndex)
    setSelectedPlot(plotIndex)
    setShowTutorial(false)
    
    // Check if the plot is empty - if so, directly open crop selector for quick planting
    const plotData = gameState?.data?.plots?.[plotIndex]
    console.log('Plot data:', plotData)
    // Backend uses: status="empty" and crop_id=null for empty plots
    const isEmpty = plotData?.status === 'empty' || (!plotData?.crop_id && !plotData?.crop && !plotData?.crop_type)
    console.log('Is empty:', isEmpty)
    if (isEmpty) {
      setShowCropSelector(true)
    }
  }

  // Helper function to get plot ID from index
  const getPlotId = (plotIndex) => {
    // Backend uses format: "plot_1", "plot_2", etc. (1-indexed)
    return `plot_${plotIndex + 1}`
  }

  // Handle actions on selected plot
  const handleAction = (action) => {
    if (selectedPlot === null) return
    
    const plotId = getPlotId(selectedPlot)
    console.log('Performing action:', action, 'on plot:', plotId)
    
    if (action === 'plant') {
      setShowCropSelector(true)
    } else {
      actionMutation.mutate({ action, plotId })
    }
  }

  const handleCropSelect = (cropId) => {
    if (selectedPlot === null) {
      console.log('No plot selected!')
      return
    }
    const plotId = getPlotId(selectedPlot)
    console.log('Planting crop:', cropId, 'on plot:', plotId)
    actionMutation.mutate({ action: 'plant', plotId, cropId })
    setShowCropSelector(false)
    setSelectedPlot(null) // Clear selection after planting
  }

  // Get selected plot data
  const getSelectedPlotData = () => {
    if (selectedPlot === null || !gameState?.data?.plots) return null
    return gameState.data.plots[selectedPlot]
  }

  const selectedPlotData = getSelectedPlotData()

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Toggle weather for demo
  const cycleWeather = () => {
    const weathers = ['sunny', 'cloudy', 'rainy', 'stormy']
    const currentIndex = weathers.indexOf(weather)
    setWeather(weathers[(currentIndex + 1) % weathers.length])
  }

  // Toggle time of day for demo
  const toggleTime = () => {
    setTimeOfDay(timeOfDay === 'day' ? 'night' : 'day')
  }

  // If no gameId, show create game prompt
  if (!gameId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-green-400">
        <div className="text-center bg-white/90 rounded-2xl p-8 shadow-2xl">
          <div className="text-6xl mb-4">🌾</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Active Game</h2>
          <p className="text-gray-600 mb-6">Start a new game from the home page!</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 font-semibold shadow-lg transform hover:scale-105 transition"
          >
            🏠 Go to Home
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-green-400">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🚜</div>
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
          <span className="ml-2 text-white text-xl font-semibold mt-4 block">Loading your farm...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-400 to-orange-400">
        <div className="text-center bg-white/90 rounded-2xl p-8 shadow-2xl">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to load game</h2>
          <p className="text-gray-600 mb-4">Make sure the backend server is running</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const game = gameState?.data

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <Farm3DWorld
          gameState={game}
          onPlotClick={handlePlotClick}
          selectedPlot={selectedPlot}
          lastAction={lastAction}
          weather={weather}
          timeOfDay={timeOfDay}
        />
        
        {/* Minimal HUD for fullscreen */}
        <div className="absolute top-4 left-4 flex items-center gap-4">
          <button
            onClick={toggleFullscreen}
            className="bg-black/60 text-white p-3 rounded-lg hover:bg-black/80"
          >
            <Minimize2 className="h-5 w-5" />
          </button>
          <div className="bg-black/60 text-white px-4 py-2 rounded-lg">
            Day {game?.current_day} • ${game?.budget?.toFixed(0)}
          </div>
        </div>
        
        {/* Action panel in fullscreen */}
        {selectedPlot !== null && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <ActionPanel
              plotData={selectedPlotData}
              onAction={handleAction}
              disabled={actionMutation.isPending}
              onClose={() => setSelectedPlot(null)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-green-100 pb-20">
      {/* Top Stats Bar */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Game Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-amber-100 px-3 py-1.5 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
                <span className="font-bold text-amber-700">Day {game?.current_day}</span>
              </div>
              
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1.5 rounded-lg">
                <Leaf className="h-5 w-5 text-green-600" />
                <span className="capitalize font-medium text-green-700">{game?.season}</span>
              </div>
              
              <div className="hidden md:flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  {game?.location?.name || `${game?.location?.latitude?.toFixed(1)}°, ${game?.location?.longitude?.toFixed(1)}°`}
                </span>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-2 rounded-xl shadow-md">
              <DollarSign className="h-5 w-5 text-white" />
              <span className="font-bold text-white text-lg">
                {game?.budget?.toFixed(0)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Demo controls */}
              <button
                onClick={cycleWeather}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"
                title="Change weather"
              >
                {weather === 'sunny' && <Sun className="h-5 w-5" />}
                {weather === 'cloudy' && <CloudRain className="h-5 w-5" />}
                {weather === 'rainy' && <Droplets className="h-5 w-5" />}
                {weather === 'stormy' && <CloudRain className="h-5 w-5" />}
              </button>
              
              <button
                onClick={toggleTime}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"
                title="Toggle day/night"
              >
                {timeOfDay === 'day' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600"
                title="Fullscreen"
              >
                <Maximize2 className="h-5 w-5" />
              </button>

              {/* Advance Day Button */}
              <button
                onClick={() => advanceDayMutation.mutate()}
                disabled={advanceDayMutation.isPending}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 shadow-md transform hover:scale-105 transition"
              >
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Next Day</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className={clsx(
          'fixed top-24 right-4 z-50 p-4 rounded-xl shadow-2xl max-w-sm',
          actionFeedback.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
          <p className="whitespace-pre-line font-medium">{actionFeedback.message}</p>
          {actionFeedback.cost > 0 && (
            <p className="text-sm mt-1 opacity-90">💰 Cost: -${actionFeedback.cost}</p>
          )}
          {actionFeedback.revenue > 0 && (
            <p className="text-sm mt-1 opacity-90">💵 Revenue: +${actionFeedback.revenue}</p>
          )}
        </div>
      )}

      {/* Tutorial Tooltip */}
      {showTutorial && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white px-6 py-3 rounded-xl shadow-2xl animate-pulse">
          <p className="font-medium">👆 Click on a farm plot to get started!</p>
          <button 
            onClick={() => setShowTutorial(false)}
            className="absolute -top-2 -right-2 bg-white text-black rounded-full w-6 h-6 text-sm"
          >
            ×
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Early Warning Alerts Banner */}
        {earlyWarnings?.alerts?.length > 0 && (
          <div className="mb-4">
            {earlyWarnings.alerts
              .filter(a => a.severity === 'critical' || a.severity === 'high')
              .slice(0, 2)
              .map((alert, index) => (
                <div 
                  key={index}
                  className={clsx(
                    'flex items-center justify-between p-3 rounded-lg mb-2',
                    alert.severity === 'critical' 
                      ? 'bg-red-100 border-l-4 border-red-500 text-red-700'
                      : 'bg-orange-100 border-l-4 border-orange-500 text-orange-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <p className="font-semibold">{alert.title}</p>
                      <p className="text-sm opacity-75">
                        {alert.days_until === 0 ? 'Today' : 
                         alert.days_until === 1 ? 'Tomorrow' : 
                         `In ${alert.days_until} days`}
                      </p>
                    </div>
                  </div>
                  <Link 
                    to="/early-warning" 
                    className="text-sm font-medium underline hover:no-underline"
                  >
                    View Details →
                  </Link>
                </div>
              ))}
            {earlyWarnings.alerts.length > 2 && (
              <Link 
                to="/early-warning" 
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                +{earlyWarnings.alerts.length - 2} more alerts →
              </Link>
            )}
          </div>
        )}
        
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main 3D Farm Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* 3D Farm World */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: '500px' }}>
              <Farm3DWorld
                gameState={game}
                onPlotClick={handlePlotClick}
                selectedPlot={selectedPlot}
                lastAction={lastAction}
                weather={weather}
                timeOfDay={timeOfDay}
              />
            </div>

            {/* Action Panel - Shows when plot is selected */}
            {selectedPlot !== null && (
              <ActionPanel
                plotData={selectedPlotData}
                onAction={handleAction}
                disabled={actionMutation.isPending}
                onClose={() => setSelectedPlot(null)}
              />
            )}

            {/* Achievements */}
            {game?.achievements?.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-4 shadow-lg">
                <h3 className="font-bold text-white flex items-center mb-2">
                  <Award className="h-5 w-5 mr-2" />
                  Achievements Unlocked!
                </h3>
                <div className="flex flex-wrap gap-2">
                  {game.achievements.map((achievement, index) => (
                    <span
                      key={index}
                      className="bg-white/30 text-white px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm"
                    >
                      🏆 {achievement}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weather Panel */}
            <WeatherPanel 
              weather={game?.weather_today}
              location={game?.location}
            />

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Farm Stats
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="text-green-600 font-bold text-lg">
                    ${game?.total_revenue?.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="text-red-600 font-medium">
                    ${game?.total_expenses?.toFixed(0)}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Net Profit</span>
                  <span className={clsx(
                    'font-bold text-lg',
                    (game?.total_revenue - game?.total_expenses) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  )}>
                    ${(game?.total_revenue - game?.total_expenses)?.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Crop Legend */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3">🌾 Crops Guide</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { name: 'Wheat', emoji: '🌾', color: 'text-amber-600' },
                  { name: 'Corn', emoji: '🌽', color: 'text-yellow-600' },
                  { name: 'Rice', emoji: '🍚', color: 'text-green-600' },
                  { name: 'Tomato', emoji: '🍅', color: 'text-red-600' },
                  { name: 'Potato', emoji: '🥔', color: 'text-amber-700' },
                  { name: 'Soybean', emoji: '🫘', color: 'text-lime-600' },
                ].map(crop => (
                  <div key={crop.name} className={`flex items-center gap-2 ${crop.color}`}>
                    <span className="text-lg">{crop.emoji}</span>
                    <span>{crop.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Educational Panel */}
            <EducationalPanel gameState={game} />
          </div>
        </div>
      </div>

      {/* Crop Selector Modal */}
      {showCropSelector && (
        <CropSelector
          crops={crops?.data}
          onSelect={handleCropSelect}
          onClose={() => {
            setShowCropSelector(false)
          }}
        />
      )}
    </div>
  )
}

// Action Panel Component
function ActionPanel({ plotData, onAction, disabled, onClose }) {
  // Backend uses: crop_id, status, growth_progress, water_level, fertilizer_level
  const isEmpty = !plotData?.crop_id || plotData?.status === 'empty'
  const growth = plotData?.growth_progress || plotData?.growth || 0
  const isReadyToHarvest = growth >= 100 || plotData?.status === 'ready'
  const cropName = plotData?.crop_id || plotData?.crop || 'Unknown Crop'
  const waterLevel = plotData?.water_level ?? 50
  const fertilizerLevel = plotData?.fertilizer_level ?? 0
  
  return (
    <div className="bg-white rounded-xl shadow-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Sprout className="h-5 w-5 text-green-600" />
          {isEmpty ? 'Empty Plot' : `${cropName} (${Math.round(growth)}%)`}
        </h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>
      
      {/* Progress bar for crops */}
      {!isEmpty && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Growth Progress</span>
            <span>{Math.round(growth)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={clsx(
                'h-full rounded-full transition-all',
                growth >= 100 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                growth >= 50 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                'bg-gradient-to-r from-lime-400 to-green-500'
              )}
              style={{ width: `${Math.min(growth, 100)}%` }}
            />
          </div>
          {isReadyToHarvest && (
            <p className="text-amber-600 text-sm mt-1 font-medium animate-pulse">
              ✨ Ready to harvest!
            </p>
          )}
        </div>
      )}
      
      {/* Status indicators */}
      {!isEmpty && (
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <Droplets className={clsx('h-4 w-4', waterLevel > 50 ? 'text-blue-500' : 'text-gray-400')} />
            <span>Water: {Math.round(waterLevel)}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Leaf className={clsx('h-4 w-4', fertilizerLevel > 30 ? 'text-green-500' : 'text-gray-400')} />
            <span>Fertilizer: {Math.round(fertilizerLevel)}%</span>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {isEmpty ? (
          <button
            onClick={() => onAction('plant')}
            disabled={disabled}
            className="col-span-4 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 font-semibold shadow-lg transform hover:scale-105 transition"
          >
            <Sprout className="h-5 w-5" />
            Plant Crop
          </button>
        ) : (
          <>
            <button
              onClick={() => onAction('water')}
              disabled={disabled}
              className="flex flex-col items-center gap-1 bg-blue-500 text-white py-3 px-2 rounded-xl hover:bg-blue-600 disabled:opacity-50 shadow-md"
            >
              <Droplets className="h-5 w-5" />
              <span className="text-xs">Water</span>
            </button>
            
            <button
              onClick={() => onAction('fertilize')}
              disabled={disabled}
              className="flex flex-col items-center gap-1 bg-amber-500 text-white py-3 px-2 rounded-xl hover:bg-amber-600 disabled:opacity-50 shadow-md"
            >
              <Leaf className="h-5 w-5" />
              <span className="text-xs">Fertilize</span>
            </button>
            
            <button
              onClick={() => onAction('harvest')}
              disabled={disabled || !isReadyToHarvest}
              className={clsx(
                "flex flex-col items-center gap-1 py-3 px-2 rounded-xl shadow-md",
                isReadyToHarvest 
                  ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-white hover:from-yellow-500 hover:to-amber-600" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              <Scissors className="h-5 w-5" />
              <span className="text-xs">Harvest</span>
            </button>
            
            <button
              onClick={() => onAction('remove')}
              disabled={disabled}
              className="flex flex-col items-center gap-1 bg-red-500 text-white py-3 px-2 rounded-xl hover:bg-red-600 disabled:opacity-50 shadow-md"
            >
              <span className="text-lg">🗑️</span>
              <span className="text-xs">Remove</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default GamePage
