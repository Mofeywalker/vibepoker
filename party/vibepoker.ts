import type * as Party from "partykit/server";
import { CARD_VALUES, type CardValue, type Player, type Room, type Results, type EstimationHistoryItem } from "../src/types";

// Validation constants
const MAX_NAME_LENGTH = 50;
const MAX_TOPIC_LENGTH = 200;
const MAX_PLAYERS_PER_ROOM = 50;
const FIBONACCI = [0, 1, 2, 3, 5, 8, 13, 20];

// Validation functions
function validatePlayerName(name: unknown): string | null {
    if (typeof name !== 'string') return null;
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return null;
    return trimmed.replace(/[<>&"']/g, '');
}

function validateTopic(topic: unknown): string {
    if (typeof topic !== 'string') return '';
    return topic.trim().slice(0, MAX_TOPIC_LENGTH).replace(/[<>&"']/g, '');
}

function validateCardValue(value: unknown): CardValue | null {
    if (typeof value !== 'string') return null;
    return (CARD_VALUES as readonly string[]).includes(value) ? value as CardValue : null;
}

function calculateResults(players: Player[]): Results {
    const allCards = players.map(p => p.selectedCard).filter((card): card is CardValue => card !== null);

    // Count occurrences
    const countMap = new Map<CardValue, number>();
    allCards.forEach(card => {
        countMap.set(card, (countMap.get(card) || 0) + 1);
    });

    const breakdown = Array.from(countMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

    const mode = breakdown.length > 0 ? breakdown[0].value : null;

    // Filter numeric values
    const numericValues = allCards
        .filter(card => card !== '?' && card !== '∞')
        .map(card => parseInt(card))
        .filter(n => !isNaN(n));

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

    // Suggestion: closest Fibonacci
    let suggestion = FIBONACCI[0];
    let minDiff = Math.abs(average - FIBONACCI[0]);
    for (const fib of FIBONACCI) {
        const diff = Math.abs(average - fib);
        if (diff < minDiff) {
            minDiff = diff;
            suggestion = fib;
        }
    }

    return {
        average: Math.round(average * 10) / 10,
        median,
        mode,
        suggestion,
        breakdown
    };
}

export default class VibePOKERServer implements Party.Server {
    constructor(readonly room: Party.Room) { }

    async onStart() {
        const state = await this.room.storage.get<Room>("room-state");
        if (!state) {
            const initialRoom: Room = {
                id: this.room.id,
                hostId: "",
                topic: null,
                players: [],
                isRevealed: false,
                results: null,
                history: []
            };
            await this.room.storage.put("room-state", initialRoom);
        }
    }

    async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
        const url = new URL(ctx.request.url);
        const playerName = url.searchParams.get("name");

        if (!playerName) {
            connection.close(1008, "NAME_REQUIRED");
            return;
        }

        const validName = validatePlayerName(playerName);
        if (!validName) {
            connection.close(1008, "INVALID_NAME");
            return;
        }

        const room = await this.room.storage.get<Room>("room-state");
        if (!room) return;

        if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
            connection.close(1008, "ROOM_FULL");
            return;
        }

        if (room.players.some(p => p.name.toLowerCase() === validName.toLowerCase())) {
            connection.close(1008, "NAME_TAKEN");
            return;
        }

        const player: Player = {
            id: connection.id,
            name: validName,
            selectedCard: null,
            isHost: room.players.length === 0
        };

        if (player.isHost) {
            room.hostId = connection.id;
        }

        room.players.push(player);
        await this.room.storage.put("room-state", room);

        this.broadcastRoomState(room);
    }

    async onMessage(message: string, sender: Party.Connection) {
        const room = await this.room.storage.get<Room>("room-state");
        if (!room) return;

        try {
            const msg = JSON.parse(message);

            switch (msg.type) {
                case "select-card":
                    await this.handleSelectCard(room, sender.id, msg.card);
                    break;
                case "update-topic":
                    await this.handleUpdateTopic(room, sender.id, msg.topic);
                    break;
                case "reveal-cards":
                    await this.handleRevealCards(room, sender.id);
                    break;
                case "accept-estimation":
                    await this.handleAcceptEstimation(room, sender.id, msg.value);
                    break;
                case "reset-round":
                    await this.handleResetRound(room, sender.id);
                    break;
                case "revote":
                    await this.handleRevote(room, sender.id);
                    break;
            }
        } catch (error) {
            console.error("Error handling message:", error);
        }
    }

    async onClose(connection: Party.Connection) {
        const room = await this.room.storage.get<Room>("room-state");
        if (!room) return;

        room.players = room.players.filter(p => p.id !== connection.id);

        if (room.hostId === connection.id && room.players.length > 0) {
            room.hostId = room.players[0].id;
            room.players[0].isHost = true;
        }

        await this.room.storage.put("room-state", room);
        this.broadcastRoomState(room);
    }

    private broadcastRoomState(room: Room) {
        this.room.broadcast(JSON.stringify({ type: "room-state", data: room }));
    }

    private async handleSelectCard(room: Room, playerId: string, card: unknown) {
        const player = room.players.find(p => p.id === playerId);
        if (!player || room.isRevealed) return;

        const validCard = card === null ? null : validateCardValue(card);
        if (card !== null && validCard === null) return;

        player.selectedCard = validCard;
        await this.room.storage.put("room-state", room);
        this.broadcastRoomState(room);
    }

    private async handleUpdateTopic(room: Room, playerId: string, topic: unknown) {
        if (room.hostId !== playerId) return;

        room.topic = validateTopic(topic);
        await this.room.storage.put("room-state", room);
        this.broadcastRoomState(room);
    }

    private async handleRevealCards(room: Room, playerId: string) {
        if (room.hostId !== playerId) return;

        room.isRevealed = true;
        room.results = calculateResults(room.players);
        await this.room.storage.put("room-state", room);
        this.broadcastRoomState(room);
    }

    private async handleAcceptEstimation(room: Room, playerId: string, value: unknown) {
        if (room.hostId !== playerId) return;

        const validValue = validateCardValue(value);
        if (!validValue) return;

        if (!room.history) room.history = [];

        const historyItem: EstimationHistoryItem = {
            topic: room.topic || 'Unknown Topic',
            value: validValue,
            timestamp: Date.now()
        };

        room.history.push(historyItem);

        if (room.results) {
            room.results.acceptedValue = validValue;
        }

        await this.room.storage.put("room-state", room);
        this.broadcastRoomState(room);
    }

    private async handleResetRound(room: Room, playerId: string) {
        if (room.hostId !== playerId) return;

        room.isRevealed = false;
        room.results = null;
        room.topic = null;
        room.players.forEach(p => p.selectedCard = null);

        await this.room.storage.put("room-state", room);
        this.broadcastRoomState(room);
    }

    private async handleRevote(room: Room, playerId: string) {
        if (room.hostId !== playerId) return;

        room.isRevealed = false;
        room.results = null;
        room.players.forEach(p => p.selectedCard = null);

        await this.room.storage.put("room-state", room);
        this.broadcastRoomState(room);
    }
}
