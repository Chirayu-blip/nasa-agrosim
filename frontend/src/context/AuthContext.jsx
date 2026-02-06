import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('agrosim_token')
    const savedUser = localStorage.getItem('agrosim_user')
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem('agrosim_token')
        localStorage.removeItem('agrosim_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const response = await authApi.login(username, password)
    const { access_token, user: userData } = response.data
    
    localStorage.setItem('agrosim_token', access_token)
    localStorage.setItem('agrosim_user', JSON.stringify(userData))
    
    setUser(userData)
    setIsAuthenticated(true)
    
    return userData
  }

  const register = async (userData) => {
    const response = await authApi.register(userData)
    const { access_token, user: newUser } = response.data
    
    localStorage.setItem('agrosim_token', access_token)
    localStorage.setItem('agrosim_user', JSON.stringify(newUser))
    
    setUser(newUser)
    setIsAuthenticated(true)
    
    return newUser
  }

  const logout = () => {
    localStorage.removeItem('agrosim_token')
    localStorage.removeItem('agrosim_user')
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateUser = (userData) => {
    setUser(userData)
    localStorage.setItem('agrosim_user', JSON.stringify(userData))
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
