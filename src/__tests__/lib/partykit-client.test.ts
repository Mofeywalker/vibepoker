import { beforeEach, describe, expect, it, vi } from 'vitest';

const socketOptions = vi.hoisted(() => [] as Array<{ id: string; room: string }>);

vi.mock('partysocket', () => ({
    default: class MockPartySocket extends EventTarget {
        id: string;

        constructor(options: { id: string; room: string }) {
            super();
            this.id = options.id;
            socketOptions.push(options);
            queueMicrotask(() => this.dispatchEvent(new Event('open')));
        }

        close() { }
    }
}));

import { PartyKitClient } from '@/lib/realtime/partykit-client';

describe('PartyKitClient player identity', () => {
    beforeEach(() => {
        localStorage.clear();
        socketOptions.length = 0;
    });

    it('reuses the room-scoped player ID across client instances', async () => {
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
    });

    it('uses a different player ID for another room', async () => {
        const client = new PartyKitClient();
        const firstId = await client.connect({ roomId: 'room-a', playerName: 'Host' });
        const secondId = await client.connect({ roomId: 'room-b', playerName: 'Host' });

        expect(secondId).not.toBe(firstId);
    });
});
