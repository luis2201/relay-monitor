const { getDb } = require('./db');

const EMPTY_STATS = {
  sent: 0,
  deferred: 0,
  bounced: 0,
  total: 0
};

async function getTodayStats() {
  const db = getDb();
  const rows = await db.all(
    `
      SELECT status, COUNT(*) AS count
      FROM smtp_events
      WHERE date(COALESCE(occurred_at, created_at)) = date('now')
      GROUP BY status
    `
  );

  return rows.reduce((stats, row) => {
    const count = Number(row.count);

    if (Object.prototype.hasOwnProperty.call(stats, row.status)) {
      stats[row.status] = count;
    }

    stats.total += count;
    return stats;
  }, { ...EMPTY_STATS });
}

module.exports = {
  getTodayStats
};
