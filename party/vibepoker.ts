/// <reference types="@cloudflare/workers-types" />
import { routePartykitRequest, Server, type Connection, type ConnectionContext } from "partyserver";
import { isDeckType, type Player, type Room, type EstimationHistoryItem } from "../src/types";
import {
    calculateResults,
    validatePlayerName,
    validateTopic,
    validateCardValue,
    MAX_HISTORY_ITEMS,
    RECONNECT_GRACE_MS,
    transferHost,
    markPlayerDisconnected,
    restorePlayer,
    expireDisconnectedPlayers,
    sanitizeRoomForPlayer
} from "../src/lib/poker-logic";

const MAX_PLAYERS_PER_ROOM = 50;
const EMPTY_ROOM_TTL_MS = 24 * 60 * 60 * 1000;

enum CloseCode {
    POLICY_VIOLATION = 1008,
    INTERNAL_ERROR = 1011
}

export type Env = {
    Main: DurableObjectNamespace<VibePOKERServer>;
    /**
     * Optional comma-separated allowlist of origins permitted to open WebSocket
     * connections (e.g. "https://vibepoker.app,https://www.vibepoker.app").
     * When unset/empty, all http(s) origins are allowed (local development).
     */
    ALLOWED_ORIGINS?: string;
};

export class VibePOKERServer extends Server<Env> {
    static options = { hibernate: true };

    async onStart() {
        try {
            const state = await this.ctx.storage.get<Room>("room-state");
            if (!state) {
                const initialRoom: Room = {
                    id: this.name,
                    hostId: "",
                    topic: null,
                    players: [],
                    isRevealed: false,
                    results: null,
                    history: [],
                    roundingPreference: 'down',
                    lastActivityAt: Date.now()
                };
                await this.ctx.storage.put("room-state", initialRoom);
            }
        } catch (e: unknown) {
            console.error("Error in onStart:", e);
        }
    }

    async onConnect(connection: Connection, ctx: ConnectionContext) {
        try {
            const url = new URL(ctx.request.url);
            const playerName = url.searchParams.get("name");
            const requestedDeckType = url.searchParams.get("deckType");
            const token = url.searchParams.get("token") || undefined;
            const deckType = isDeckType(requestedDeckType) ? requestedDeckType : undefined;

            if (!playerName) {
                connection.close(CloseCode.POLICY_VIOLATION, "NAME_REQUIRED");
                return;
            }

            const validName = validatePlayerName(playerName);
            if (!validName) {
                connection.close(CloseCode.POLICY_VIOLATION, "INVALID_NAME");
                return;
            }

            // Close any existing stale connections for this ID to prevent duplicate sockets
            const existingSockets = this.getActiveConnections(connection.id);
            for (const ws of existingSockets) {
                if (ws !== connection) {
                    try {
                        ws.close(1000, "REPLACED");
                    } catch {
                        // ignore
                    }
                }
            }

            // Use transaction to prevent race conditions during join
            await this.ctx.storage.transaction(async (txn) => {
                const room = await txn.get<Room>("room-state");
                if (!room) return;

                const existingPlayer = room.players.find(p => p.id === connection.id);
                if (existingPlayer) {
                    if (!restorePlayer(room, connection.id, validName, token)) {
                        connection.close(CloseCode.POLICY_VIOLATION, "IDENTITY_MISMATCH");
                        return;
                    }

                    room.lastActivityAt = Date.now();
                    await txn.put("room-state", room);
                    await this.scheduleNextAlarm(txn, room);
                    return room;
                }

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
                    isHost: !room.hostId,
                    token: token
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
                await this.scheduleNextAlarm(txn, room);
                return room;
            }).then((room) => {
                if (room) this.broadcastRoomState(room as Room);
            });

        } catch (e: unknown) {
            console.error("Error in onConnect:", e);
            connection.close(CloseCode.INTERNAL_ERROR, "Internal Error");
        }
    }

    async onMessage(sender: Connection, message: string) {
        try {
            if (typeof message !== "string" || message.length > 2048) {
                return;
            }

            const msg = JSON.parse(message);
            if (!msg || typeof msg !== "object" || typeof msg.type !== "string") {
                return;
            }

            const validMessageTypes = new Set([
                "select-card",
                "update-topic",
                "reveal-cards",
                "accept-estimation",
                "reset-round",
                "revote",
                "set-rounding",
                "transfer-host"
            ]);

            if (!validMessageTypes.has(msg.type)) {
                return;
            }

            // We use transaction for all state updates to ensure consistency
            await this.ctx.storage.transaction(async (txn) => {
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

    async onClose(connection: Connection) {
        await this.handleDisconnect(connection);
    }

    async onError(connection: Connection) {
        await this.handleDisconnect(connection);
    }

    private getActiveConnections(id: string): Connection[] {
        try {
            return Array.from(this.getConnections(id));
        } catch {
            try {
                const single = this.getConnection(id);
                return single ? [single] : [];
            } catch {
                return [];
            }
        }
    }

    private async handleDisconnect(connection: Connection) {
        const activeConnections = this.getActiveConnections(connection.id);
        if (activeConnections.some(c => c !== connection && (c.readyState === undefined || c.readyState === WebSocket.OPEN))) return;

        await this.ctx.storage.transaction(async (txn) => {
            const room = await txn.get<Room>("room-state");
            if (!room) return;

            if (!markPlayerDisconnected(room, connection.id, Date.now())) return;

            room.lastActivityAt = Date.now();
            await txn.put("room-state", room);
            await this.scheduleNextAlarm(txn, room);
            return room;
        }).then((room) => {
            if (room) this.broadcastRoomState(room as Room);
        });
    }

    async onAlarm() {
        await this.ctx.storage.transaction(async (txn) => {
            const room = await txn.get<Room>("room-state");
            if (!room) return;

            if (room.players.length === 0) {
                await txn.delete("room-state");
                await txn.deleteAlarm();
                console.log(`Room ${room.id} deleted due to inactivity.`);
                return;
            }

            if (!expireDisconnectedPlayers(room, Date.now())) {
                await this.scheduleNextAlarm(txn, room);
                return;
            }

            room.lastActivityAt = Date.now();
            await txn.put("room-state", room);
            await this.scheduleNextAlarm(txn, room);
            return room;
        }).then((room) => {
            if (room) this.broadcastRoomState(room as Room);
        });
    }

    private broadcastRoomState(room: Room) {
        try {
            for (const conn of this.getConnections()) {
                try {
                    const sanitized = sanitizeRoomForPlayer(room, conn.id);
                    conn.send(JSON.stringify({ type: "room-state", data: sanitized }));
                } catch {
                    // Ignore transient send failures on closing connections
                }
            }
        } catch {
            // Fallback for tests mocking broadcast
            this.broadcast(JSON.stringify({ type: "room-state", data: room }));
        }
    }

    private async scheduleNextAlarm(
        storage: Pick<DurableObjectStorage, "setAlarm" | "deleteAlarm">,
        room: Room
    ) {
        const disconnectDeadlines = room.players
            .flatMap(p => p.disconnectedAt === undefined ? [] : p.disconnectedAt + RECONNECT_GRACE_MS);

        if (disconnectDeadlines.length > 0) {
            await storage.setAlarm(Math.min(...disconnectDeadlines));
        } else if (room.players.length === 0) {
            await storage.setAlarm(Date.now() + EMPTY_ROOM_TTL_MS);
        } else {
            await storage.deleteAlarm();
        }
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
        return transferHost(room, playerId, targetId);
    }
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return (
            (await routePartykitRequest(request, env, {
                onBeforeConnect: async (req, lobby) => {
                    // 1. Validate room ID format to prevent arbitrary DO initialization
                    if (!lobby.name || !/^[a-zA-Z0-9_-]{4,64}$/.test(lobby.name)) {
                        return new Response("Invalid room ID", { status: 400 });
                    }

                    // 2. Validate _pk connection ID length to prevent tag overflow crash
                    const url = new URL(req.url);
                    const pk = url.searchParams.get("_pk");
                    if (pk && pk.length > 64) {
                        return new Response("Invalid connection ID", { status: 400 });
                    }

                    // 3. Origin validation if Origin header is provided
                    const origin = req.headers.get("Origin");
                    if (origin) {
                        try {
                            const originUrl = new URL(origin);
                            if (!['http:', 'https:'].includes(originUrl.protocol)) {
                                return new Response("Forbidden", { status: 403 });
                            }
                            // Defense-in-depth against cross-site WebSocket hijacking (CSWSH).
                            // When ALLOWED_ORIGINS is configured, only listed origins may connect.
                            const allowedOrigins = env.ALLOWED_ORIGINS
                                ?.split(',')
                                .map(s => s.trim())
                                .filter(Boolean) ?? [];
                            if (allowedOrigins.length > 0 && !allowedOrigins.includes(originUrl.origin)) {
                                return new Response("Forbidden", { status: 403 });
                            }
                        } catch {
                            return new Response("Forbidden", { status: 403 });
                        }
                    }

                    return req;
                }
            })) ||
            new Response("Not Found", { status: 404 })
        );
    }
} satisfies ExportedHandler<Env>;
