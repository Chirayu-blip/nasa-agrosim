import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import LearnPage from './pages/LearnPage'
import LeaderboardPage from './pages/LeaderboardPage'
import EarlyWarningPage from './pages/EarlyWarningPage'
import MLPredictionPage from './pages/MLPredictionPage'
import Navbar from './components/Navbar'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-sky-100 to-green-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/game" element={<GamePage />} />
              <Route path="/game/:gameId" element={<GamePage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/early-warning" element={<EarlyWarningPage />} />
              <Route path="/ml-prediction" element={<MLPredictionPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
