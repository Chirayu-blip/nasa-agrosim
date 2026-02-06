import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sprout, Gamepad2, BookOpen, Home, Trophy, LogIn } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../context/AuthContext'
import AuthModal from './Auth/AuthModal'
import UserMenu from './Auth/UserMenu'

function Navbar() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/game', label: 'Play', icon: Gamepad2 },
    { path: '/learn', label: 'Learn', icon: BookOpen },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ]

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Sprout className="h-8 w-8 text-green-600" />
              <span className="font-bold text-xl text-gray-800">
                Agro<span className="text-green-600">Sim</span>
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={clsx(
                    'flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors',
                    location.pathname === path
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden md:inline">{label}</span>
                </Link>
              ))}

              {/* Auth section */}
              <div className="ml-2 pl-2 border-l border-gray-200">
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center space-x-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  )
}

export default Navbar
