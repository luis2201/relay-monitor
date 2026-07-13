import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, MailCheck, MailX, ServerCrash } from 'lucide-react'
import { getHealth, getRecentEvents, getStatsToday } from '../api/relayMonitorApi'
import Header from '../components/Header'
import StatCard from '../components/StatCard'
import EventsTable from '../components/EventsTable'
import { useAuth } from '../context/useAuth'

const EMPTY_STATS = {
  sent: 0,
  deferred: 0,
  bounced: 0,
  total: 0,
}

function Dashboard() {
  const { logout, user } = useAuth()
  const [stats, setStats] = useState(EMPTY_STATS)
  const [events, setEvents] = useState([])
  const [backendOnline, setBackendOnline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)

    try {
      await getHealth()
      const [statsResponse, eventsResponse] = await Promise.all([
        getStatsToday(),
        getRecentEvents(),
      ])

      setStats(normalizeStats(statsResponse))
      setEvents(Array.isArray(eventsResponse) ? eventsResponse.map(normalizeEvent) : [])
      setBackendOnline(true)
      setError('')
      setLastUpdated(new Date())
    } catch (requestError) {
      console.error(requestError)
      setBackendOnline(false)
      setError('No se pudo conectar con el backend relay-monitor.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()

    const intervalId = window.setInterval(loadDashboard, 10000)

    return () => window.clearInterval(intervalId)
  }, [loadDashboard])

  const statCards = useMemo(() => [
    {
      title: 'Enviados',
      value: stats.sent,
      tone: 'sent',
      icon: MailCheck,
    },
    {
      title: 'Diferidos',
      value: stats.deferred,
      tone: 'deferred',
      icon: Clock,
    },
    {
      title: 'Rebotados',
      value: stats.bounced,
      tone: 'bounced',
      icon: MailX,
    },
    {
      title: 'Total',
      value: stats.total,
      tone: 'total',
      icon: CheckCircle2,
    },
  ], [stats])

  return (
    <main className="dashboard">
      <Header
        backendOnline={backendOnline}
        loading={loading}
        onRefresh={loadDashboard}
        onLogout={logout}
        user={user}
      />

      {error ? (
        <div className="alert" role="alert">
          <ServerCrash size={20} aria-hidden="true" />
          {error}
        </div>
      ) : null}

      <section className="stats-grid" aria-label="Estadisticas del dia">
        {statCards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </section>

      <EventsTable events={events} />

      <footer className="dashboard-footer">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>
          Actualizacion automatica cada 10 segundos
          {lastUpdated ? ` · Ultima lectura: ${formatTime(lastUpdated)}` : ''}
        </span>
      </footer>
    </main>
  )
}

function normalizeStats(payload) {
  return {
    sent: safeNumber(payload?.sent),
    deferred: safeNumber(payload?.deferred),
    bounced: safeNumber(payload?.bounced),
    total: safeNumber(payload?.total),
  }
}

function normalizeEvent(event) {
  return {
    id: event?.id,
    fecha: event?.fecha || event?.occurred_at || event?.created_at || '',
    queue_id: event?.queue_id || '',
    destinatario: event?.destinatario || event?.recipient || '',
    relay_destino: event?.relay_destino || event?.relay || '',
    estado: event?.estado || event?.status || '',
    dsn: event?.dsn || '',
    delay: event?.delay,
    respuesta: event?.respuesta || event?.smtp_response || event?.raw_log || '',
  }
}

function safeNumber(value) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatTime(date) {
  return new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

export default Dashboard
