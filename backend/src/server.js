require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { initDb } = require('./db');
const { LogWatcher } = require('./logWatcher');
const authRoutes = require('./auth/authRoutes');
const authService = require('./auth/authService');
const { verifyToken } = require('./auth/authMiddleware');
const eventRepository = require('./eventRepository');
const statsService = require('./statsService');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4100;
const HOST = process.env.HOST || '127.0.0.1';
const LOG_SOURCE = process.env.LOG_SOURCE || 'file';

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'relay-monitor'
  });
});

app.use('/api/auth', authRoutes);

app.get('/api/events/recent', verifyToken, async (req, res, next) => {
  try {
    const events = await eventRepository.getRecentEvents(100);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

app.get('/api/stats/today', verifyToken, async (req, res, next) => {
  try {
    const stats = await statsService.getTodayStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.emit('connected', {
    message: 'Conectado a relay-monitor',
    service: 'relay-monitor'
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    error: 'internal_server_error'
  });
});

async function start() {
  await initDb();
  await authService.ensureAdminUser();

  const logWatcher = new LogWatcher();

  logWatcher.on('event', async (event) => {
    io.emit('smtp:event', event);
    io.emit('smtp:stats', await statsService.getTodayStats());
  });

  logWatcher.on('error', (error) => {
    console.error(`Log watcher error: ${error.message}`);
  });

  await logWatcher.start();

  server.listen(PORT, HOST, () => {
    console.log('Relay Monitor backend corriendo en ' + HOST + ':' + PORT);
    console.log(`LOG_SOURCE=${LOG_SOURCE}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
