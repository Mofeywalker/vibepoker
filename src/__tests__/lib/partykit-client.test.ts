import { beforeEach, describe, expect, it, vi } from 'vitest';

type MockQuery = Record<string, string | undefined>;
interface MockSocketOptions {
    id: string;
    room: string;
    query?: MockQuery;
}

const socketOptions = vi.hoisted(() => [] as Array<MockSocketOptions>);

vi.mock('partysocket', () => ({
    default: class MockPartySocket extends EventTarget {
        id: string;

        constructor(options: MockSocketOptions) {
            super();
            this.id = options.id;
            socketOptions.push(options);
            if (options.query?.name === 'SimulateMismatch') {
                queueMicrotask(() => {
                    const closeEvent = Object.assign(new Event('close'), {
                        code: 1008,
                        reason: 'IDENTITY_MISMATCH'
                    });
                    this.dispatchEvent(closeEvent);
                });
            } else if (options.query?.name === 'SimulateClose1006') {
                queueMicrotask(() => {
                    const closeEvent = Object.assign(new Event('close'), {
                        code: 1006,
                        reason: ''
                    });
                    this.dispatchEvent(closeEvent);
                });
            } else {
                queueMicrotask(() => this.dispatchEvent(new Event('open')));
            }
        }

        close() { }
    }
}));

import { PartyKitClient } from '@/lib/realtime/partykit-client';
import { getPlayerIdStorageKey, getPlayerStorageKey, getPlayerTokenStorageKey, getStorageItem } from '@/lib/storage';

describe('PartyKitClient player identity', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        socketOptions.length = 0;
    });

    it('reuses the room-scoped player ID and token across client instances when name matches', async () => {
        const firstId = await new PartyKitClient().connect({
            roomId: 'room-a',
            playerName: 'Host'
        });
        const secondId = await new PartyKitClient().connect({
            roomId: 'room-a',
            playerName: 'Host'
        });

        expect(secondId).toBe(firstId);
        expect(socketOptions.map(options => options.id)).toEqual([firstId, firstId]);
        const token = getStorageItem(getPlayerTokenStorageKey('room-a'));
        expect(token).toBeTruthy();
        expect(socketOptions[0].query?.token).toBe(token);
        expect(socketOptions[1].query?.token).toBe(token);
    });

    it('generates a new player ID when the player name changes for the same room', async () => {
        const firstId = await new PartyKitClient().connect({
            roomId: 'room-a',
            playerName: 'Alice'
        });
        const secondId = await new PartyKitClient().connect({
            roomId: 'room-a',
            playerName: 'Bob'
        });

        expect(secondId).not.toBe(firstId);
        expect(socketOptions.map(options => options.id)).toEqual([firstId, secondId]);
        expect(getStorageItem(getPlayerStorageKey('room-a'))).toBe('Bob');
        expect(getStorageItem(getPlayerIdStorageKey('room-a'))).toBe(secondId);
    });

    it('uses a different player ID for another room', async () => {
        const client = new PartyKitClient();
        const firstId = await client.connect({ roomId: 'room-a', playerName: 'Host' });
        const secondId = await client.connect({ roomId: 'room-b', playerName: 'Host' });

        expect(secondId).not.toBe(firstId);
    });

    it('clears session and rejects when server closes with IDENTITY_MISMATCH', async () => {
        const client = new PartyKitClient();
        const errorCallback = vi.fn();
        client.onError(errorCallback);

        await expect(
            client.connect({
                roomId: 'room-a',
                playerName: 'SimulateMismatch'
            })
        ).rejects.toThrow('IDENTITY_MISMATCH');

        expect(errorCallback).toHaveBeenCalledWith('IDENTITY_MISMATCH');
        expect(getStorageItem(getPlayerIdStorageKey('room-a'))).toBeNull();
        expect(getStorageItem(getPlayerStorageKey('room-a'))).toBeNull();
        expect(getStorageItem(getPlayerTokenStorageKey('room-a'))).toBeNull();
    });

    it('sets diagnostic report and disconnects socket on 1006 failure', async () => {
        const client = new PartyKitClient();
        const errorCallback = vi.fn();
        client.onError(errorCallback);

        await expect(
            client.connect({
                roomId: 'room-fail',
                playerName: 'SimulateClose1006'
            })
        ).rejects.toThrow('Connection error (1006)');

        expect(errorCallback).toHaveBeenCalledWith('Connection error (1006)');
        expect(client.getConnectionReport()?.closeCode).toBe(1006);
    });
});
