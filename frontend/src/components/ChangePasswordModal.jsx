import { useState } from 'react'
import { KeyRound, X } from 'lucide-react'
import { useAuth } from '../context/useAuth'

function ChangePasswordModal({ onClose }) {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('La confirmacion no coincide.')
      return
    }

    setLoading(true)

    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Contraseña actualizada correctamente.')
    } catch (requestError) {
      console.error(requestError)
      const status = requestError.response?.status

      if (status === 401) {
        setError('La contraseña actual no es correcta.')
      } else if (status === 400) {
        setError(requestError.response?.data?.message || 'Revise los datos ingresados.')
      } else {
        setError('No se pudo cambiar la contraseña.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
        <div className="modal-heading">
          <div>
            <h2 id="change-password-title">Cambiar contraseña</h2>
            <p>Actualice su clave de acceso.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form className="password-form" onSubmit={handleSubmit}>
          <label>
            Contraseña actual
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>

          <label>
            Nueva contraseña
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>

          <label>
            Confirmar nueva contraseña
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>

          {error ? <div className="form-error" role="alert">{error}</div> : null}
          {message ? <div className="form-success" role="status">{message}</div> : null}

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={loading}>
              <KeyRound size={18} aria-hidden="true" />
              {loading ? 'Guardando' : 'Guardar clave'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ChangePasswordModal
