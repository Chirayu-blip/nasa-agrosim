import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const { user, logout, isAuthenticated } = useAuth()

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isAuthenticated || !user) return null

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {user.display_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || '?'}
        </div>
        <span className="text-white font-medium hidden sm:block">{user.display_name || user.username}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
          {/* User info */}
          <div className="p-4 bg-gray-800/50 border-b border-gray-700">
            <p className="font-semibold text-white">{user.display_name || user.username}</p>
            <p className="text-sm text-gray-400">@{user.username}</p>
          </div>

          {/* Stats */}
          <div className="p-4 border-b border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-xl font-bold text-green-400">{user.total_games_played || 0}</p>
                <p className="text-xs text-gray-500">Games</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-yellow-400">{user.highest_score || 0}</p>
                <p className="text-xs text-gray-500">Best Score</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-blue-400">{user.total_crops_harvested || 0}</p>
                <p className="text-xs text-gray-500">Crops</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-400">
                  ${(user.total_revenue_earned || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => {
                logout()
                setIsOpen(false)
              }}
              className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
