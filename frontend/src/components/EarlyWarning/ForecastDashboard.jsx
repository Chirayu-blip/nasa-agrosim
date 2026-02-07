import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { earlyWarningApi } from '../../services/api'
import AlertBanner from './AlertBanner'

const weatherIcons = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  stormy: '⛈️',
  snowy: '❄️',
  windy: '💨'
}

const getRiskColor = (risk) => {
  if (risk >= 0.7) return 'text-red-500'
  if (risk >= 0.4) return 'text-orange-500'
  if (risk >= 0.2) return 'text-yellow-500'
  return 'text-green-500'
}

const getRiskLabel = (risk) => {
  if (risk >= 0.7) return 'High'
  if (risk >= 0.4) return 'Moderate'
  if (risk >= 0.2) return 'Low'
  return 'Minimal'
}

const getWeatherIcon = (temp, precip) => {
  if (temp < 0) return weatherIcons.snowy
  if (precip > 10) return weatherIcons.stormy
  if (precip > 5) return weatherIcons.rainy
  if (precip > 2) return weatherIcons.cloudy
  return weatherIcons.sunny
}

export default function ForecastDashboard({ latitude, longitude, crops = [] }) {
  const [forecast, setForecast] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())

  useEffect(() => {
    const fetchData = async () => {
      if (!latitude || !longitude) return
      
      setLoading(true)
      setError(null)
      
      try {
        const [forecastRes, alertsRes] = await Promise.all([
          earlyWarningApi.getForecast(latitude, longitude, 14),
          earlyWarningApi.getAlerts(latitude, longitude, crops.join(','))
        ])
        
        setForecast(forecastRes.data)
        setAlerts(alertsRes.data.alerts || [])
      } catch (err) {
        console.error('Error fetching early warning data:', err)
        setError('Failed to fetch weather forecast')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [latitude, longitude, crops])

  const handleDismissAlert = (alert) => {
    setDismissedAlerts(prev => new Set([...prev, `${alert.alert_type}-${alert.days_until}`]))
  }

  const activeAlerts = alerts.filter(
    a => !dismissedAlerts.has(`${a.alert_type}-${a.days_until}`)
  )

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400">Loading weather forecast...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/30 rounded-xl p-6 border border-red-700">
        <p className="text-red-400 text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-4 border border-gray-700"
        >
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            🚨 Active Weather Alerts
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
              {activeAlerts.length}
            </span>
          </h3>
          <AlertBanner alerts={activeAlerts} onDismiss={handleDismissAlert} />
        </motion.div>
      )}

      {/* 14-Day Forecast */}
      {forecast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              📅 14-Day Forecast
              <span className="text-sm font-normal text-gray-400">
                ({forecast.location?.name || `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`})
              </span>
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">Data: NASA POWER</span>
            </div>
          </div>

          {/* Forecast Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {forecast.forecast?.slice(0, 14).map((day, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(selectedDay === index ? null : index)}
                className={`
                  p-2 rounded-lg cursor-pointer transition-all
                  ${selectedDay === index 
                    ? 'bg-blue-600/50 border-blue-500' 
                    : 'bg-gray-700/50 hover:bg-gray-700 border-gray-600'}
                  border
                `}
              >
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-2xl mb-1">
                    {getWeatherIcon(day.temp_avg, day.precipitation)}
                  </p>
                  <p className="text-sm font-bold text-white">
                    {Math.round(day.temp_avg)}°C
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="text-blue-400">↓{Math.round(day.temp_min)}°</span>
                    <span className="text-red-400">↑{Math.round(day.temp_max)}°</span>
                  </div>
                  
                  {/* Risk indicator */}
                  {(day.drought_risk > 0.3 || day.frost_risk > 0.3 || day.heatwave_risk > 0.3) && (
                    <div className="mt-1">
                      {day.drought_risk > 0.3 && <span className="text-xs">🏜️</span>}
                      {day.frost_risk > 0.3 && <span className="text-xs">❄️</span>}
                      {day.heatwave_risk > 0.3 && <span className="text-xs">🔥</span>}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Selected Day Details */}
          {selectedDay !== null && forecast.forecast?.[selectedDay] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-900/50 rounded-lg p-4 border border-gray-600"
            >
              <h4 className="font-semibold text-white mb-3">
                {new Date(forecast.forecast[selectedDay].date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-2 bg-gray-800/50 rounded">
                  <p className="text-gray-400 text-xs">Temperature</p>
                  <p className="text-xl font-bold text-white">
                    {Math.round(forecast.forecast[selectedDay].temp_avg)}°C
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round(forecast.forecast[selectedDay].temp_min)}° - {Math.round(forecast.forecast[selectedDay].temp_max)}°
                  </p>
                </div>
                
                <div className="text-center p-2 bg-gray-800/50 rounded">
                  <p className="text-gray-400 text-xs">Precipitation</p>
                  <p className="text-xl font-bold text-blue-400">
                    {forecast.forecast[selectedDay].precipitation.toFixed(1)}mm
                  </p>
                </div>
                
                <div className="text-center p-2 bg-gray-800/50 rounded">
                  <p className="text-gray-400 text-xs">Humidity</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {Math.round(forecast.forecast[selectedDay].humidity)}%
                  </p>
                </div>
                
                <div className="text-center p-2 bg-gray-800/50 rounded">
                  <p className="text-gray-400 text-xs">Wind Speed</p>
                  <p className="text-xl font-bold text-gray-300">
                    {forecast.forecast[selectedDay].wind_speed.toFixed(1)} m/s
                  </p>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded bg-orange-900/20 border border-orange-700/30">
                  <p className="text-xs text-gray-400 mb-1">🏜️ Drought Risk</p>
                  <p className={`font-bold ${getRiskColor(forecast.forecast[selectedDay].drought_risk)}`}>
                    {getRiskLabel(forecast.forecast[selectedDay].drought_risk)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(forecast.forecast[selectedDay].drought_risk * 100).toFixed(0)}%
                  </p>
                </div>
                
                <div className="text-center p-2 rounded bg-blue-900/20 border border-blue-700/30">
                  <p className="text-xs text-gray-400 mb-1">❄️ Frost Risk</p>
                  <p className={`font-bold ${getRiskColor(forecast.forecast[selectedDay].frost_risk)}`}>
                    {getRiskLabel(forecast.forecast[selectedDay].frost_risk)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(forecast.forecast[selectedDay].frost_risk * 100).toFixed(0)}%
                  </p>
                </div>
                
                <div className="text-center p-2 rounded bg-red-900/20 border border-red-700/30">
                  <p className="text-xs text-gray-400 mb-1">🔥 Heatwave Risk</p>
                  <p className={`font-bold ${getRiskColor(forecast.forecast[selectedDay].heatwave_risk)}`}>
                    {getRiskLabel(forecast.forecast[selectedDay].heatwave_risk)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(forecast.forecast[selectedDay].heatwave_risk * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Summary Stats */}
          {forecast.summary && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-900/30 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-gray-500">Avg Temperature</p>
                <p className="text-lg font-bold text-white">{forecast.summary.avg_temp?.toFixed(1)}°C</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Total Precipitation</p>
                <p className="text-lg font-bold text-blue-400">{forecast.summary.total_precip?.toFixed(1)}mm</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Max Drought Risk</p>
                <p className={`text-lg font-bold ${getRiskColor(forecast.summary.max_drought_risk || 0)}`}>
                  {getRiskLabel(forecast.summary.max_drought_risk || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Max Frost Risk</p>
                <p className={`text-lg font-bold ${getRiskColor(forecast.summary.max_frost_risk || 0)}`}>
                  {getRiskLabel(forecast.summary.max_frost_risk || 0)}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
