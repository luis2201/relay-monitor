import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getMe,
  login as loginRequest,
  setAuthToken,
  setUnauthorizedHandler,
} from '../api/relayMonitorApi'
import { AuthContext } from './authContext'

const TOKEN_STORAGE_KEY = 'relay-monitor-token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(Boolean(token))

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    if (!token) {
      setCheckingSession(false)
      return
    }

    setAuthToken(token)
    setCheckingSession(true)

    getMe()
      .then((response) => {
        setUser(response.user)
      })
      .catch(() => {
        logout()
      })
      .finally(() => {
        setCheckingSession(false)
      })
  }, [logout, token])

  const login = useCallback(async (username, password) => {
    const response = await loginRequest(username, password)

    window.localStorage.setItem(TOKEN_STORAGE_KEY, response.token)
    setAuthToken(response.token)
    setToken(response.token)
    setUser(response.user)

    return response.user
  }, [])

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token && user),
    checkingSession,
    login,
    logout,
  }), [checkingSession, login, logout, token, user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
