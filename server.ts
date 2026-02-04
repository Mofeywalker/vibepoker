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

// Validation constants
const MAX_NAME_LENGTH = 50;
const MAX_TOPIC_LENGTH = 200;
const MAX_PLAYERS_PER_ROOM = 50;
const MAX_ROOMS = 1000;

// Rate limiting per socket
const socketRateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(socketId: string, maxRequests = 30, windowMs = 1000): boolean {
    const now = Date.now();
    const limit = socketRateLimits.get(socketId);

    if (!limit || now > limit.resetTime) {
        socketRateLimits.set(socketId, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (limit.count >= maxRequests) {
        return false;
    }

    limit.count++;
    return true;
}

// Validation functions
function validatePlayerName(name: unknown): string | null {
    if (typeof name !== 'string') return null;
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return null;
    return trimmed.replace(/[<>&"']/g, '');
}

function validateTopic(topic: unknown): string | null {
    if (typeof topic !== 'string') return null;
    const trimmed = topic.trim();
    if (trimmed.length > MAX_TOPIC_LENGTH) return null;
    return trimmed.replace(/[<>&"']/g, '');
}

function validateRoomId(roomId: unknown): string | null {
    if (typeof roomId !== 'string') return null;
    if (!/^[a-zA-Z0-9-]+$/.test(roomId)) return null;
    if (roomId.length > 36) return null;
    return roomId;
}

function validateCardValue(card: unknown): CardValue | null {
    if (card === null) return null;
    if (typeof card !== 'string') return null;
    const VALID_CARDS = ['?', '0', '1', '2', '3', '5', '8', '13', '20', '∞'];
    return VALID_CARDS.includes(card) ? card as CardValue : null;
}

// Fibonacci sequence for suggestions
const FIBONACCI = [0, 1, 2, 3, 5, 8, 13, 20];

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
            origin: process.env.ALLOWED_ORIGINS?.split(',') || [
                'http://localhost:3000',
                'http://127.0.0.1:3000'
            ],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        let currentRoomId: string | null = null;

        socket.on('create-room', (playerName, callback) => {
            if (!checkRateLimit(socket.id)) {
                socket.emit('error', 'RATE_LIMITED');
                callback('');
                return;
            }

            const validName = validatePlayerName(playerName);
            if (!validName) {
                socket.emit('error', 'INVALID_NAME');
                callback('');
                return;
            }

            if (rooms.size >= MAX_ROOMS) {
                socket.emit('error', 'SERVER_FULL');
                callback('');
                return;
            }

            const roomId = uuidv4().substring(0, 8);
            const player: Player = {
                id: socket.id,
                name: validName,
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

            console.log(`Room created: ${roomId} by ${validName}`);
            callback(roomId);
            socket.emit('room-state', room);
        });

        socket.on('join-room', (roomId, playerName, callback) => {
            if (!checkRateLimit(socket.id)) {
                socket.emit('error', 'RATE_LIMITED');
                callback(false, 'RATE_LIMITED');
                return;
            }

            const validRoomId = validateRoomId(roomId);
            const validName = validatePlayerName(playerName);

            if (!validRoomId || !validName) {
                callback(false, 'INVALID_INPUT');
                return;
            }

            const room = rooms.get(validRoomId);

            if (!room) {
                callback(false, 'ROOM_NOT_FOUND');
                return;
            }

            if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
                callback(false, 'ROOM_FULL');
                return;
            }

            // Check if player name already exists
            if (room.players.some(p => p.name.toLowerCase() === validName.toLowerCase())) {
                callback(false, 'NAME_TAKEN');
                return;
            }

            const player: Player = {
                id: socket.id,
                name: validName,
                selectedCard: null,
                isHost: false
            };

            room.players.push(player);
            socket.join(validRoomId);
            currentRoomId = validRoomId;

            console.log(`${validName} joined room ${validRoomId}`);
            callback(true);

            // Notify all players in the room
            io.to(validRoomId).emit('room-state', room);
        });

        socket.on('rejoin-room', (roomId, playerName, callback) => {
            if (!checkRateLimit(socket.id)) {
                socket.emit('error', 'RATE_LIMITED');
                callback(false);
                return;
            }

            const validRoomId = validateRoomId(roomId);
            const validName = validatePlayerName(playerName);

            if (!validRoomId || !validName) {
                callback(false);
                return;
            }

            const room = rooms.get(validRoomId);

            if (!room) {
                callback(false);
                return;
            }

            // Check if player name exists but has no socket (disconnected)
            const existingPlayer = room.players.find(p => p.name.toLowerCase() === validName.toLowerCase());

            if (existingPlayer) {
                // Update the socket ID for the existing player
                existingPlayer.id = socket.id;

                // If this player is the host, update the room's hostId
                if (existingPlayer.isHost) {
                    room.hostId = socket.id;
                }

                socket.join(validRoomId);
                currentRoomId = validRoomId;

                console.log(`${validName} rejoined room ${validRoomId}`);
                callback(true);
                io.to(validRoomId).emit('room-state', room);
            } else {
                // Player doesn't exist, add them if room has space
                if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
                    callback(false);
                    return;
                }

                const player: Player = {
                    id: socket.id,
                    name: validName,
                    selectedCard: null,
                    isHost: room.players.length === 0 // Make host if first player
                };

                if (room.players.length === 0) {
                    room.hostId = socket.id;
                }

                room.players.push(player);
                socket.join(validRoomId);
                currentRoomId = validRoomId;

                console.log(`${validName} joined room ${validRoomId} (via rejoin)`);
                callback(true);
                io.to(validRoomId).emit('room-state', room);
            }
        });

        socket.on('select-card', (roomId, card) => {
            if (!checkRateLimit(socket.id, 10, 1000)) return; // Stricter limit for card selection

            const validRoomId = validateRoomId(roomId);
            if (!validRoomId) return;

            const room = rooms.get(validRoomId);
            if (!room || room.isRevealed) return;

            const player = room.players.find(p => p.id === socket.id);
            if (!player) return;

            // Validate card value (null is allowed for deselection)
            const validCard = card === null ? null : validateCardValue(card);
            if (card !== null && validCard === null) return;

            player.selectedCard = validCard;

            // Important: Emit room-state so clients know their own selection
            io.to(validRoomId).emit('room-state', room);

            // Also keep emitting card-selected for backward compatibility
            io.to(validRoomId).emit('card-selected', socket.id, validCard !== null);
        });

        socket.on('update-topic', (roomId, topic) => {
            if (!checkRateLimit(socket.id)) return;

            const validRoomId = validateRoomId(roomId);
            if (!validRoomId) return;

            const room = rooms.get(validRoomId);
            if (!room) return;

            // Only host can update topic
            if (room.hostId !== socket.id) return;

            const validTopic = validateTopic(topic);
            room.topic = validTopic;
            io.to(validRoomId).emit('room-state', room);
        });

        socket.on('reveal-cards', (roomId) => {
            if (!checkRateLimit(socket.id)) return;

            const validRoomId = validateRoomId(roomId);
            if (!validRoomId) return;

            const room = rooms.get(validRoomId);
            if (!room) return;

            // Only host can reveal
            if (room.hostId !== socket.id) return;

            room.isRevealed = true;
            room.results = calculateResults(room.players);

            io.to(validRoomId).emit('cards-revealed', room);
        });

        socket.on('accept-estimation', (roomId, value) => {
            if (!checkRateLimit(socket.id)) return;

            const validRoomId = validateRoomId(roomId);
            if (!validRoomId) return;

            const validValue = validateCardValue(value);
            if (!validValue) return;

            const room = rooms.get(validRoomId);
            if (!room) return;

            // Only host can accept estimation
            if (room.hostId !== socket.id) {
                socket.emit('error', 'NOT_HOST');
                return;
            }

            if (!room.history) {
                room.history = [];
            }

            const historyItem: EstimationHistoryItem = {
                topic: room.topic || 'Unknown Topic',
                value: validValue,
                timestamp: Date.now()
            };

            room.history.push(historyItem);

            // Mark results as accepted
            if (room.results) {
                room.results.acceptedValue = validValue;
            }

            io.to(validRoomId).emit('room-state', room);
        });

        socket.on('reset-round', (roomId) => {
            if (!checkRateLimit(socket.id)) return;

            const validRoomId = validateRoomId(roomId);
            if (!validRoomId) return;

            const room = rooms.get(validRoomId);
            if (!room) return;

            // Only host can reset
            if (room.hostId !== socket.id) return;

            room.isRevealed = false;
            room.results = null;
            room.topic = null; // Reset topic for new round
            room.players.forEach(p => {
                p.selectedCard = null;
            });

            io.to(validRoomId).emit('round-reset');
            io.to(validRoomId).emit('room-state', room);
        });

        socket.on('revote', (roomId) => {
            if (!checkRateLimit(socket.id)) return;

            const validRoomId = validateRoomId(roomId);
            if (!validRoomId) return;

            const room = rooms.get(validRoomId);
            if (!room) return;

            // Only host can reset
            if (room.hostId !== socket.id) return;

            room.isRevealed = false;
            room.results = null;
            // topic is NOT reset for revote
            room.players.forEach(p => {
                p.selectedCard = null;
            });

            io.to(validRoomId).emit('round-reset');
            io.to(validRoomId).emit('room-state', room);
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
