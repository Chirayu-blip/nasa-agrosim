import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sprout, Satellite, CloudRain, TrendingUp, Play, Info } from 'lucide-react'
import { gameApi } from '../services/api'

function HomePage() {
  const navigate = useNavigate()
  const [showNewGame, setShowNewGame] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    playerName: '',
    difficulty: 'normal',
    latitude: 28.6139,  // Default: Delhi, India
    longitude: 77.2090,
    selectedLocation: 'delhi',
  })

  // Predefined locations with their coordinates
  const locations = [
    { id: 'delhi', name: '🇮🇳 Delhi, India', lat: 28.6139, lon: 77.2090, climate: 'Semi-arid, hot summers' },
    { id: 'mumbai', name: '🇮🇳 Mumbai, India', lat: 19.0760, lon: 72.8777, climate: 'Tropical, monsoon' },
    { id: 'bangalore', name: '🇮🇳 Bangalore, India', lat: 12.9716, lon: 77.5946, climate: 'Tropical savanna' },
    { id: 'chennai', name: '🇮🇳 Chennai, India', lat: 13.0827, lon: 80.2707, climate: 'Tropical wet/dry' },
    { id: 'kolkata', name: '🇮🇳 Kolkata, India', lat: 22.5726, lon: 88.3639, climate: 'Tropical wet/dry' },
    { id: 'punjab', name: '🇮🇳 Punjab, India (Wheat Belt)', lat: 31.1471, lon: 75.3412, climate: 'Semi-arid, fertile' },
    { id: 'newyork', name: '🇺🇸 New York, USA', lat: 40.7128, lon: -74.0060, climate: 'Humid subtropical' },
    { id: 'california', name: '🇺🇸 California, USA (Central Valley)', lat: 36.7783, lon: -119.4179, climate: 'Mediterranean, farmland' },
    { id: 'texas', name: '🇺🇸 Texas, USA', lat: 31.9686, lon: -99.9018, climate: 'Semi-arid, cotton belt' },
    { id: 'london', name: '🇬🇧 London, UK', lat: 51.5074, lon: -0.1278, climate: 'Temperate oceanic' },
    { id: 'paris', name: '🇫🇷 Paris, France', lat: 48.8566, lon: 2.3522, climate: 'Oceanic, mild' },
    { id: 'tokyo', name: '🇯🇵 Tokyo, Japan', lat: 35.6762, lon: 139.6503, climate: 'Humid subtropical' },
    { id: 'sydney', name: '🇦🇺 Sydney, Australia', lat: -33.8688, lon: 151.2093, climate: 'Humid subtropical' },
    { id: 'cairo', name: '🇪🇬 Cairo, Egypt', lat: 30.0444, lon: 31.2357, climate: 'Hot desert' },
    { id: 'nairobi', name: '🇰🇪 Nairobi, Kenya', lat: -1.2921, lon: 36.8219, climate: 'Subtropical highland' },
    { id: 'brazil', name: '🇧🇷 São Paulo, Brazil', lat: -23.5505, lon: -46.6333, climate: 'Humid subtropical' },
    { id: 'beijing', name: '🇨🇳 Beijing, China', lat: 39.9042, lon: 116.4074, climate: 'Humid continental' },
    { id: 'dubai', name: '🇦🇪 Dubai, UAE', lat: 25.2048, lon: 55.2708, climate: 'Hot desert' },
    { id: 'moscow', name: '🇷🇺 Moscow, Russia', lat: 55.7558, lon: 37.6173, climate: 'Humid continental, cold' },
    { id: 'custom', name: '📍 Custom Location...', lat: null, lon: null, climate: 'Enter coordinates' },
  ]

  const handleLocationChange = (locationId) => {
    const location = locations.find(l => l.id === locationId)
    if (location && location.lat !== null) {
      setFormData({
        ...formData,
        selectedLocation: locationId,
        latitude: location.lat,
        longitude: location.lon,
      })
    } else {
      setFormData({
        ...formData,
        selectedLocation: 'custom',
      })
    }
  }

  const selectedLocationInfo = locations.find(l => l.id === formData.selectedLocation)

  const features = [
    {
      icon: Satellite,
      title: 'Real NASA Data',
      description: 'Uses actual satellite imagery and climate data from NASA APIs'
    },
    {
      icon: CloudRain,
      title: 'Dynamic Weather',
      description: 'Experience real weather patterns that affect your crops'
    },
    {
      icon: TrendingUp,
      title: 'Learn & Grow',
      description: 'Understand sustainable farming through simulation'
    },
    {
      icon: Sprout,
      title: 'Multiple Crops',
      description: 'Grow wheat, corn, rice, and more based on conditions'
    }
  ]

  const handleStartGame = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await gameApi.createGame({
        player_name: formData.playerName || 'Farmer',
        difficulty: formData.difficulty,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        num_plots: 6
      })
      
      navigate(`/game/${response.data.id}`)
    } catch (error) {
      console.error('Failed to create game:', error)
      alert('Failed to start game. Make sure the backend is running!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full opacity-50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sky-200 rounded-full opacity-50 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-4 rounded-full">
              <Sprout className="h-16 w-16 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Agro<span className="text-green-600">Sim</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            NASA Agricultural Simulation Game
          </p>
          
          <p className="text-gray-500 max-w-2xl mx-auto mb-8">
            Learn sustainable farming practices using real NASA satellite data and climate information.
            Plant crops, manage resources, and respond to weather events!
          </p>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setShowNewGame(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
            >
              <Play className="h-5 w-5" />
              <span>Start Playing</span>
            </button>
            
            <button
              onClick={() => navigate('/learn')}
              className="flex items-center space-x-2 bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg"
            >
              <Info className="h-5 w-5" />
              <span>Learn More</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            What You'll Experience
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NASA Data Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Satellite className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Powered by NASA Open Data
          </h2>
          <p className="text-gray-600 mb-6">
            This game uses real data from NASA's POWER (Prediction Of Worldwide Energy Resources) API,
            providing actual temperature, precipitation, solar radiation, and soil moisture data
            for any location on Earth.
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>🌡️ Temperature</span>
            <span>🌧️ Precipitation</span>
            <span>☀️ Solar Radiation</span>
            <span>💧 Soil Moisture</span>
          </div>
        </div>
      </section>

      {/* New Game Modal */}
      {showNewGame && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Start New Farm</h2>
            
            <form onSubmit={handleStartGame}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Farmer Name
                  </label>
                  <input
                    type="text"
                    value={formData.playerName}
                    onChange={(e) => setFormData({ ...formData, playerName: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="easy">Easy - $10,000 starting budget</option>
                    <option value="normal">Normal - $5,000 starting budget</option>
                    <option value="hard">Hard - $2,500 starting budget</option>
                  </select>
                </div>

                {/* Location Selector - NEW! */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🌍 Farm Location
                  </label>
                  <select
                    value={formData.selectedLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <optgroup label="🇮🇳 India">
                      {locations.filter(l => l.name.includes('India')).map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🇺🇸 United States">
                      {locations.filter(l => l.name.includes('USA')).map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="🌍 Other Countries">
                      {locations.filter(l => !l.name.includes('India') && !l.name.includes('USA') && l.id !== 'custom').map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="📍 Custom">
                      <option value="custom">📍 Enter Custom Coordinates...</option>
                    </optgroup>
                  </select>
                </div>

                {/* Climate Info */}
                {selectedLocationInfo && selectedLocationInfo.id !== 'custom' && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <div className="font-medium text-blue-800">Climate: {selectedLocationInfo.climate}</div>
                    <div className="text-blue-600 text-xs mt-1">
                      Coordinates: {selectedLocationInfo.lat}°, {selectedLocationInfo.lon}°
                    </div>
                  </div>
                )}

                {/* Custom Coordinates (only show if custom selected) */}
                {formData.selectedLocation === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="-90 to 90"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="-180 to 180"
                      />
                    </div>
                  </div>
                )}

                {/* NASA API Info */}
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Satellite className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Powered by NASA POWER API</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    🆓 Free & open data! No API key required. Climate data is 30-day historical average, not live weather.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewGame(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Start Farming! 🌱'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
