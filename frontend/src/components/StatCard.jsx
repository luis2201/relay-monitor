function StatCard({ title, value, tone, icon: Icon }) {
  const displayValue = Number.isFinite(Number(value)) ? Number(value) : 0

  return (
    <article className={`stat-card stat-${tone}`}>
      <div className="stat-icon" aria-hidden="true">
        {Icon ? <Icon size={22} /> : null}
      </div>
      <div>
        <p>{title}</p>
        <strong>{displayValue}</strong>
      </div>
    </article>
  )
}

export default StatCard
