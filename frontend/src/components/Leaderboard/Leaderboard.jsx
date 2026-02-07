import { useState, useEffect } from 'react'
import { leaderboardApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function Leaderboard({ isOpen, onClose }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'weekly', 'daily'
  const [difficulty, setDifficulty] = useState('') // '', 'easy', 'normal', 'hard'
  const [userRank, setUserRank] = useState(null)
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard()
    }
  }, [isOpen, filter, difficulty])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const params = {
        limit: 20,
        timeframe: filter !== 'all' ? filter : undefined,
        difficulty: difficulty || undefined,
      }
      const response = await leaderboardApi.getGlobal(params)
      setEntries(response.data.entries)
      setUserRank(response.data.user_rank)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      // Show mock data for demo
      setEntries(generateMockData())
    } finally {
      setLoading(false)
    }
  }

  const generateMockData = () => {
    const names = ['FarmMaster', 'CropKing', 'GreenThumb', 'HarvestHero', 'SoilSage']
    return names.map((name, idx) => ({
      id: idx + 1,
      rank: idx + 1,
      username: name,
      display_name: name,
      avatar_url: '/avatars/default.png',
      score: 10000 - (idx * 1500),
      total_revenue: 50000 - (idx * 8000),
      crops_harvested: 100 - (idx * 15),
      days_played: 30 - idx,
      difficulty: 'normal',
      achieved_at: new Date().toISOString(),
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full border border-yellow-500/30 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {['all', 'weekly', 'daily'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-green-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* User rank banner */}
        {isAuthenticated && userRank && (
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-medium">Your Rank</span>
              <span className="text-2xl font-bold text-white">#{userRank}</span>
            </div>
          </div>
        )}

        {/* Leaderboard table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🌱</span>
              <p className="text-gray-400 text-lg">No scores yet!</p>
              <p className="text-gray-500 text-sm mt-2">Be the first to claim the top spot</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="text-gray-400 text-sm border-b border-gray-700">
                <tr>
                  <th className="text-left py-2 px-2">Rank</th>
                  <th className="text-left py-2">Player</th>
                  <th className="text-right py-2">Score</th>
                  <th className="text-right py-2 hidden sm:table-cell">Revenue</th>
                  <th className="text-right py-2 hidden md:table-cell">Crops</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                      user?.username === entry.username ? 'bg-green-500/10' : ''
                    }`}
                  >
                    <td className="py-3 px-2">
                      <span className={`font-bold text-lg ${
                        entry.rank === 1 ? 'text-yellow-400' :
                        entry.rank === 2 ? 'text-gray-300' :
                        entry.rank === 3 ? 'text-orange-400' :
                        'text-gray-500'
                      }`}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {entry.display_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{entry.display_name}</p>
                          <p className="text-xs text-gray-500">@{entry.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-bold text-green-400">{entry.score.toLocaleString()}</span>
                    </td>
                    <td className="py-3 text-right hidden sm:table-cell">
                      <span className="text-gray-300">${entry.total_revenue.toLocaleString()}</span>
                    </td>
                    <td className="py-3 text-right hidden md:table-cell">
                      <span className="text-gray-400">{entry.crops_harvested}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
            <p className="text-blue-400 text-sm">
              Sign in to submit your scores and compete globally!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
