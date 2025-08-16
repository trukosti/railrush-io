const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const GameManager = require('./game/GameManager');
const DatabaseManager = require('./database/DatabaseManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Game manager instance
const gameManager = new GameManager(io);
const dbManager = new DatabaseManager();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Player join game
  socket.on('joinGame', (data) => {
    gameManager.handlePlayerJoin(socket, data);
  });
  
  // Player input
  socket.on('playerInput', (data) => {
    gameManager.handlePlayerInput(socket, data);
  });
  
  // Player place rail
  socket.on('placeRail', (data) => {
    gameManager.handlePlaceRail(socket, data);
  });
  
  // Player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    gameManager.handlePlayerDisconnect(socket);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', players: gameManager.getPlayerCount() });
});

// Game stats endpoint
app.get('/stats', (req, res) => {
  res.json({
    activeGames: gameManager.getActiveGameCount(),
    totalPlayers: gameManager.getPlayerCount(),
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚂 RailRush.io server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Stats: http://localhost:${PORT}/stats`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 