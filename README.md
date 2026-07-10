# relay-monitor

Backend mínimo para monitorear en tiempo real los envíos del relay SMTP Postfix.

## Primera fase

- Node.js + Express
- Socket.IO
- SQLite
- Docker + docker-compose
- Lectura local desde `backend/logs/postfix.log`
- Lectura en producción desde `journalctl -f -u postfix`

No incluye frontend, Apache, SSL ni PostgreSQL en esta fase.

## Configuración local

El backend usa `backend/.env`:

```env
PORT=4100
NODE_ENV=development
DB_PATH=/app/data/relay-monitor.sqlite
LOG_SOURCE=file
LOG_FILE=/app/logs/postfix.log
JOURNAL_UNIT=postfix
```

Para desarrollo local se debe mantener:

```env
LOG_SOURCE=file
LOG_FILE=/app/logs/postfix.log
```

## Ejecutar con Docker

```bash
docker compose up --build
```

La API queda disponible en `http://localhost:4100`.

## Endpoints

### `GET /health`

```json
{
  "status": "ok",
  "service": "relay-monitor"
}
```

### `GET /api/events/recent`

Devuelve los últimos 100 eventos SMTP registrados.

### `GET /api/stats/today`

```json
{
  "sent": 0,
  "deferred": 0,
  "bounced": 0,
  "total": 0
}
```

## Eventos en tiempo real

Socket.IO emite:

- `smtp:event` cuando se registra un evento Postfix nuevo.
- `smtp:stats` cuando cambian las estadísticas del día.

## Parser Postfix

El parser detecta líneas con:

- `status=sent`
- `status=deferred`
- `status=bounced`

Y extrae cuando existe:

- fecha
- queue_id
- destinatario
- relay destino
- estado
- dsn
- delay
- respuesta SMTP
- raw_log

## Producción

En el VPS `relay.sucre.gob.ec` se debe cambiar:

```env
LOG_SOURCE=journalctl
JOURNAL_UNIT=postfix
```

El watcher ejecutará:

```bash
journalctl -f -u postfix
```
