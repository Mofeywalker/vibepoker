import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import type {
    Room,
    Player,
    CardValue,
    Results,
    EstimationHistoryItem,
    ServerToClientEvents,
    ClientToServerEvents
} from './src/types/index.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory room storage
const rooms = new Map<string, Room>();

// Fibonacci sequence for suggestions
const FIBONACCI = [0, 1, 2, 3, 5, 8, 13, 21];

function calculateResults(players: Player[]): Results {
    const validCards = players
        .map(p => p.selectedCard)
        .filter((card): card is CardValue => card !== null && card !== '?' && card !== '∞');

    const numericValues = validCards
        .map(card => parseInt(card, 10))
        .filter(n => !isNaN(n));

    // Count occurrences for mode and breakdown
    const countMap = new Map<CardValue, number>();
    players.forEach(p => {
        if (p.selectedCard) {
            countMap.set(p.selectedCard, (countMap.get(p.selectedCard) || 0) + 1);
        }
    });

    const breakdown = Array.from(countMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

    // Mode (most common value)
    const mode = breakdown.length > 0 ? breakdown[0].value : null;

    if (numericValues.length === 0) {
        return { average: null, median: null, mode, suggestion: null, breakdown };
    }

    // Average
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const average = sum / numericValues.length;

    // Median
    const sorted = [...numericValues].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

    // Suggestion: closest Fibonacci number to average
    let suggestion = FIBONACCI[0];
    let minDiff = Math.abs(average - FIBONACCI[0]);
    for (const fib of FIBONACCI) {
        const diff = Math.abs(average - fib);
        if (diff < minDiff) {
            minDiff = diff;
            suggestion = fib;
        }
    }

    return { average: Math.round(average * 10) / 10, median, mode, suggestion, breakdown };
}

console.log('Starting server...');

app.prepare().then(() => {
    console.log('Next.js prepared, creating HTTP server...');

    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        let currentRoomId: string | null = null;

        socket.on('create-room', (playerName, callback) => {
            const roomId = uuidv4().substring(0, 8);
            const player: Player = {
                id: socket.id,
                name: playerName,
                selectedCard: null,
                isHost: true
            };

            const room: Room = {
                id: roomId,
                hostId: socket.id,
                topic: null,
                players: [player],
                isRevealed: false,
                results: null,
                history: []
            };

            rooms.set(roomId, room);
            socket.join(roomId);
            currentRoomId = roomId;

            console.log(`Room created: ${roomId} by ${playerName}`);
            callback(roomId);
            socket.emit('room-state', room);
        });

        socket.on('join-room', (roomId, playerName, callback) => {
            const room = rooms.get(roomId);

            if (!room) {
                callback(false, 'Raum nicht gefunden');
                return;
            }

            // Check if player name already exists
            if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
                callback(false, 'Name bereits vergeben');
                return;
            }

            const player: Player = {
                id: socket.id,
                name: playerName,
                selectedCard: null,
                isHost: false
            };

            room.players.push(player);
            socket.join(roomId);
            currentRoomId = roomId;

            console.log(`${playerName} joined room ${roomId}`);
            callback(true);

            // Notify all players in the room
            io.to(roomId).emit('room-state', room);
        });

        socket.on('rejoin-room', (roomId, playerName, callback) => {
            const room = rooms.get(roomId);

            if (!room) {
                callback(false);
                return;
            }

            // Check if player name exists but has no socket (disconnected)
            const existingPlayer = room.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());

            if (existingPlayer) {
                // Update the socket ID for the existing player
                existingPlayer.id = socket.id;

                // If this player is the host, update the room's hostId
                if (existingPlayer.isHost) {
                    room.hostId = socket.id;
                }

                socket.join(roomId);
                currentRoomId = roomId;

                console.log(`${playerName} rejoined room ${roomId}`);
                callback(true);
                io.to(roomId).emit('room-state', room);
            } else {
                // Player doesn't exist, add them
                const player: Player = {
                    id: socket.id,
                    name: playerName,
                    selectedCard: null,
                    isHost: room.players.length === 0 // Make host if first player
                };

                if (room.players.length === 0) {
                    room.hostId = socket.id;
                }

                room.players.push(player);
                socket.join(roomId);
                currentRoomId = roomId;

                console.log(`${playerName} joined room ${roomId} (via rejoin)`);
                callback(true);
                io.to(roomId).emit('room-state', room);
            }
        });

        socket.on('select-card', (roomId, card) => {
            const room = rooms.get(roomId);
            if (!room || room.isRevealed) return;

            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;

            console.log(`Player ${player.name} (${socket.id}) selected card: ${card}`);

            player.selectedCard = card;

            // Important: Emit room-state so clients know their own selection (and potentially others' status)
            io.to(roomId).emit('room-state', room);

            // Also keep emitting card-selected for backward compatibility or specific animations
            io.to(roomId).emit('card-selected', socket.id, card !== null);
        });

        socket.on('update-topic', (roomId, topic) => {
            const room = rooms.get(roomId);
            if (!room) return;

            // Only host can update topic
            if (room.hostId !== socket.id) return;

            room.topic = topic;
            io.to(roomId).emit('room-state', room);
        });

        socket.on('reveal-cards', (roomId) => {
            const room = rooms.get(roomId);
            if (!room) return;

            // Only host can reveal
            if (room.hostId !== socket.id) return;

            room.isRevealed = true;
            room.results = calculateResults(room.players);

            io.to(roomId).emit('cards-revealed', room);
        });

        socket.on('accept-estimation', (roomId, value) => {
            console.log(`Received accept-estimation for room ${roomId} with value ${value}`);
            const room = rooms.get(roomId);
            if (!room) {
                console.log(`Room ${roomId} not found`);
                return;
            }

            // Only host can accept estimation
            if (room.hostId !== socket.id) {
                console.log(`User ${socket.id} is not host (host is ${room.hostId})`);
                socket.emit('error', 'Only host can accept estimation');
                return;
            }

            if (!room.history) {
                room.history = [];
            }

            const historyItem: EstimationHistoryItem = {
                topic: room.topic || 'Unknown Topic',
                value: value,
                timestamp: Date.now()
            };

            room.history.push(historyItem);

            // Optional: Auto-reset round or just let them see it in history?
            // Usually you accept and then reset. For now just save and emit.

            io.to(roomId).emit('room-state', room);
        });

        socket.on('reset-round', (roomId) => {
            const room = rooms.get(roomId);
            if (!room) return;

            // Only host can reset
            if (room.hostId !== socket.id) return;

            room.isRevealed = false;
            room.results = null;
            room.topic = null; // Reset topic for new round
            room.players.forEach(p => {
                p.selectedCard = null;
            });

            io.to(roomId).emit('round-reset');
            io.to(roomId).emit('room-state', room);
        });

        socket.on('request-room-state', () => {
            if (currentRoomId) {
                const room = rooms.get(currentRoomId);
                if (room) {
                    socket.emit('room-state', room);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            if (currentRoomId) {
                const room = rooms.get(currentRoomId);
                if (room) {
                    room.players = room.players.filter(p => p.id !== socket.id);

                    // If host left, assign new host
                    if (room.hostId === socket.id && room.players.length > 0) {
                        room.hostId = room.players[0].id;
                        room.players[0].isHost = true;
                    }

                    // If room is empty, add grace period before deletion (handles page refresh)
                    if (room.players.length === 0) {
                        const roomIdToDelete = currentRoomId;
                        console.log(`Room ${roomIdToDelete} is empty, will delete in 30 seconds...`);

                        setTimeout(() => {
                            const roomCheck = rooms.get(roomIdToDelete);
                            // Only delete if still empty
                            if (roomCheck && roomCheck.players.length === 0) {
                                rooms.delete(roomIdToDelete);
                                console.log(`Room ${roomIdToDelete} deleted (empty after grace period)`);
                            }
                        }, 30000); // 30 second grace period
                    } else {
                        io.to(currentRoomId).emit('player-left', socket.id);
                        io.to(currentRoomId).emit('room-state', room);
                    }
                }
            }
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
}).catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});
