import { useState } from 'react'
import { Lock, LogIn } from 'lucide-react'
import { useAuth } from '../context/useAuth'

function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(username.trim(), password)
    } catch (requestError) {
      console.error(requestError)
      const status = requestError.response?.status

      if (status === 403) {
        setError('Usuario inactivo.')
      } else if (status === 401) {
        setError('Credenciales incorrectas.')
      } else {
        setError('Backend no disponible.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <img className="login-logo" src="/img/logo_sucre.png" alt="GADM Sucre" />
          <div>
            <span>GADM SUCRE</span>
            <h1>Relay Monitor</h1>
            <p>Acceso institucional al monitoreo del relay SMTP Postfix</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Usuario
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? (
            <div className="login-error" role="alert">
              <Lock size={16} aria-hidden="true" />
              {error}
            </div>
          ) : null}

          <button type="submit" disabled={loading}>
            <LogIn size={18} aria-hidden="true" />
            {loading ? 'Ingresando' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login
