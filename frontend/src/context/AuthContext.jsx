import { useCallback, useEffect, useMemo, useState } from 'react'
import { getMe, login as loginRequest, logout as logoutRequest } from '../api/authApi'
import { setAuthToken, setUnauthorizedHandler } from '../api/relayMonitorApi'
import { AuthContext } from './authContext'

const TOKEN_STORAGE_KEY = 'relay-monitor-token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(Boolean(token))

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    setAuthToken(null)
    setToken(null)
    setUser(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      if (window.localStorage.getItem(TOKEN_STORAGE_KEY)) {
        await logoutRequest()
      }
    } catch (error) {
      console.error(error)
    } finally {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    setUnauthorizedHandler(clearSession)
    return () => setUnauthorizedHandler(null)
  }, [clearSession])

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
        clearSession()
      })
      .finally(() => {
        setCheckingSession(false)
      })
  }, [clearSession, token])

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
