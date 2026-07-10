const STATUS_LABELS = {
  sent: 'Enviado',
  deferred: 'Diferido',
  bounced: 'Rebotado',
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || 'unknown').toLowerCase()
  const label = STATUS_LABELS[normalizedStatus] || safeText(status, 'Sin estado')

  return (
    <span className={`status-badge status-${normalizedStatus}`}>
      {label}
    </span>
  )
}

function safeText(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback
  }

  return String(value)
}

export default StatusBadge
