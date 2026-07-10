import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import StatusBadge from './StatusBadge'

const PAGE_SIZE = 20

function EventsTable({ events }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return events.filter((event) => {
      const status = String(event.estado || '').toLowerCase()
      const matchesStatus = statusFilter === 'all' || status === statusFilter

      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return [
        event.fecha,
        event.queue_id,
        event.destinatario,
        event.relay_destino,
        event.estado,
        event.dsn,
        event.delay,
        event.respuesta,
      ]
        .map((value) => safeText(value, '').toLowerCase())
        .some((value) => value.includes(normalizedSearch))
    })
  }, [events, searchTerm, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const visibleEvents = filteredEvents.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  if (!events.length) {
    return (
      <section className="panel empty-panel">
        No hay eventos recientes registrados.
      </section>
    )
  }

  return (
    <section className="panel events-panel">
      <div className="panel-heading">
        <h2>Ultimos eventos SMTP</h2>
        <span>{filteredEvents.length} de {events.length} registros</span>
      </div>

      <div className="table-toolbar">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Buscar eventos</span>
          <input
            type="search"
            placeholder="Buscar por destinatario, queue ID, relay, respuesta..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        <label className="status-filter">
          <span>Estado</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Todos</option>
            <option value="sent">Enviados</option>
            <option value="deferred">Diferidos</option>
            <option value="bounced">Rebotados</option>
          </select>
        </label>
      </div>

      {filteredEvents.length ? (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Queue ID</th>
                  <th>Destinatario</th>
                  <th>Relay destino</th>
                  <th>Estado</th>
                  <th>DSN</th>
                  <th>Delay</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map((event, index) => (
                  <tr key={event.id || `${event.queue_id}-${pageStart + index}`}>
                    <td>{formatDate(event.fecha)}</td>
                    <td className="mono">{safeText(event.queue_id)}</td>
                    <td>{safeText(event.destinatario)}</td>
                    <td>{safeText(event.relay_destino)}</td>
                    <td>
                      <StatusBadge status={event.estado} />
                    </td>
                    <td className="mono">{safeText(event.dsn)}</td>
                    <td>{formatDelay(event.delay)}</td>
                    <td className="response-cell">{safeText(event.respuesta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span>
              Mostrando {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filteredEvents.length)}
              {' '}de {filteredEvents.length}
            </span>
            <div className="pagination-actions">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Anterior
              </button>
              <strong>
                Pagina {currentPage} de {totalPages}
              </strong>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-filter">
          No hay eventos que coincidan con la busqueda o el filtro seleccionado.
        </div>
      )}
    </section>
  )
}

function safeText(value, fallback = '-') {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  return String(value)
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return safeText(value)
  }

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

function formatDelay(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return safeText(value)
  }

  return `${numberValue.toFixed(2)} s`
}

export default EventsTable
