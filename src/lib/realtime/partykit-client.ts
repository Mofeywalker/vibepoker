import PartySocket from 'partysocket';
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

            const onError = () => {
                this.errorCallback?.('Connection error');
                reject(new Error('Connection error'));
            };

            const onClose = (event: CloseEvent) => {
                if (event.code === 1008) {
                    if (event.reason === 'IDENTITY_MISMATCH') {
                        clearRoomSession(config.roomId);
                    }
                    this.errorCallback?.(event.reason);
                    reject(new Error(event.reason || 'Policy violation'));
                } else if (event.code !== 1000) {
                    this.errorCallback?.('Connection error');
                    reject(new Error('Connection error'));
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
