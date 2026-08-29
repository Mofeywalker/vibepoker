
import { describe, it, expect, vi } from 'vitest';
import {
    default as VibePOKERServer,
    expireDisconnectedPlayers,
    markPlayerDisconnected,
    RECONNECT_GRACE_MS,
    restorePlayer,
    transferHost
} from '../../../party/vibepoker';
import type { Room, Player } from '../../types';

function createRoom(players: Player[], hostId: string): Room {
    return {
        id: 'test-room',
        hostId,
        players,
        topic: null,
        isRevealed: false,
        results: null,
        history: [],
        roundingPreference: 'down'
    };
}

describe('VibePOKERServer - handleTransferHost', () => {
    it('should correctly transfer host role', () => {
        const players: Player[] = [
            { id: 'host-id', name: 'Host', isHost: true, selectedCard: null },
            { id: 'target-id', name: 'Target', isHost: false, selectedCard: null }
        ];
        const room: Room = {
            id: 'test-room',
            hostId: 'host-id',
            players,
            topic: null,
            isRevealed: false,
            results: null,
            history: [],
            roundingPreference: 'down'
        };

        const result = transferHost(room, 'host-id', 'target-id');

        expect(result).toBe(true);
        expect(room.hostId).toBe('target-id');
        expect(room.players.find(p => p.id === 'host-id')?.isHost).toBe(false);
        expect(room.players.find(p => p.id === 'target-id')?.isHost).toBe(true);
    });

    it('should fail if sender is not the host', () => {
        const players: Player[] = [
            { id: 'host-id', name: 'Host', isHost: true, selectedCard: null },
            { id: 'other-id', name: 'Other', isHost: false, selectedCard: null },
            { id: 'target-id', name: 'Target', isHost: false, selectedCard: null }
        ];
        const room: Room = {
            id: 'test-room',
            hostId: 'host-id',
            players,
            topic: null,
            isRevealed: false,
            results: null,
            history: [],
            roundingPreference: 'down'
        };

        const result = transferHost(room, 'other-id', 'target-id');

        expect(result).toBe(false);
        expect(room.hostId).toBe('host-id');
    });

    it('should fail if target player does not exist', () => {
        const players: Player[] = [
            { id: 'host-id', name: 'Host', isHost: true, selectedCard: null }
        ];
        const room: Room = {
            id: 'test-room',
            hostId: 'host-id',
            players,
            topic: null,
            isRevealed: false,
            results: null,
            history: [],
            roundingPreference: 'down'
        };

        const result = transferHost(room, 'host-id', 'non-existent-id');

        expect(result).toBe(false);
        expect(room.hostId).toBe('host-id');
    });

    it('should fail if target is the host themselves', () => {
        const players: Player[] = [
            { id: 'host-id', name: 'Host', isHost: true, selectedCard: null }
        ];
        const room: Room = {
            id: 'test-room',
            hostId: 'host-id',
            players,
            topic: null,
            isRevealed: false,
            results: null,
            history: [],
            roundingPreference: 'down'
        };

        const result = transferHost(room, 'host-id', 'host-id');

        expect(result).toBe(false);
        expect(room.hostId).toBe('host-id');
    });
});

describe('VibePOKERServer - reconnect grace period', () => {
    it('restores a disconnected host without changing ownership', () => {
        const room = createRoom([
            { id: 'host-id', name: 'Host', isHost: true, selectedCard: null }
        ], 'host-id');

        expect(markPlayerDisconnected(room, 'host-id', 1_000)).toBe(true);
        expect(restorePlayer(room, 'host-id', 'Host')).toBe(true);
        expect(room.players[0].disconnectedAt).toBeUndefined();
        expect(room.hostId).toBe('host-id');
        expect(room.players[0].isHost).toBe(true);
    });

    it('does not expire a host before the grace period ends', () => {
        const room = createRoom([
            { id: 'host-id', name: 'Host', isHost: true, selectedCard: null, disconnectedAt: 1_000 },
            { id: 'player-id', name: 'Player', isHost: false, selectedCard: null }
        ], 'host-id');

        expect(expireDisconnectedPlayers(room, 1_000 + RECONNECT_GRACE_MS - 1)).toBe(false);
        expect(room.hostId).toBe('host-id');
        expect(room.players).toHaveLength(2);
    });

    it('promotes the first connected player after the host grace period', () => {
        const room = createRoom([
            { id: 'host-id', name: 'Host', isHost: true, selectedCard: null, disconnectedAt: 1_000 },
            { id: 'offline-id', name: 'Offline', isHost: false, selectedCard: null, disconnectedAt: 2_000 },
            { id: 'player-id', name: 'Player', isHost: false, selectedCard: null }
        ], 'host-id');

        expect(expireDisconnectedPlayers(room, 1_000 + RECONNECT_GRACE_MS)).toBe(true);
        expect(room.players.map(p => p.id)).toEqual(['offline-id', 'player-id']);
        expect(room.hostId).toBe('player-id');
        expect(room.players.find(p => p.id === 'player-id')?.isHost).toBe(true);
        expect(room.players.find(p => p.id === 'offline-id')?.isHost).toBe(false);
    });

    it('removes an expired non-host without changing host', () => {
        const room = createRoom([
            { id: 'host-id', name: 'Host', isHost: true, selectedCard: null },
            { id: 'player-id', name: 'Player', isHost: false, selectedCard: null, disconnectedAt: 1_000 }
        ], 'host-id');

        expect(expireDisconnectedPlayers(room, 1_000 + RECONNECT_GRACE_MS)).toBe(true);
        expect(room.players.map(p => p.id)).toEqual(['host-id']);
        expect(room.hostId).toBe('host-id');
    });

    it('makes the first returning player host when no connected replacement existed', () => {
        const room = createRoom([
            { id: 'host-id', name: 'Host', isHost: true, selectedCard: null, disconnectedAt: 1_000 },
            { id: 'player-id', name: 'Player', isHost: false, selectedCard: null, disconnectedAt: 2_000 }
        ], 'host-id');

        expireDisconnectedPlayers(room, 1_000 + RECONNECT_GRACE_MS);

        expect(room.hostId).toBe('');
        expect(restorePlayer(room, 'player-id', 'Player')).toBe(true);
        expect(room.hostId).toBe('player-id');
        expect(room.players[0].isHost).toBe(true);
    });

    it('rejects reconnects whose name does not match the stored identity', () => {
        const room = createRoom([
            { id: 'host-id', name: 'Host', isHost: true, selectedCard: null, disconnectedAt: 1_000 }
        ], 'host-id');

        expect(restorePlayer(room, 'host-id', 'Imposter')).toBe(false);
        expect(room.players[0].disconnectedAt).toBe(1_000);
    });

    it('ignores a stale close after a replacement connection is active', async () => {
        const oldConnection = { id: 'host-id' };
        const newConnection = { id: 'host-id' };
        const transaction = vi.fn();
        const partyRoom = {
            getConnection: () => newConnection,
            storage: { transaction }
        };
        const server = new VibePOKERServer(partyRoom as never);

        await server.onClose(oldConnection as never);

        expect(transaction).not.toHaveBeenCalled();
    });
});
