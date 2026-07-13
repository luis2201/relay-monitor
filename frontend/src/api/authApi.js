import { api } from './relayMonitorApi'

export async function login(username, password) {
  const response = await api.post('/api/auth/login', { username, password })
  return response.data
}

export async function getMe() {
  const response = await api.get('/api/auth/me')
  return response.data
}

export async function logout() {
  const response = await api.post('/api/auth/logout')
  return response.data
}

export async function changePassword(currentPassword, newPassword) {
  const response = await api.post('/api/auth/change-password', {
    currentPassword,
    newPassword,
  })
  return response.data
}
