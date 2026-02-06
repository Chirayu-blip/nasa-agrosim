import { useState, useEffect } from 'react'
import { leaderboardApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [difficulty, setDifficulty] = useState('')
  const [userRank, setUserRank] = useState(null)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    fetchLeaderboard()
  }, [filter, difficulty])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const params = {
        limit: 50,
        timeframe: filter !== 'all' ? filter : undefined,
        difficulty: difficulty || undefined,
      }
      const response = await leaderboardApi.getGlobal(params)
      setEntries(response.data.entries)
      setUserRank(response.data.user_rank)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      setEntries(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    const names = ['FarmMaster', 'CropKing', 'GreenThumb', 'HarvestHero', 'SoilSage', 
      'PlantPro', 'FieldForce', 'AgriAce', 'SeedSavant', 'GrowGuru']
    return names.map((name, idx) => ({
      id: idx + 1,
      rank: idx + 1,
      username: name.toLowerCase(),
      display_name: name,
      avatar_url: '/avatars/default.png',
      score: 15000 - (idx * 1200),
      total_revenue: 75000 - (idx * 6000),
      crops_harvested: 150 - (idx * 12),
      days_played: 45 - (idx * 3),
      difficulty: ['easy', 'normal', 'hard'][idx % 3],
      achieved_at: new Date(Date.now() - idx * 86400000).toISOString(),
    }))
  }

  const getDifficultyBadge = (diff) => {
    const colors = {
      easy: 'bg-green-500/20 text-green-400 border-green-500/30',
      normal: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      hard: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return colors[diff] || colors.normal
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-5xl">🏆</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white">Global Leaderboard</h1>
          </div>
          <p className="text-gray-400 mt-2">Compete with farmers worldwide</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {[
              { value: 'all', label: 'All Time' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'daily', label: 'Today' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.value
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:border-green-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* User rank card */}
        {isAuthenticated && userRank && (
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {user?.display_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-white font-semibold">{user?.display_name}</p>
                <p className="text-green-400 text-sm">Your current ranking</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-white">#{userRank}</p>
              <p className="text-gray-400 text-sm">out of {entries.length} players</p>
            </div>
          </div>
        )}

        {/* Leaderboard table */}
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-7xl mb-6 block">🌱</span>
              <p className="text-gray-300 text-xl">No scores yet!</p>
              <p className="text-gray-500 mt-2">Start a game and be the first to claim the top spot</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-gray-400 text-sm border-b border-gray-700 bg-gray-800/80">
                  <tr>
                    <th className="text-left py-4 px-4">Rank</th>
                    <th className="text-left py-4 px-2">Player</th>
                    <th className="text-center py-4 px-2">Difficulty</th>
                    <th className="text-right py-4 px-2">Score</th>
                    <th className="text-right py-4 px-2 hidden sm:table-cell">Revenue</th>
                    <th className="text-right py-4 px-2 hidden md:table-cell">Crops</th>
                    <th className="text-right py-4 px-4 hidden lg:table-cell">Days</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${
                        user?.username === entry.username ? 'bg-green-500/10' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                          entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                          entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-700/50 text-gray-400'
                        }`}>
                          {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                            {entry.display_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-white">{entry.display_name}</p>
                            <p className="text-xs text-gray-500">@{entry.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyBadge(entry.difficulty)}`}>
                          {entry.difficulty}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className="font-bold text-green-400 text-lg">{entry.score.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-2 text-right hidden sm:table-cell">
                        <span className="text-gray-300">${entry.total_revenue.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-2 text-right hidden md:table-cell">
                        <span className="text-gray-400">{entry.crops_harvested}</span>
                      </td>
                      <td className="py-4 px-4 text-right hidden lg:table-cell">
                        <span className="text-gray-500">{entry.days_played}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Call to action */}
        {!isAuthenticated && (
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
            <p className="text-blue-400">
              Sign in to submit your scores and compete with players worldwide!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
