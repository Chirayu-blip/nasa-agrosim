import { Cloud, Sun, CloudRain, Thermometer, Droplets, MapPin, Satellite, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { weatherApi, nasaApi } from '../services/api'

function WeatherPanel({ weather, location }) {
  // Fetch REAL NASA climate data for the selected location
  const { data: nasaData, isLoading: nasaLoading } = useQuery({
    queryKey: ['nasa-climate', location?.latitude, location?.longitude],
    queryFn: () => nasaApi.getClimate(location.latitude, location.longitude),
    enabled: !!location?.latitude && !!location?.longitude,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  })

  // Fetch weather forecast
  const { data: forecast } = useQuery({
    queryKey: ['forecast', location?.latitude, location?.longitude],
    queryFn: () => weatherApi.getForecast(
      nasaData?.data?.summary?.avg_temperature || weather?.temperature || 22, 
      nasaData?.data?.summary?.avg_daily_precipitation || weather?.precipitation || 5, 
      5
    ),
    enabled: !!location,
  })

  const getWeatherIcon = (temp, precip) => {
    if (precip > 5) return <CloudRain className="h-8 w-8 text-blue-500" />
    if (precip > 2) return <Cloud className="h-8 w-8 text-gray-400" />
    return <Sun className="h-8 w-8 text-amber-500" />
  }

  // Get location name based on coordinates (approximate)
  const getLocationName = (lat, lon) => {
    // Simple location mapping for common coordinates
    const locations = [
      { name: "Delhi, India", lat: 28.6139, lon: 77.2090, range: 1 },
      { name: "Mumbai, India", lat: 19.0760, lon: 72.8777, range: 1 },
      { name: "Bangalore, India", lat: 12.9716, lon: 77.5946, range: 1 },
      { name: "Chennai, India", lat: 13.0827, lon: 80.2707, range: 1 },
      { name: "Kolkata, India", lat: 22.5726, lon: 88.3639, range: 1 },
      { name: "Punjab, India", lat: 31.1471, lon: 75.3412, range: 2 },
      { name: "New York, USA", lat: 40.7128, lon: -74.0060, range: 1 },
      { name: "California, USA", lat: 36.7783, lon: -119.4179, range: 2 },
      { name: "Texas, USA", lat: 31.9686, lon: -99.9018, range: 2 },
      { name: "London, UK", lat: 51.5074, lon: -0.1278, range: 1 },
      { name: "Paris, France", lat: 48.8566, lon: 2.3522, range: 1 },
      { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503, range: 1 },
      { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093, range: 1 },
      { name: "Cairo, Egypt", lat: 30.0444, lon: 31.2357, range: 1 },
      { name: "Nairobi, Kenya", lat: -1.2921, lon: 36.8219, range: 1 },
      { name: "São Paulo, Brazil", lat: -23.5505, lon: -46.6333, range: 1 },
      { name: "Beijing, China", lat: 39.9042, lon: 116.4074, range: 1 },
      { name: "Dubai, UAE", lat: 25.2048, lon: 55.2708, range: 1 },
      { name: "Moscow, Russia", lat: 55.7558, lon: 37.6173, range: 1 },
    ]
    
    for (const loc of locations) {
      if (Math.abs(lat - loc.lat) < loc.range && Math.abs(lon - loc.lon) < loc.range) {
        return loc.name
      }
    }
    return `${lat?.toFixed(2)}°, ${lon?.toFixed(2)}°`
  }

  const summary = nasaData?.data?.summary || {}
  const actualTemp = summary.avg_temperature || weather?.temperature || 22
  const actualPrecip = summary.avg_daily_precipitation || weather?.precipitation || 0
  const actualHumidity = summary.avg_humidity || 60

  return (
    <div className="bg-gradient-to-br from-sky-100 to-blue-50 rounded-xl shadow-sm p-4">
      {/* Location Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <MapPin className="h-4 w-4 text-red-500 mr-1" />
          <span className="text-sm">{getLocationName(location?.latitude, location?.longitude)}</span>
        </h3>
        <div className="flex items-center text-xs text-blue-600">
          <Satellite className="h-3 w-3 mr-1" />
          NASA Data
        </div>
      </div>

      {nasaLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-500">Fetching NASA data...</span>
        </div>
      ) : (
        <>
          {/* Current Weather from NASA */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getWeatherIcon(actualTemp, actualPrecip)}
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {actualTemp.toFixed(1)}°C
                </div>
                <div className="text-xs text-gray-500">
                  30-day average
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">High/Low</div>
              <div className="text-sm font-medium">
                {summary.max_temperature?.toFixed(0) || '--'}° / {summary.min_temperature?.toFixed(0) || '--'}°
              </div>
            </div>
          </div>

          {/* Weather Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-xs text-gray-500">Rain (daily avg)</div>
                <div className="font-medium">{actualPrecip.toFixed(1)} mm</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-xs text-gray-500">Humidity</div>
                <div className="font-medium">{actualHumidity.toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* Growing Insight */}
          <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs font-medium text-green-800 mb-1">🌱 Growing Insight</div>
            <p className="text-xs text-green-700">
              {actualTemp > 30 
                ? "Hot climate! Corn and rice thrive here. Increase irrigation." 
                : actualTemp > 20 
                  ? "Ideal conditions for most crops. Good growing weather!"
                  : actualTemp > 10
                    ? "Cool climate suits wheat, potatoes, and leafy greens."
                    : "Cold conditions. Consider greenhouse farming."}
            </p>
          </div>

          {/* 5-Day Forecast */}
          {forecast?.data?.forecast && (
            <div className="mt-4 pt-4 border-t border-sky-200">
              <h4 className="text-xs font-medium text-gray-500 mb-2">5-DAY FORECAST</h4>
              <div className="flex justify-between">
                {forecast.data.forecast.slice(0, 5).map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500">D{day.day}</div>
                    <div className="text-lg">{day.icon}</div>
                    <div className="text-xs font-medium">{Math.round(day.temperature)}°</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Data Source */}
      <div className="mt-3 pt-2 border-t border-sky-200/50">
        <p className="text-[10px] text-gray-400 text-center">
          Data: NASA POWER API • Last 30 days average
        </p>
      </div>
    </div>
  )
}

export default WeatherPanel
