import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
})

let onUnauthorized = null

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized()
    }

    return Promise.reject(error)
  },
)

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete api.defaults.headers.common.Authorization
}

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export async function getHealth() {
  const response = await api.get('/health')
  return response.data
}

export async function getStatsToday() {
  const response = await api.get('/api/stats/today')
  return response.data
}

export async function getRecentEvents() {
  const response = await api.get('/api/events/recent')
  return response.data
}
