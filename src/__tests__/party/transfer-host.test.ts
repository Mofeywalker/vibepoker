
import { describe, it, expect, vi } from 'vitest';
import VibePOKERServer from '../../../party/vibepoker';
import { Room, Player } from '../../types';

describe('VibePOKERServer - handleTransferHost', () => {
    const mockRoom: any = {
        storage: {
            get: vi.fn(),
            put: vi.fn(),
            transaction: vi.fn(),
            deleteAlarm: vi.fn(),
            setAlarm: vi.fn(),
        },
        id: 'test-room',
        broadcast: vi.fn(),
    };

    const server = new VibePOKERServer(mockRoom);

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

        // Accessing private method for testing purposes
        const result = (server as any).handleTransferHost(room, 'host-id', 'target-id');

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

        const result = (server as any).handleTransferHost(room, 'other-id', 'target-id');

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

        const result = (server as any).handleTransferHost(room, 'host-id', 'non-existent-id');

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

        const result = (server as any).handleTransferHost(room, 'host-id', 'host-id');

        expect(result).toBe(false);
        expect(room.hostId).toBe('host-id');
    });
});
