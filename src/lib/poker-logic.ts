import { DECKS, type DeckType, type CardValue, type Player, type Room, type Results, type RoundingPreference } from '@/types';

// Constants
export const MAX_NAME_LENGTH = 50;
export const MAX_TOPIC_LENGTH = 200;
export const MAX_HISTORY_ITEMS = 50;
export const RECONNECT_GRACE_MS = 30_000;

export function transferHost(room: Room, playerId: string, targetId: unknown): boolean {
    if (room.hostId !== playerId || typeof targetId !== 'string' || playerId === targetId) return false;

    const targetPlayer = room.players.find(p => p.id === targetId);
    if (!targetPlayer) return false;

    const currentPlayer = room.players.find(p => p.id === playerId);
    if (currentPlayer) currentPlayer.isHost = false;

    room.hostId = targetId;
    targetPlayer.isHost = true;
    return true;
}

export function markPlayerDisconnected(room: Room, playerId: string, disconnectedAt: number): boolean {
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.disconnectedAt !== undefined) return false;

    player.disconnectedAt = disconnectedAt;
    return true;
}

export function restorePlayer(room: Room, playerId: string, playerName: string): boolean {
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.name.toLowerCase() !== playerName.toLowerCase()) return false;

    delete player.disconnectedAt;
    if (!room.hostId) {
        room.hostId = playerId;
        player.isHost = true;
    }
    return true;
}

export function expireDisconnectedPlayers(room: Room, now: number): boolean {
    const expiredIds = new Set(
        room.players
            .filter(p => p.disconnectedAt !== undefined && p.disconnectedAt + RECONNECT_GRACE_MS <= now)
            .map(p => p.id)
    );
    if (expiredIds.size === 0) return false;

    const hostExpired = expiredIds.has(room.hostId);
    room.players = room.players.filter(p => !expiredIds.has(p.id));

    if (hostExpired) {
        const nextHost = room.players.find(p => p.disconnectedAt === undefined);
        room.hostId = nextHost?.id ?? "";
        room.players.forEach(p => p.isHost = p.id === room.hostId);
    }

    return true;
}

const TSHIRT_VALUES: Record<string, number> = {
    'XS': 1, 'S': 2, 'M': 3, 'L': 5, 'XL': 8, 'XXL': 13
};

// Validation functions
export function validatePlayerName(name: unknown): string | null {
    if (typeof name !== 'string') return null;
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) return null;
    return trimmed.replace(/[<>&"']/g, '');
}

export function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function getAvatarColor(name: string, id: string): string {
    let hash = 0;
    // Use name for the base color, but add ID to ensure uniqueness for collisions
    const str = name + id;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = Math.abs(hash) % 360;
    const s = 65 + (Math.abs(hash >> 8) % 20); // 65-85% saturation
    const l = 45 + (Math.abs(hash >> 16) % 10); // 45-55% lightness
    
    const color1 = `hsl(${h}, ${s}%, ${l}%)`;
    const color2 = `hsl(${(h + 40) % 360}, ${s}%, ${l - 5}%)`;
    
    return `linear-gradient(135deg, ${color1}, ${color2})`;
}

export function validateTopic(topic: unknown): string {
    if (typeof topic !== 'string') return '';
    return topic.trim().slice(0, MAX_TOPIC_LENGTH).replace(/[<>&"']/g, '');
}

export function generateRoomId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(bytes, b => alphabet[b % 36]).join('');
}

/**
 * Normalizes a card value by removing emoji variation selectors
 * and performing standard Unicode normalization.
 */
export function normalizeCardValue(value: string): string {
    const normalized = value
        .trim()
        .normalize('NFC')
        // Strip emoji/text presentation selectors (e.g. ☕️ / ☕︎)
        .replace(/[\ufe0e\ufe0f]/g, '');

    // Accept common alternate encodings for "½" that might appear across clients.
    if (normalized === '1/2' || normalized === '0.5') return '½';

    return normalized;
}

// Precomputed normalized lookup maps for instant O(1) card validation
const NORMALIZED_DECKS: Record<DeckType, Map<string, CardValue>> = {
    scrum: new Map((DECKS.scrum as readonly string[]).map(card => [normalizeCardValue(card), card])),
    fibonacci: new Map((DECKS.fibonacci as readonly string[]).map(card => [normalizeCardValue(card), card])),
    sequential: new Map((DECKS.sequential as readonly string[]).map(card => [normalizeCardValue(card), card])),
    hourly: new Map((DECKS.hourly as readonly string[]).map(card => [normalizeCardValue(card), card])),
    tshirt: new Map((DECKS.tshirt as readonly string[]).map(card => [normalizeCardValue(card), card])),
};

export function validateCardValue(value: unknown, deckType: DeckType = 'scrum'): CardValue | null {
    let strValue: string;
    if (typeof value === 'string') {
        strValue = value;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
        strValue = String(value);
    } else {
        return null;
    }

    const normalizedValue = normalizeCardValue(strValue);
    const deckMap = NORMALIZED_DECKS[deckType] || NORMALIZED_DECKS.scrum;
    return deckMap.get(normalizedValue) || null;
}

/**
 * Returns the nearest value in a sorted numeric deck to `average`.
 * The `rounding` preference is only used as a tie-breaker when the average
 * falls exactly halfway between two adjacent deck values.
 */
function roundToNearestDeckValue(average: number, sortedValues: number[], rounding: RoundingPreference): number {
    if (sortedValues.length === 0) return average;
    if (average <= sortedValues[0]) return sortedValues[0];
    if (average >= sortedValues[sortedValues.length - 1]) return sortedValues[sortedValues.length - 1];

    let floorVal = sortedValues[0];
    let ceilVal = sortedValues[sortedValues.length - 1];

    for (const v of sortedValues) {
        if (v <= average) floorVal = v;
        else { ceilVal = v; break; }
    }

    if (floorVal === ceilVal) return floorVal;

    const distDown = average - floorVal;
    const distUp = ceilVal - average;

    if (distDown < distUp) return floorVal;
    if (distUp < distDown) return ceilVal;
    // Exact tie: use rounding preference
    return rounding === 'up' ? ceilVal : floorVal;
}

// Helper to find closest or rounded T-shirt size
function findTshirtSize(value: number, deckValues: readonly string[], rounding: RoundingPreference = 'down'): string {
    const numericDeck = deckValues
        .map(size => ({ size, val: TSHIRT_VALUES[size] }))
        .filter(item => item.val !== undefined)
        .sort((a, b) => a.val - b.val);

    if (numericDeck.length === 0) return deckValues[0];

    const nearest = roundToNearestDeckValue(value, numericDeck.map(i => i.val), rounding);
    return numericDeck.find(i => i.val === nearest)!.size;
}

// Result Calculation
export function calculateResults(players: Player[], deckType: DeckType = 'scrum', rounding: RoundingPreference = 'down'): Results {
    const allCards = players.map(p => p.selectedCard).filter((card): card is CardValue => card !== null);

    // Count occurrences
    const countMap = new Map<CardValue, number>();
    allCards.forEach(card => {
        countMap.set(card, (countMap.get(card) || 0) + 1);
    });

    const breakdown = Array.from(countMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);

    const mode = breakdown.length > 0 ? breakdown[0].value : null;

    // Filter numeric values
    const numericValues = allCards
        .filter(card => card !== '?' && card !== '☕')
        .map(card => {
            if (deckType === 'tshirt' && typeof card === 'string') {
                return TSHIRT_VALUES[card] || NaN;
            }
            return card === '½' ? 0.5 : parseFloat(card);
        })
        .filter(n => !isNaN(n));

    // If no numeric values, return basic results
    if (numericValues.length === 0) {
        return { average: null, median: null, mode, suggestion: null, breakdown };
    }

    // Average
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const numericAverage = sum / numericValues.length;

    // Median
    const sorted = [...numericValues].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const numericMedian = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

    const deckValues = (DECKS[deckType] || DECKS.scrum)
        .filter(v => v !== '?' && v !== '☕');

    let suggestion: string | number | null = null;
    let average: string | number | null = null;
    let median: string | number | null = null;

    if (deckType === 'tshirt') {
        suggestion = findTshirtSize(numericAverage, deckValues, rounding);
        average = findTshirtSize(numericAverage, deckValues, rounding);
        median = findTshirtSize(numericMedian, deckValues, rounding);
    } else {
        // Numeric decks
        const numericDeckValues = deckValues
            .map(v => v === '½' ? 0.5 : parseFloat(v))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);

        if (numericDeckValues.length > 0) {
            suggestion = roundToNearestDeckValue(numericAverage, numericDeckValues, rounding);

            // Convert back to string representation if it was '½'
            if (suggestion === 0.5) suggestion = '½';
        }

        average = Math.round(numericAverage * 10) / 10;
        median = numericMedian;
    }

    return {
        average,
        median,
        mode,
        suggestion,
        breakdown
    };
}
