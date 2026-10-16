export function getStorageItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function setStorageItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(key, value);
    } catch {
        // ignore
    }
    try {
        localStorage.setItem(key, value);
    } catch {
        // ignore
    }
}

export function removeStorageItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.removeItem(key);
    } catch {
        // ignore
    }
    try {
        localStorage.removeItem(key);
    } catch {
        // ignore
    }
}

export function getPlayerStorageKey(roomId: string): string {
    return `vibepoker-player-${roomId}`;
}

export function getPlayerIdStorageKey(roomId: string): string {
    return `vibepoker-player-id-${roomId}`;
}

export function getDeckStorageKey(roomId: string): string {
    return `vibepoker-deck-${roomId}`;
}

export function clearRoomSession(roomId: string): void {
    removeStorageItem(getPlayerStorageKey(roomId));
    removeStorageItem(getPlayerIdStorageKey(roomId));
    removeStorageItem(getDeckStorageKey(roomId));
}
