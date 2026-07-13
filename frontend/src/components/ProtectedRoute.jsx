import Login from '../pages/Login'
import { useAuth } from '../context/useAuth'

function ProtectedRoute({ children }) {
  const { checkingSession, isAuthenticated } = useAuth()

  if (checkingSession) {
    return (
      <main className="session-loading">
        Validando sesion...
      </main>
    )
  }

  return isAuthenticated ? children : <Login />
}

export default ProtectedRoute
