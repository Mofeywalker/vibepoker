import type * as Party from "partykit/server";
import { type DeckType, type Player, type Room, type EstimationHistoryItem } from "../src/types";
import {
    calculateResults,
    validatePlayerName,
    validateTopic,
    validateCardValue,
    MAX_HISTORY_ITEMS
} from "../src/lib/poker-logic";

const MAX_PLAYERS_PER_ROOM = 50;

enum CloseCode {
    POLICY_VIOLATION = 1008,
    INTERNAL_ERROR = 1011
}

export default class VibePOKERServer implements Party.Server {
    constructor(readonly room: Party.Room) { }

    async onStart() {
        try {
            const state = await this.room.storage.get<Room>("room-state");
            if (!state) {
                const initialRoom: Room = {
                    id: this.room.id,
                    hostId: "",
                    topic: null,
                    players: [],
                    isRevealed: false,
                    results: null,
                    history: [],
                    roundingPreference: 'down',
                    lastActivityAt: Date.now()
                };
                await this.room.storage.put("room-state", initialRoom);
            }
        } catch (e: unknown) {
            console.error("Error in onStart:", e);
        }
    }

    async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
        try {
            await this.room.storage.deleteAlarm();
            const url = new URL(ctx.request.url);
            const playerName = url.searchParams.get("name");
            const deckType = url.searchParams.get("deckType") as DeckType | null;

            if (!playerName) {
                connection.close(CloseCode.POLICY_VIOLATION, "NAME_REQUIRED");
                return;
            }

            const validName = validatePlayerName(playerName);
            if (!validName) {
                connection.close(CloseCode.POLICY_VIOLATION, "INVALID_NAME");
                return;
            }

            // Use transaction to prevent race conditions during join
            await this.room.storage.transaction(async (txn) => {
                const room = await txn.get<Room>("room-state");
                if (!room) return;

                if (room.players.length >= MAX_PLAYERS_PER_ROOM) {
                    connection.close(CloseCode.POLICY_VIOLATION, "ROOM_FULL");
                    return;
                }

                if (room.players.some(p => p.name.toLowerCase() === validName.toLowerCase())) {
                    connection.close(CloseCode.POLICY_VIOLATION, "NAME_TAKEN");
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
                    if (deckType) {
                        room.deckType = deckType;
                    } else if (!room.deckType) {
                        room.deckType = 'scrum';
                    }
                }

                room.players.push(player);
                await txn.put("room-state", room);
                return room;
            }).then((room) => {
                if (room) this.broadcastRoomState(room as Room);
            });

        } catch (e: unknown) {
            console.error("Error in onConnect:", e);
            connection.close(CloseCode.INTERNAL_ERROR, "Internal Error");
        }
    }

    async onMessage(message: string, sender: Party.Connection) {
        try {
            const msg = JSON.parse(message);
            // We use transaction for all state updates to ensure consistency
            await this.room.storage.transaction(async (txn) => {
                const room = await txn.get<Room>("room-state");
                if (!room) return;

                let shouldBroadcast = false;
                room.lastActivityAt = Date.now();

                switch (msg.type) {
                    case "select-card":
                        shouldBroadcast = this.handleSelectCard(room, sender.id, msg.card);
                        break;
                    case "update-topic":
                        shouldBroadcast = this.handleUpdateTopic(room, sender.id, msg.topic);
                        break;
                    case "reveal-cards":
                        shouldBroadcast = this.handleRevealCards(room, sender.id);
                        break;
                    case "accept-estimation":
                        shouldBroadcast = this.handleAcceptEstimation(room, sender.id, msg.value);
                        break;
                    case "reset-round":
                        shouldBroadcast = this.handleResetRound(room, sender.id);
                        break;
                    case "revote":
                        shouldBroadcast = this.handleRevote(room, sender.id);
                        break;
                    case "set-rounding":
                        shouldBroadcast = this.handleSetRounding(room, sender.id, msg.rounding);
                        break;
                    case "transfer-host":
                        shouldBroadcast = this.handleTransferHost(room, sender.id, msg.targetId);
                        break;
                }

                if (shouldBroadcast) {
                    await txn.put("room-state", room);
                    return room;
                }
            }).then((room) => {
                if (room) this.broadcastRoomState(room as Room);
            });

        } catch (error) {
            console.error("Error handling message:", error);
        }
    }

    async onClose(connection: Party.Connection) {
        await this.room.storage.transaction(async (txn) => {
            const room = await txn.get<Room>("room-state");
            if (!room) return;

            const initialCount = room.players.length;
            room.players = room.players.filter(p => p.id !== connection.id);

            if (room.players.length === initialCount) return; // Player wasn't there

            if (room.hostId === connection.id && room.players.length > 0) {
                room.hostId = room.players[0].id;
                room.players[0].isHost = true;
            }

            room.lastActivityAt = Date.now();

            if (room.players.length === 0) {
                // Schedule deletion in 24 hours
                await txn.setAlarm(Date.now() + 24 * 60 * 60 * 1000);
            }

            await txn.put("room-state", room);
            return room;
        }).then((room) => {
            if (room) this.broadcastRoomState(room as Room);
        });
    }

    async onAlarm() {
        const room = await this.room.storage.get<Room>("room-state");
        if (room && room.players.length === 0) {
            await this.room.storage.deleteAll();
            console.log(`Room ${this.room.id} deleted due to inactivity.`);
        }
    }

    private broadcastRoomState(room: Room) {
        this.room.broadcast(JSON.stringify({ type: "room-state", data: room }));
    }

    private handleSelectCard(room: Room, playerId: string, card: unknown): boolean {
        const player = room.players.find(p => p.id === playerId);
        if (!player || room.isRevealed) return false;

        const validCard = card === null ? null : validateCardValue(card, room.deckType);

        // optimization: if card is same, don't update
        if (player.selectedCard === validCard) return false;

        if (card !== null && validCard === null) return false;

        player.selectedCard = validCard;
        return true;
    }

    private handleUpdateTopic(room: Room, playerId: string, topic: unknown): boolean {
        if (room.hostId !== playerId) return false;

        const validTopic = validateTopic(topic);
        if (room.topic === validTopic) return false;

        room.topic = validTopic;
        return true;
    }

    private handleRevealCards(room: Room, playerId: string): boolean {
        if (room.hostId !== playerId) return false;

        room.isRevealed = true;
        room.results = calculateResults(room.players, room.deckType, room.roundingPreference);
        return true;
    }

    private handleSetRounding(room: Room, playerId: string, rounding: unknown): boolean {
        if (room.hostId !== playerId) return false;
        if (rounding !== 'up' && rounding !== 'down') return false;

        if (room.roundingPreference === rounding) return false;

        room.roundingPreference = rounding;
        
        // If cards are already revealed, recalculate results with new rounding
        if (room.isRevealed) {
            room.results = calculateResults(room.players, room.deckType, room.roundingPreference);
        }
        
        return true;
    }

    private handleAcceptEstimation(room: Room, playerId: string, value: unknown): boolean {
        if (room.hostId !== playerId) return false;

        const validValue = validateCardValue(value, room.deckType);
        if (!validValue) return false;

        if (!room.history) room.history = [];

        // Cap history size
        if (room.history.length >= MAX_HISTORY_ITEMS) {
            room.history.shift(); // Remove oldest
        }

        const historyItem: EstimationHistoryItem = {
            topic: room.topic || 'Unknown Topic',
            value: validValue,
            timestamp: Date.now()
        };

        room.history.push(historyItem);

        if (room.results) {
            room.results.acceptedValue = validValue;
        }

        return true;
    }

    private handleResetRound(room: Room, playerId: string): boolean {
        return this.clearRound(room, playerId, true);
    }

    private handleRevote(room: Room, playerId: string): boolean {
        return this.clearRound(room, playerId, false);
    }

    private clearRound(room: Room, playerId: string, clearTopic: boolean): boolean {
        if (room.hostId !== playerId) return false;

        room.isRevealed = false;
        room.results = null;
        if (clearTopic) room.topic = null;
        room.players.forEach(p => p.selectedCard = null);
        return true;
    }

    private handleTransferHost(room: Room, playerId: string, targetId: unknown): boolean {
        if (room.hostId !== playerId) return false;
        if (typeof targetId !== 'string') return false;
        if (playerId === targetId) return false;

        const targetPlayer = room.players.find(p => p.id === targetId);
        if (!targetPlayer) return false;

        const currentPlayer = room.players.find(p => p.id === playerId);
        if (currentPlayer) {
            currentPlayer.isHost = false;
        }

        room.hostId = targetId;
        targetPlayer.isHost = true;
        return true;
    }
}
