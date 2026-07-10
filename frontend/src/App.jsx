import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/useAuth'

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

function AuthenticatedApp() {
  const { checkingSession, isAuthenticated } = useAuth()

  if (checkingSession) {
    return (
      <main className="session-loading">
        Validando sesion...
      </main>
    )
  }

  return isAuthenticated ? <Dashboard /> : <Login />
}

export default App
