import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Game API
export const gameApi = {
  createGame: (data) => api.post('/game/new', data),
  getGame: (gameId) => api.get(`/game/${gameId}`),
  performAction: (gameId, action) => api.post(`/game/${gameId}/action`, action),
  advanceDay: (gameId) => api.post(`/game/${gameId}/advance-day`),
  getSummary: (gameId) => api.get(`/game/${gameId}/summary`),
  deleteGame: (gameId) => api.delete(`/game/${gameId}`),
}

// Crops API
export const cropsApi = {
  getAllCrops: () => api.get('/crops/'),
  getCrop: (cropId) => api.get(`/crops/${cropId}`),
  checkSuitability: (cropId, temperature, precipitation, humidity) => 
    api.get(`/crops/suitable/${cropId}`, {
      params: { temperature, precipitation, humidity }
    }),
  getRecommendations: (temperature, precipitation, humidity) =>
    api.get('/crops/recommend/', {
      params: { temperature, precipitation, humidity }
    }),
}

// NASA Data API
export const nasaApi = {
  getClimate: (latitude, longitude, startDate, endDate) =>
    api.get('/nasa/climate', {
      params: { latitude, longitude, start_date: startDate, end_date: endDate }
    }),
  getGrowingConditions: (latitude, longitude) =>
    api.get('/nasa/growing-conditions', {
      params: { latitude, longitude }
    }),
}

// Weather API
export const weatherApi = {
  getEvents: () => api.get('/weather/events'),
  simulateWeather: (temperature, precipitation, season) =>
    api.get('/weather/simulate', {
      params: { temperature, precipitation, season }
    }),
  getForecast: (baseTemperature, basePrecipitation, days) =>
    api.get('/weather/forecast', {
      params: { 
        base_temperature: baseTemperature || 22, 
        base_precipitation: basePrecipitation || 5, 
        days: days || 7 
      }
    }),
}

export default api
