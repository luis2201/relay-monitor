const { getDb } = require('./db');

async function createEvent(event) {
  const db = getDb();

  const result = await db.run(
    `
      INSERT OR IGNORE INTO smtp_events (
        occurred_at,
        queue_id,
        recipient,
        relay,
        status,
        dsn,
        delay,
        smtp_response,
        raw_log
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      event.occurred_at,
      event.queue_id,
      event.recipient,
      event.relay,
      event.status,
      event.dsn,
      event.delay,
      event.smtp_response,
      event.raw_log
    ]
  );

  if (result.changes === 0) {
    return null;
  }

  return {
    id: result.id,
    ...event
  };
}

async function getRecentEvents(limit = 100) {
  const db = getDb();

  return db.all(
    `
      SELECT
        id,
        occurred_at,
        queue_id,
        recipient,
        relay,
        status,
        dsn,
        delay,
        smtp_response,
        raw_log,
        created_at
      FROM smtp_events
      ORDER BY COALESCE(occurred_at, created_at) DESC, id DESC
      LIMIT ?
    `,
    [limit]
  );
}

module.exports = {
  createEvent,
  getRecentEvents
};
