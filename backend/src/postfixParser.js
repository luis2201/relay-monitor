const STATUS_RE = /\bstatus=(sent|deferred|bounced)\b/i;
const QUEUE_ID_RE = /postfix\/[^\[]+\[\d+\]:\s+([A-Z0-9]+):/i;
const TO_RE = /\bto=<([^>]+)>/i;
const RELAY_RE = /\brelay=([^,]+(?:\[[^\]]+\])?(?::\d+)?)/i;
const DSN_RE = /\bdsn=([^,\s]+)/i;
const DELAY_RE = /\bdelay=([0-9.]+)/i;
const RESPONSE_RE = /\bstatus=(?:sent|deferred|bounced)\s+\((.*)\)\s*$/i;
const SYSLOG_DATE_RE = /^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})/;

function parseSyslogDate(rawLine) {
  const match = rawLine.match(SYSLOG_DATE_RE);

  if (!match) {
    return null;
  }

  const [, month, day, time] = match;
  const year = new Date().getFullYear();
  const parsed = new Date(`${month} ${day} ${year} ${time}`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function firstMatch(rawLine, regex) {
  const match = rawLine.match(regex);
  return match ? match[1] : null;
}

function parsePostfixLine(rawLine) {
  const line = rawLine.trim();
  const status = firstMatch(line, STATUS_RE);

  if (!status) {
    return null;
  }

  const delay = firstMatch(line, DELAY_RE);

  return {
    occurred_at: parseSyslogDate(line),
    queue_id: firstMatch(line, QUEUE_ID_RE),
    recipient: firstMatch(line, TO_RE),
    relay: firstMatch(line, RELAY_RE),
    status: status.toLowerCase(),
    dsn: firstMatch(line, DSN_RE),
    delay: delay === null ? null : Number(delay),
    smtp_response: firstMatch(line, RESPONSE_RE),
    raw_log: line
  };
}

module.exports = {
  parsePostfixLine
};
