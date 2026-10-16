import { beforeEach, describe, expect, it } from 'vitest';
import {
    getStorageItem,
    setStorageItem,
    removeStorageItem,
    getPlayerStorageKey,
    getPlayerIdStorageKey,
    getDeckStorageKey,
    clearRoomSession
} from '@/lib/storage';

describe('storage helper', () => {
    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
    });

    it('prefers sessionStorage over localStorage', () => {
        sessionStorage.setItem('test-key', 'session-value');
        localStorage.setItem('test-key', 'local-value');

        expect(getStorageItem('test-key')).toBe('session-value');
    });

    it('falls back to localStorage if sessionStorage is empty', () => {
        localStorage.setItem('test-key', 'local-value');

        expect(getStorageItem('test-key')).toBe('local-value');
    });

    it('writes to both sessionStorage and localStorage', () => {
        setStorageItem('test-key', 'value-123');

        expect(sessionStorage.getItem('test-key')).toBe('value-123');
        expect(localStorage.getItem('test-key')).toBe('value-123');
    });

    it('removes from both sessionStorage and localStorage', () => {
        sessionStorage.setItem('test-key', 'val');
        localStorage.setItem('test-key', 'val');

        removeStorageItem('test-key');

        expect(sessionStorage.getItem('test-key')).toBeNull();
        expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('clearRoomSession removes player, playerId and deck keys from both stores', () => {
        const roomId = 'room-123';
        setStorageItem(getPlayerStorageKey(roomId), 'Alice');
        setStorageItem(getPlayerIdStorageKey(roomId), 'uuid-1');
        setStorageItem(getDeckStorageKey(roomId), 'fibonacci');

        clearRoomSession(roomId);

        expect(getStorageItem(getPlayerStorageKey(roomId))).toBeNull();
        expect(getStorageItem(getPlayerIdStorageKey(roomId))).toBeNull();
        expect(getStorageItem(getDeckStorageKey(roomId))).toBeNull();
    });
});
