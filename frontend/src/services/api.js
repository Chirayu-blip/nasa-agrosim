import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrosim_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('agrosim_token')
      localStorage.removeItem('agrosim_user')
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (username, password) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  checkUsername: (username) => api.get(`/auth/check-username/${username}`),
  checkEmail: (email) => api.get(`/auth/check-email/${email}`),
}

// Leaderboard API
export const leaderboardApi = {
  submitScore: (data) => api.post('/leaderboard/submit', data),
  getGlobal: (params = {}) => api.get('/leaderboard/global', { params }),
  getRegional: (region, limit = 10) => api.get(`/leaderboard/regional/${region}`, { params: { limit } }),
  getUserStats: (username) => api.get(`/leaderboard/user/${username}`),
  getMyScores: (limit = 10) => api.get('/leaderboard/my-scores', { params: { limit } }),
}

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

// Early Warning API
export const earlyWarningApi = {
  getForecast: (latitude, longitude, days = 14) =>
    api.get('/early-warning/forecast', {
      params: { latitude, longitude, days }
    }),
  getAlerts: (latitude, longitude, crops = null) =>
    api.get('/early-warning/alerts', {
      params: { latitude, longitude, ...(crops && { crops }) }
    }),
  getRiskAssessment: (crop, latitude, longitude) =>
    api.get(`/early-warning/risk-assessment/${crop}`, {
      params: { latitude, longitude }
    }),
}

// ML Prediction API
export const mlApi = {
  getModelInfo: () => api.get('/ml/info'),
  trainModel: (nSamples = 5000, useRealData = true) => 
    api.post('/ml/train', null, { params: { n_samples: nSamples, use_real_data: useRealData } }),
  predict: (data) => api.post('/ml/predict', data),
  // NEW: Predict with automatic weather fetching from NASA POWER
  predictAutoWeather: (data) => api.post('/ml/predict/auto-weather', data),
  predictBatch: (predictions) => api.post('/ml/predict/batch', { predictions }),
  getFeatureImportance: () => api.get('/ml/feature-importance'),
  getCropSuitability: (crop, latitude, longitude, tempAvg, precipitation) =>
    api.get(`/ml/crop-suitability/${crop}`, {
      params: { latitude, longitude, temp_avg: tempAvg, precipitation }
    }),
  compareCrops: (latitude, longitude, tempAvg, precipitation) =>
    api.get('/ml/compare-crops', {
      params: { latitude, longitude, temp_avg: tempAvg, precipitation }
    }),
}

export default api
