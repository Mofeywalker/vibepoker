import type { Room, CardValue, DeckType } from '@/types';

export interface ConnectionConfig {
    roomId: string;
    playerName: string;
    deckType?: DeckType;
}

export interface RealtimeClient {
    // Connection
    connect(config: ConnectionConfig): Promise<void>;
    disconnect(): void;
    readonly isConnected: boolean;
    readonly currentPlayerId: string | null;

    // Events
    onRoomUpdate(callback: (room: Room) => void): void;
    onError(callback: (error: string) => void): void;

    // Actions
    selectCard(card: CardValue | null): void;
    updateTopic(topic: string): void;
    revealCards(): void;
    acceptEstimation(value: CardValue): void;
    resetRound(): void;
    revote(): void;
}
