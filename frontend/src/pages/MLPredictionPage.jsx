import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { mlApi } from '../services/api'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const SUPPORTED_CROPS = [
  { id: 'wheat', name: 'Wheat', icon: '🌾', color: '#F59E0B' },
  { id: 'corn', name: 'Corn', icon: '🌽', color: '#FBBF24' },
  { id: 'rice', name: 'Rice', icon: '🍚', color: '#10B981' },
  { id: 'soybean', name: 'Soybean', icon: '🫘', color: '#84CC16' },
  { id: 'potato', name: 'Potato', icon: '🥔', color: '#A16207' },
  { id: 'cotton', name: 'Cotton', icon: '☁️', color: '#E5E7EB' },
  { id: 'sugarcane', name: 'Sugarcane', icon: '🎋', color: '#22C55E' },
]

export default function MLPredictionPage() {
  const [modelInfo, setModelInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [predicting, setPredicting] = useState(false)
  const [training, setTraining] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [featureImportance, setFeatureImportance] = useState(null)
  const [cropComparison, setCropComparison] = useState(null)
  const [activeTab, setActiveTab] = useState('predict')
  const [useAutoWeather, setUseAutoWeather] = useState(true)  // NEW: Auto-fetch weather
  
  // Form state
  const [formData, setFormData] = useState({
    crop: 'wheat',
    latitude: 40.71,
    longitude: -74.01,
    temp_avg: 22,
    temp_min: 15,
    temp_max: 30,
    precipitation: 80,
    humidity: 65,
    solar_radiation: 20,
    wind_speed: 5,
    month: 7,
    growing_days: 120,
    soil_quality: 0.75
  })

  useEffect(() => {
    fetchModelInfo()
    fetchFeatureImportance()
  }, [])

  const fetchModelInfo = async () => {
    try {
      const res = await mlApi.getModelInfo()
      setModelInfo(res.data)
    } catch (err) {
      console.error('Error fetching model info:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFeatureImportance = async () => {
    try {
      const res = await mlApi.getFeatureImportance()
      setFeatureImportance(res.data)
    } catch (err) {
      console.log('Feature importance not available yet')
    }
  }

  const handleTrain = async () => {
    setTraining(true)
    try {
      // Train with REAL FAO data for reliable predictions
      const res = await mlApi.trainModel(5000, true)
      const dataSource = res.data.metrics?.data_source || 'FAO STAT'
      alert(`Training complete!\nData Source: ${dataSource}\nR² Score: ${res.data.metrics?.r2_score?.toFixed(4) || 'N/A'}`)
      fetchModelInfo()
      fetchFeatureImportance()
    } catch (err) {
      alert('Training failed: ' + err.message)
    } finally {
      setTraining(false)
    }
  }

  const handlePredict = async () => {
    setPredicting(true)
    try {
      let res
      if (useAutoWeather) {
        // Use NASA POWER for automatic weather data - more reliable!
        res = await mlApi.predictAutoWeather({
          crop: formData.crop,
          latitude: formData.latitude,
          longitude: formData.longitude,
          month: formData.month,
          growing_days: formData.growing_days,
          soil_quality: formData.soil_quality
        })
      } else {
        // Manual weather input
        res = await mlApi.predict(formData)
      }
      setPrediction(res.data)
    } catch (err) {
      alert('Prediction failed: ' + err.message)
    } finally {
      setPredicting(false)
    }
  }

  const handleCompareCrops = async () => {
    try {
      const res = await mlApi.compareCrops(
        formData.latitude,
        formData.longitude,
        formData.temp_avg,
        formData.precipitation
      )
      setCropComparison(res.data)
    } catch (err) {
      console.error('Comparison failed:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  // Feature importance chart data
  const featureChartData = featureImportance ? {
    labels: featureImportance.features?.slice(0, 10).map(f => f.display_name) || [],
    datasets: [{
      label: 'Importance (%)',
      data: featureImportance.features?.slice(0, 10).map(f => f.importance) || [],
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
      ],
      borderRadius: 6,
    }]
  } : null

  // Crop comparison chart data
  const cropComparisonChartData = cropComparison ? {
    labels: cropComparison.rankings?.map(c => c.crop.charAt(0).toUpperCase() + c.crop.slice(1)) || [],
    datasets: [{
      label: 'Suitability Score',
      data: cropComparison.rankings?.map(c => c.score * 100) || [],
      backgroundColor: cropComparison.rankings?.map((c, i) => {
        const crop = SUPPORTED_CROPS.find(sc => sc.id === c.crop)
        return crop?.color || '#6B7280'
      }) || [],
      borderRadius: 6,
    }]
  } : null

  // Confidence interval chart
  const confidenceChartData = prediction ? {
    labels: ['Lower Bound', 'Predicted', 'Upper Bound'],
    datasets: [{
      label: 'Yield (kg/hectare)',
      data: [
        prediction.confidence_interval.lower,
        prediction.predicted_yield,
        prediction.confidence_interval.upper
      ],
      backgroundColor: ['#EF4444', '#10B981', '#3B82F6'],
      borderRadius: 6,
    }]
  } : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading ML Model...</p>
        </div>
      </div>
    )
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
            🤖 ML Yield Prediction
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Advanced ensemble machine learning model using XGBoost, Random Forest, and LightGBM
            to predict crop yields with confidence intervals
          </p>
          
          {/* Model badges */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 bg-green-600/30 text-green-400 rounded-full text-sm">
              🌲 Random Forest
            </span>
            <span className="px-3 py-1 bg-blue-600/30 text-blue-400 rounded-full text-sm">
              ⚡ XGBoost
            </span>
            <span className="px-3 py-1 bg-purple-600/30 text-purple-400 rounded-full text-sm">
              🚀 LightGBM
            </span>
            <span className="px-3 py-1 bg-orange-600/30 text-orange-400 rounded-full text-sm">
              📊 Stacking Ensemble
            </span>
          </div>
        </motion.div>

        {/* Model Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Model Status</h3>
              <div className="flex items-center gap-4">
                <span className={`flex items-center gap-2 ${modelInfo?.is_trained ? 'text-green-400' : 'text-yellow-400'}`}>
                  <span className={`w-3 h-3 rounded-full ${modelInfo?.is_trained ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                  {modelInfo?.is_trained ? 'Trained & Ready' : 'Not Trained'}
                </span>
                {modelInfo?.metrics?.r2_score && (
                  <span className="text-gray-400">
                    R² Score: <span className="text-white font-bold">{modelInfo.metrics.r2_score.toFixed(4)}</span>
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={handleTrain}
              disabled={training}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              {training ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  🧠 Train Model
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'predict', label: '🎯 Predict Yield', icon: '🎯' },
            { id: 'compare', label: '📊 Compare Crops', icon: '📊' },
            { id: 'features', label: '🔬 Feature Analysis', icon: '🔬' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'predict' && (
            <motion.div
              key="predict"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Input Form */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4">📝 Input Parameters</h3>
                
                {/* Crop Selection */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Select Crop</label>
                  <div className="grid grid-cols-4 gap-2">
                    {SUPPORTED_CROPS.map(crop => (
                      <button
                        key={crop.id}
                        onClick={() => setFormData(prev => ({ ...prev, crop: crop.id }))}
                        className={`p-3 rounded-lg text-center transition-all ${
                          formData.crop === crop.id
                            ? 'bg-blue-600 ring-2 ring-blue-400'
                            : 'bg-gray-700/50 hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{crop.icon}</span>
                        <span className="text-xs">{crop.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Weather Toggle - NASA POWER Integration */}
                <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">🛰️ Auto-Fetch Weather (NASA POWER)</span>
                      <p className="text-xs text-gray-400 mt-1">
                        {useAutoWeather 
                          ? 'Using real weather data for accurate predictions' 
                          : 'Manual weather input - enter values below'}
                      </p>
                    </div>
                    <button
                      onClick={() => setUseAutoWeather(!useAutoWeather)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        useAutoWeather ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                        useAutoWeather ? 'left-8' : 'left-1'
                      }`} />
                    </button>
                  </div>
                  {useAutoWeather && (
                    <div className="mt-2 text-xs text-green-400">
                      ✅ Weather data will be fetched automatically from NASA POWER API based on coordinates
                    </div>
                  )}
                </div>

                {/* Climate Inputs - Show only when not using auto weather */}
                {!useAutoWeather && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Avg Temp (°C)</label>
                    <input
                      type="number"
                      name="temp_avg"
                      value={formData.temp_avg}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Precipitation (mm)</label>
                    <input
                      type="number"
                      name="precipitation"
                      value={formData.precipitation}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Min Temp (°C)</label>
                    <input
                      type="number"
                      name="temp_min"
                      value={formData.temp_min}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Temp (°C)</label>
                    <input
                      type="number"
                      name="temp_max"
                      value={formData.temp_max}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Humidity (%)</label>
                    <input
                      type="number"
                      name="humidity"
                      value={formData.humidity}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Solar Radiation</label>
                    <input
                      type="number"
                      name="solar_radiation"
                      value={formData.solar_radiation}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                )}

                {/* Location Inputs - Always visible */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">📍 Latitude</label>
                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">📍 Longitude</label>
                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      step="0.01"
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Month (1-12)</label>
                    <input
                      type="number"
                      name="month"
                      value={formData.month}
                      onChange={handleInputChange}
                      min="1"
                      max="12"
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Soil Quality (0-1)</label>
                    <input
                      type="number"
                      name="soil_quality"
                      value={formData.soil_quality}
                      onChange={handleInputChange}
                      step="0.05"
                      min="0"
                      max="1"
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePredict}
                  disabled={predicting || !modelInfo?.is_trained}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {predicting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      🎯 Predict Yield
                    </>
                  )}
                </button>
                
                {!modelInfo?.is_trained && (
                  <p className="text-yellow-400 text-sm text-center mt-2">
                    ⚠️ Train the model first to make predictions
                  </p>
                )}
              </div>

              {/* Prediction Results */}
              <div className="space-y-6">
                {prediction ? (
                  <>
                    {/* Main Prediction Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-700/50"
                    >
                      <div className="text-center mb-4">
                        <p className="text-gray-400 mb-1">Predicted Yield for {prediction.crop}</p>
                        <p className="text-5xl font-bold text-green-400">
                          {prediction.predicted_yield.toLocaleString()}
                        </p>
                        <p className="text-gray-400">kg/hectare</p>
                      </div>
                      
                      <div className="bg-black/20 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">95% Confidence Interval</p>
                        <div className="flex items-center justify-between">
                          <span className="text-red-400">{prediction.confidence_interval.lower.toLocaleString()}</span>
                          <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full relative">
                            <div 
                              className="absolute h-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full"
                              style={{
                                left: `${((prediction.predicted_yield - prediction.confidence_interval.lower) / (prediction.confidence_interval.upper - prediction.confidence_interval.lower)) * 30}%`,
                                width: '40%'
                              }}
                            />
                          </div>
                          <span className="text-blue-400">{prediction.confidence_interval.upper.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Model Metrics */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-2 bg-black/20 rounded-lg">
                          <p className="text-xs text-gray-500">R² Score</p>
                          <p className="text-lg font-bold text-blue-400">
                            {prediction.model_metrics.r2_score?.toFixed(3) || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-black/20 rounded-lg">
                          <p className="text-xs text-gray-500">RMSE</p>
                          <p className="text-lg font-bold text-purple-400">
                            {prediction.model_metrics.rmse?.toFixed(0) || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center p-2 bg-black/20 rounded-lg">
                          <p className="text-xs text-gray-500">CV Mean</p>
                          <p className="text-lg font-bold text-green-400">
                            {prediction.model_metrics.cv_mean?.toFixed(3) || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Weather Data (when using auto-fetch) */}
                    {prediction.weather_data && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-700/50"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🛰️</span>
                          <h4 className="font-bold">Real Weather Data</h4>
                          <span className="text-xs text-green-400 bg-green-900/50 px-2 py-0.5 rounded-full">
                            {prediction.weather_source || 'NASA POWER'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          <div className="bg-black/20 rounded-lg p-2">
                            <p className="text-xs text-gray-400">🌡️ Temp</p>
                            <p className="font-bold text-blue-400">{prediction.weather_data.temp_avg}°C</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-2">
                            <p className="text-xs text-gray-400">🌧️ Rain</p>
                            <p className="font-bold text-blue-400">{prediction.weather_data.precipitation}mm</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-2">
                            <p className="text-xs text-gray-400">💧 Humidity</p>
                            <p className="font-bold text-blue-400">{prediction.weather_data.humidity}%</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-2">
                            <p className="text-xs text-gray-400">☀️ Solar</p>
                            <p className="font-bold text-blue-400">{prediction.weather_data.solar_radiation}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Risk Factors */}
                    {prediction.risk_factors.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
                      >
                        <h4 className="font-bold mb-4 flex items-center gap-2">
                          ⚠️ Risk Factors
                        </h4>
                        <div className="space-y-3">
                          {prediction.risk_factors.map((risk, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-red-900/20 rounded-lg border border-red-700/30">
                              <div className="flex-1">
                                <p className="font-medium text-red-400">{risk.factor}</p>
                                <p className="text-sm text-gray-400">{risk.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-red-400">{risk.impact}</p>
                                <div className="w-20 h-2 bg-gray-700 rounded-full mt-1">
                                  <div 
                                    className="h-full bg-red-500 rounded-full"
                                    style={{ width: `${risk.severity * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Recommendations */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
                    >
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        💡 Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {prediction.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-300">
                            <span className="text-green-400 mt-1">✓</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </>
                ) : (
                  <div className="bg-gray-800/50 rounded-xl p-12 border border-gray-700 text-center">
                    <div className="text-6xl mb-4">🌱</div>
                    <p className="text-gray-400">
                      Enter parameters and click "Predict Yield" to see results
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'compare' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4">🌍 Environment Settings</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Temperature (°C)</label>
                    <input
                      type="number"
                      name="temp_avg"
                      value={formData.temp_avg}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Precipitation (mm)</label>
                    <input
                      type="number"
                      name="precipitation"
                      value={formData.precipitation}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Latitude</label>
                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Longitude</label>
                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCompareCrops}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-bold"
                >
                  📊 Compare All Crops
                </button>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4">🏆 Crop Rankings</h3>
                {cropComparison ? (
                  <div className="space-y-3">
                    {cropComparison.rankings?.map((crop, i) => {
                      const cropInfo = SUPPORTED_CROPS.find(c => c.id === crop.crop)
                      return (
                        <div 
                          key={crop.crop}
                          className={`flex items-center gap-4 p-4 rounded-lg ${
                            i === 0 ? 'bg-yellow-900/30 border border-yellow-600/50' : 'bg-gray-700/30'
                          }`}
                        >
                          <span className="text-2xl font-bold text-gray-500 w-8">#{i + 1}</span>
                          <span className="text-3xl">{cropInfo?.icon || '🌱'}</span>
                          <div className="flex-1">
                            <p className="font-semibold capitalize">{crop.crop}</p>
                            <p className={`text-sm ${
                              crop.rating === 'Excellent' ? 'text-green-400' :
                              crop.rating === 'Good' ? 'text-blue-400' :
                              crop.rating === 'Moderate' ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {crop.rating}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">
                              {(crop.score * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    Click "Compare All Crops" to see rankings
                  </div>
                )}
              </div>

              {cropComparison && cropComparisonChartData && (
                <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <h3 className="text-xl font-bold mb-4">📈 Suitability Comparison</h3>
                  <div className="h-64">
                    <Bar 
                      data={cropComparisonChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: '#374151' },
                            ticks: { color: '#9CA3AF' }
                          },
                          x: {
                            grid: { display: false },
                            ticks: { color: '#9CA3AF' }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              key="features"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Feature Importance Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4">📊 Feature Importance</h3>
                {featureImportance && featureChartData ? (
                  <div className="h-80">
                    <Bar 
                      data={featureChartData}
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          x: {
                            beginAtZero: true,
                            grid: { color: '#374151' },
                            ticks: { color: '#9CA3AF' }
                          },
                          y: {
                            grid: { display: false },
                            ticks: { color: '#9CA3AF', font: { size: 11 } }
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    Train the model to see feature importance
                  </div>
                )}
              </div>

              {/* Model Architecture */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4">🏗️ Model Architecture</h3>
                <div className="space-y-4">
                  {modelInfo?.architecture?.map((arch, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <span className="font-medium">{arch}</span>
                    </div>
                  ))}
                </div>

                {/* Features Used */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Features Used ({modelInfo?.features_used?.length || 0})</h4>
                  <div className="flex flex-wrap gap-2">
                    {modelInfo?.features_used?.map((feature, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature Importance List */}
              {featureImportance?.features && (
                <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                  <h3 className="text-xl font-bold mb-4">🔬 All Features Ranked</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featureImportance.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                        <span className="text-sm text-gray-500 w-6">#{feature.rank}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{feature.display_name}</p>
                          <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                              style={{ width: `${Math.min(100, feature.importance * 2)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">{feature.importance_pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
