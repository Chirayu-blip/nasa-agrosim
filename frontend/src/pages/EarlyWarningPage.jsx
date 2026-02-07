import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ForecastDashboard } from '../components/EarlyWarning'
import { earlyWarningApi } from '../services/api'

// Popular farming locations
const PRESET_LOCATIONS = [
  { name: 'California, USA', lat: 36.7783, lon: -119.4179, crops: ['corn', 'wheat', 'rice'] },
  { name: 'Punjab, India', lat: 31.1471, lon: 75.3412, crops: ['wheat', 'rice', 'cotton'] },
  { name: 'Iowa, USA', lat: 41.8780, lon: -93.0977, crops: ['corn', 'soybean', 'wheat'] },
  { name: 'São Paulo, Brazil', lat: -23.5505, lon: -46.6333, crops: ['sugarcane', 'soybean', 'corn'] },
  { name: 'Queensland, Australia', lat: -27.4698, lon: 153.0251, crops: ['sugarcane', 'cotton', 'wheat'] },
  { name: 'Ukraine', lat: 48.3794, lon: 31.1656, crops: ['wheat', 'corn', 'sunflower'] },
]

const AVAILABLE_CROPS = [
  'wheat', 'corn', 'rice', 'soybean', 'cotton', 
  'sugarcane', 'potato', 'tomato', 'sunflower'
]

export default function EarlyWarningPage() {
  const [latitude, setLatitude] = useState(36.7783)
  const [longitude, setLongitude] = useState(-119.4179)
  const [selectedCrops, setSelectedCrops] = useState(['wheat', 'corn'])
  const [customLocation, setCustomLocation] = useState(false)
  const [riskAssessment, setRiskAssessment] = useState(null)
  const [loadingRisk, setLoadingRisk] = useState(false)
  const [locationName, setLocationName] = useState('California, USA')

  const handleLocationSelect = (location) => {
    setLatitude(location.lat)
    setLongitude(location.lon)
    setSelectedCrops(location.crops)
    setLocationName(location.name)
    setCustomLocation(false)
    setRiskAssessment(null)
  }

  const handleCropToggle = (crop) => {
    setSelectedCrops(prev => 
      prev.includes(crop) 
        ? prev.filter(c => c !== crop)
        : [...prev, crop]
    )
    setRiskAssessment(null)
  }

  const handleGetRiskAssessment = async (crop) => {
    setLoadingRisk(true)
    try {
      const res = await earlyWarningApi.getRiskAssessment(crop, latitude, longitude)
      setRiskAssessment(res.data)
    } catch (err) {
      console.error('Error fetching risk assessment:', err)
    } finally {
      setLoadingRisk(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
          setLocationName('Current Location')
          setCustomLocation(true)
          setRiskAssessment(null)
        },
        (error) => {
          console.error('Geolocation error:', error)
          alert('Unable to get your location. Please enter coordinates manually.')
        }
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            🛰️ Early Warning System
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            NASA-powered weather prediction to protect your crops. 
            Get 7-14 day advance warnings for drought, frost, and heatwave risks.
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded-full text-sm">
              📡 NASA POWER Data
            </span>
            <span className="px-3 py-1 bg-green-600/30 text-green-400 rounded-full text-sm">
              🌍 Global Coverage
            </span>
            <span className="px-3 py-1 bg-purple-600/30 text-purple-400 rounded-full text-sm">
              ⚡ Real-time Analysis
            </span>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Location & Crop Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-4"
          >
            {/* Location Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                📍 Location
              </h3>
              
              {/* Preset Locations */}
              <div className="space-y-2 mb-4">
                {PRESET_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleLocationSelect(loc)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg transition-all text-sm
                      ${locationName === loc.name && !customLocation
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'}
                    `}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>

              {/* Current Location Button */}
              <button
                onClick={handleUseCurrentLocation}
                className="w-full mb-3 px-3 py-2 bg-green-600/30 hover:bg-green-600/50 
                         text-green-400 rounded-lg transition-all text-sm border border-green-600/30"
              >
                📱 Use My Location
              </button>

              {/* Custom Coordinates */}
              <div className="border-t border-gray-700 pt-3">
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <input
                    type="checkbox"
                    checked={customLocation}
                    onChange={(e) => setCustomLocation(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  Custom Coordinates
                </label>
                
                {customLocation && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Latitude</label>
                      <input
                        type="number"
                        value={latitude}
                        onChange={(e) => setLatitude(parseFloat(e.target.value))}
                        step="0.0001"
                        className="w-full bg-gray-700 rounded px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Longitude</label>
                      <input
                        type="number"
                        value={longitude}
                        onChange={(e) => setLongitude(parseFloat(e.target.value))}
                        step="0.0001"
                        className="w-full bg-gray-700 rounded px-3 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Crop Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🌾 Crops to Monitor
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CROPS.map((crop) => (
                  <button
                    key={crop}
                    onClick={() => handleCropToggle(crop)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm capitalize transition-all
                      ${selectedCrops.includes(crop)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}
                    `}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>

            {/* Crop Risk Assessment */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">🎯 Crop Risk Check</h3>
              
              <div className="space-y-2">
                {selectedCrops.map((crop) => (
                  <button
                    key={crop}
                    onClick={() => handleGetRiskAssessment(crop)}
                    disabled={loadingRisk}
                    className="w-full text-left px-3 py-2 bg-gray-700/50 hover:bg-blue-600/30 
                             rounded-lg transition-all text-sm capitalize flex justify-between items-center"
                  >
                    <span>{crop}</span>
                    <span className="text-gray-500">→</span>
                  </button>
                ))}
              </div>
              
              {/* Risk Assessment Result */}
              {riskAssessment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-600"
                >
                  <h4 className="font-semibold capitalize mb-2">{riskAssessment.crop}</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Overall Risk:</span>
                      <span className={`font-bold ${
                        riskAssessment.overall_risk > 0.6 ? 'text-red-400' :
                        riskAssessment.overall_risk > 0.3 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {(riskAssessment.overall_risk * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-400">Suitability:</span>
                      <span className="text-blue-400">{riskAssessment.suitability}</span>
                    </div>
                    
                    {riskAssessment.recommendations && (
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <p className="text-xs text-gray-500 mb-1">Recommendations:</p>
                        <ul className="text-xs text-gray-400 list-disc list-inside">
                          {riskAssessment.recommendations.slice(0, 3).map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Main Content - Forecast Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <ForecastDashboard 
              latitude={latitude} 
              longitude={longitude} 
              crops={selectedCrops}
            />
            
            {/* Impact Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-700/30"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                💡 Real-World Impact
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-green-400">$2.3B</p>
                  <p className="text-gray-400">Potential crop losses prevented annually with early warnings</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-400">7-14</p>
                  <p className="text-gray-400">Days advance notice for farmers to take protective action</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-400">500M+</p>
                  <p className="text-gray-400">Farmers worldwide can benefit from NASA satellite data</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
