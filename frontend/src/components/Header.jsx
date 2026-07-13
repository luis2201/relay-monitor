import { LogOut, RefreshCcw, Server } from 'lucide-react'

function Header({ backendOnline, loading, onRefresh, onLogout, user }) {
  return (
    <header className="app-header">
      <div className="title-block">
        <div className="app-kicker">
          <Server size={18} aria-hidden="true" />
          Relay SMTP
        </div>
        <h1>Relay Monitor</h1>
        <p>Monitoreo del relay SMTP Postfix</p>
      </div>

      <div className="header-actions">
        <div className="user-chip">
          {user?.name || user?.username || 'Usuario'}
        </div>
        <div className={`backend-status ${backendOnline ? 'online' : 'offline'}`}>
          <span aria-hidden="true" />
          {backendOnline ? 'Online' : 'Offline'}
        </div>
        <button type="button" className="refresh-button" onClick={onRefresh} disabled={loading}>
          <RefreshCcw size={18} aria-hidden="true" />
          {loading ? 'Actualizando' : 'Refrescar'}
        </button>
        <button type="button" className="logout-button" onClick={onLogout}>
          <LogOut size={18} aria-hidden="true" />
          Cerrar sesion
        </button>
      </div>
    </header>
  )
}

export default Header
