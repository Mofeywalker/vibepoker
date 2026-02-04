import PartySocket from 'partysocket';
import type { RealtimeClient, ConnectionConfig } from './types';
import type { Room, CardValue } from '@/types';

export class PartyKitClient implements RealtimeClient {
    private socket: PartySocket | null = null;
    private roomUpdateCallback: ((room: Room) => void) | null = null;
    private errorCallback: ((error: string) => void) | null = null;
    private _currentPlayerId: string | null = null;

    get isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }

    get currentPlayerId(): string | null {
        return this._currentPlayerId;
    }

    async connect(config: ConnectionConfig): Promise<void> {
        const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

        this.socket = new PartySocket({
            host,
            room: config.roomId,
            query: { name: config.playerName }
        });

        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Socket not initialized'));

            this.socket.addEventListener('open', () => {
                this._currentPlayerId = this.socket!.id;
                resolve();
            });

            this.socket.addEventListener('message', (event) => {
                try {
                    const msg = JSON.parse(event.data);

                    if (msg.type === 'room-state') {
                        this.roomUpdateCallback?.(msg.data);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            });

            this.socket.addEventListener('error', () => {
                this.errorCallback?.('Connection error');
                reject(new Error('Connection error'));
            });

            this.socket.addEventListener('close', (event) => {
                if (event.code === 1008) {
                    this.errorCallback?.(event.reason);
                }
            });
        });
    }

    disconnect(): void {
        this.socket?.close();
        this.socket = null;
        this._currentPlayerId = null;
    }

    onRoomUpdate(callback: (room: Room) => void): void {
        this.roomUpdateCallback = callback;
    }

    onError(callback: (error: string) => void): void {
        this.errorCallback = callback;
    }

    private send(message: object): void {
        if (!this.socket || !this.isConnected) return;
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
}
