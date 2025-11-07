import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:4321',
    methods: ['GET', 'POST'],
  },
});

// Game state
interface Player {
  id: string;
  name: string;
  score: number;
  ready: boolean;
}

interface GameRoom {
  id: string;
  players: Player[];
  currentQuestion: number;
  questions: TriviaQuestion[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

// Sample questions (in production, load from database)
const triviaQuestions: TriviaQuestion[] = [
  {
    id: 1,
    question: 'מה זה React?',
    options: ['Framework', 'Library', 'Language', 'Database'],
    correctAnswer: 1,
    category: 'Frontend',
  },
  {
    id: 2,
    question: 'מה זה TypeScript?',
    options: ['Superset של JavaScript', 'Framework', 'Database', 'OS'],
    correctAnswer: 0,
    category: 'Programming',
  },
  {
    id: 3,
    question: 'מה זה Astro?',
    options: ['Framework', 'Library', 'Build Tool', 'All of the above'],
    correctAnswer: 3,
    category: 'Web Development',
  },
];

const rooms = new Map<string, GameRoom>();
const players = new Map<string, { roomId: string; socketId: string }>();

// Matchmaking
function findOrCreateRoom(): string {
  // Find a waiting room with space
  for (const [roomId, room] of rooms.entries()) {
    if (room.status === 'waiting' && room.players.length < 4) {
      return roomId;
    }
  }

  // Create new room
  const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const room: GameRoom = {
    id: roomId,
    players: [],
    currentQuestion: 0,
    questions: [...triviaQuestions].sort(() => Math.random() - 0.5).slice(0, 10),
    status: 'waiting',
    createdAt: Date.now(),
  };
  rooms.set(roomId, room);

  return roomId;
}

function startGame(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'waiting') return;

  room.status = 'playing';
  room.currentQuestion = 0;

  io.to(roomId).emit('game:start', {
    question: room.questions[0],
    questionNumber: 1,
    totalQuestions: room.questions.length,
  });

  // Next question after 15 seconds
  setTimeout(() => nextQuestion(roomId), 15000);
}

function nextQuestion(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return;

  room.currentQuestion++;

  if (room.currentQuestion >= room.questions.length) {
    endGame(roomId);
    return;
  }

  io.to(roomId).emit('game:question', {
    question: room.questions[room.currentQuestion],
    questionNumber: room.currentQuestion + 1,
    totalQuestions: room.questions.length,
  });

  setTimeout(() => nextQuestion(roomId), 15000);
}

function endGame(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.status = 'finished';

  const leaderboard = room.players
    .map((p) => ({ name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);

  io.to(roomId).emit('game:end', { leaderboard });

  // Clean up after 1 minute
  setTimeout(() => {
    rooms.delete(roomId);
  }, 60000);
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Send available rooms info when connecting
  socket.on('game:rooms', () => {
    const waitingRooms = Array.from(rooms.values())
      .filter((room) => room.status === 'waiting' && room.players.length < 4)
      .map((room) => ({
        id: room.id,
        players: room.players.map((p) => ({ name: p.name, score: p.score })),
        playerCount: room.players.length,
      }));
    socket.emit('game:rooms', { rooms: waitingRooms });
  });

  socket.on('game:join', (data: { name: string }) => {
    const roomId = findOrCreateRoom();
    const room = rooms.get(roomId);

    if (!room) return;

    const player: Player = {
      id: socket.id,
      name: data.name || `Player ${socket.id.slice(0, 6)}`,
      score: 0,
      ready: false,
    };

    room.players.push(player);
    players.set(socket.id, { roomId, socketId: socket.id });

    socket.join(roomId);

    // Notify all players in the room (including those who haven't joined yet)
    io.to(roomId).emit('game:players', {
      players: room.players.map((p) => ({ name: p.name, score: p.score })),
    });

    // Also notify all connected clients about available rooms (for live updates)
    const waitingRooms = Array.from(rooms.values())
      .filter((r) => r.status === 'waiting' && r.players.length < 4)
      .map((r) => ({
        id: r.id,
        players: r.players.map((p) => ({ name: p.name, score: p.score })),
        playerCount: r.players.length,
      }));
    io.emit('game:rooms', { rooms: waitingRooms });

    // Auto-start if 2-4 players (start immediately when 2+ players join)
    if (room.players.length >= 2 && room.players.length <= 4 && room.status === 'waiting') {
      // Start game after 3 seconds to allow all players to see the room
      setTimeout(() => {
        const currentRoom = rooms.get(roomId);
        if (currentRoom && currentRoom.players.length >= 2 && currentRoom.status === 'waiting') {
          startGame(roomId);
        }
      }, 3000);
    }
  });

  socket.on('game:answer', (data: { answer: number }) => {
    const playerData = players.get(socket.id);
    if (!playerData) return;

    const room = rooms.get(playerData.roomId);
    if (!room || room.status !== 'playing') return;

    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    const currentQuestion = room.questions[room.currentQuestion];
    if (data.answer === currentQuestion.correctAnswer) {
      player.score += 10;
      socket.emit('game:result', { correct: true, score: player.score });
    } else {
      socket.emit('game:result', { correct: false, score: player.score });
    }

    // Update all players with new scores
    io.to(playerData.roomId).emit('game:scores', {
      players: room.players.map((p) => ({ name: p.name, score: p.score })),
    });
  });

  socket.on('disconnect', () => {
    const playerData = players.get(socket.id);
    if (playerData) {
      const room = rooms.get(playerData.roomId);
      if (room) {
        const playerName = room.players.find((p) => p.id === socket.id)?.name || 'Unknown';
        room.players = room.players.filter((p) => p.id !== socket.id);
        
        // Notify all players in the room about the disconnection
        io.to(playerData.roomId).emit('game:players', {
          players: room.players.map((p) => ({ name: p.name, score: p.score })),
        });

        // Also notify all connected clients about available rooms (for live updates)
        const waitingRooms = Array.from(rooms.values())
          .filter((r) => r.status === 'waiting' && r.players.length < 4)
          .map((r) => ({
            id: r.id,
            players: r.players.map((p) => ({ name: p.name, score: p.score })),
            playerCount: r.players.length,
          }));
        io.emit('game:rooms', { rooms: waitingRooms });

        // If game is playing and player left, continue the game
        // If game is waiting and no players left, delete room
        if (room.players.length === 0) {
          rooms.delete(playerData.roomId);
        } else if (room.status === 'waiting' && room.players.length < 2) {
          // Cancel auto-start if not enough players
          // (The timeout will check again when next player joins)
        }
      }
      players.delete(socket.id);
    }
    console.log('Player disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
});

