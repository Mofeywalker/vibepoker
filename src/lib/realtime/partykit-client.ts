import PartySocket from 'partysocket';
import {
    createConnectionReport,
    probeServer,
    type ConnectionReport
} from '@/lib/realtime/connection-diagnostics';
import type { Room, CardValue, DeckType, RoundingPreference } from '@/types';
import {
    getStorageItem,
    setStorageItem,
    getPlayerIdStorageKey,
    getPlayerStorageKey,
    getPlayerTokenStorageKey,
    getDeckStorageKey,
    clearRoomSession
} from '@/lib/storage';

interface ConnectionConfig {
    roomId: string;
    playerName: string;
    deckType?: DeckType;
}

export class PartyKitClient {
    private socket: PartySocket | null = null;
    private roomUpdateCallback: ((room: Room) => void) | null = null;
    private errorCallback: ((error: string) => void) | null = null;
    private reportUpdateCallback: ((report: ConnectionReport) => void) | null = null;
    private lastConnectionReport: ConnectionReport | null = null;
    private listeners: { type: string; handler: EventListener }[] = [];

    async connect(config: ConnectionConfig): Promise<string> {
        this.disconnect();

        const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';
        const playerIdKey = getPlayerIdStorageKey(config.roomId);
        const playerNameKey = getPlayerStorageKey(config.roomId);
        const playerTokenKey = getPlayerTokenStorageKey(config.roomId);

        const savedPlayerName = getStorageItem(playerNameKey);
        let playerId = getStorageItem(playerIdKey);
        let playerToken = getStorageItem(playerTokenKey);

        const isNewIdentity = Boolean(
            savedPlayerName &&
            config.playerName &&
            savedPlayerName.trim().toLowerCase() !== config.playerName.trim().toLowerCase()
        );

        if (!playerId || isNewIdentity) {
            playerId = crypto.randomUUID();
            setStorageItem(playerIdKey, playerId);
        }

        if (!playerToken || isNewIdentity) {
            playerToken = crypto.randomUUID();
            setStorageItem(playerTokenKey, playerToken);
        }

        this.socket = new PartySocket({
            id: playerId,
            host,
            room: config.roomId,
            query: {
                name: config.playerName,
                deckType: config.deckType,
                token: playerToken
            }
        });

        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Socket not initialized'));

            const onOpen = () => {
                setStorageItem(playerNameKey, config.playerName.trim());
                if (config.deckType) {
                    setStorageItem(getDeckStorageKey(config.roomId), config.deckType);
                }
                resolve(this.socket!.id);
            };

            const onMessage = (event: MessageEvent) => {
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'room-state') {
                        this.roomUpdateCallback?.(msg.data);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

            let closeTimer: number | NodeJS.Timeout | null = null;

            const onError = () => {
                if (!closeTimer) {
                    closeTimer = setTimeout(() => {
                        const report = createConnectionReport({
                            roomId: config.roomId,
                            host,
                            closeCode: null,
                            reason: null,
                        });
                        this.lastConnectionReport = report;
                        this.errorCallback?.('Connection error');
                        reject(new Error('Connection error'));
                    }, 50);
                }
            };

            const onClose = (event: CloseEvent) => {
                if (closeTimer) {
                    clearTimeout(closeTimer);
                    closeTimer = null;
                }

                const report = createConnectionReport({
                    roomId: config.roomId,
                    host,
                    closeCode: event.code,
                    reason: event.reason,
                });
                this.lastConnectionReport = report;

                probeServer(host, config.roomId).then(probe => {
                    if (this.lastConnectionReport) {
                        this.lastConnectionReport.httpStatus = probe.httpStatus;
                        if (probe.diagnosticMessage) {
                            this.lastConnectionReport.diagnosticMessage = probe.diagnosticMessage;
                        }
                        if (probe.suggestion) {
                            this.lastConnectionReport.suggestion = probe.suggestion;
                        }
                        this.reportUpdateCallback?.(this.lastConnectionReport);
                    }
                }).catch(() => {
                    // probe errors handled inside probeServer
                });

                if (event.code === 1008) {
                    if (event.reason === 'IDENTITY_MISMATCH') {
                        clearRoomSession(config.roomId);
                    }
                    this.errorCallback?.(event.reason);
                    reject(new Error(event.reason || 'Policy violation'));
                } else if (event.code !== 1000) {
                    const message = `Connection error (${event.code})`;
                    this.errorCallback?.(message);
                    reject(new Error(message));
                }
            };

            this.listeners = [
                { type: 'open', handler: onOpen as EventListener },
                { type: 'message', handler: onMessage as EventListener },
                { type: 'error', handler: onError as EventListener },
                { type: 'close', handler: onClose as EventListener },
            ];

            for (const { type, handler } of this.listeners) {
                this.socket.addEventListener(type, handler);
            }
        });
    }

    disconnect(): void {
        if (this.socket) {
            for (const { type, handler } of this.listeners) {
                this.socket.removeEventListener(type, handler);
            }
            this.socket.close();
        }
        this.socket = null;
        this.listeners = [];
    }

    onRoomUpdate(callback: (room: Room) => void): void {
        this.roomUpdateCallback = callback;
    }

    onError(callback: (error: string) => void): void {
        this.errorCallback = callback;
    }
    onReportUpdate(callback: (report: ConnectionReport) => void): void {
        this.reportUpdateCallback = callback;
    }

    getConnectionReport(): ConnectionReport | null {
        return this.lastConnectionReport;
    }

    private send(message: object): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
        this.socket.send(JSON.stringify(message));
    }

    selectCard(card: CardValue | null): void {
        this.send({ type: 'select-card', card });
    }

    updateTopic(topic: string): void {
        this.send({ type: 'update-topic', topic });
    }

    revealCards(): void {
        this.send({ type: 'reveal-cards' });
    }

    acceptEstimation(value: CardValue): void {
        this.send({ type: 'accept-estimation', value });
    }

    resetRound(): void {
        this.send({ type: 'reset-round' });
    }

    revote(): void {
        this.send({ type: 'revote' });
    }

    setRounding(rounding: RoundingPreference): void {
        this.send({ type: 'set-rounding', rounding });
    }

    transferHost(targetId: string): void {
        this.send({ type: 'transfer-host', targetId });
    }
}
