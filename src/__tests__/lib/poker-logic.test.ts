import { describe, it, expect } from 'vitest';
import { validateCardValue, normalizeCardValue, getInitials, getAvatarColor, calculateResults } from '../../lib/poker-logic';
import { DECKS, isDeckType } from '../../types';

describe('isDeckType', () => {
    it('accepts configured decks and rejects other values', () => {
        expect(isDeckType('scrum')).toBe(true);
        expect(isDeckType('constructor')).toBe(false);
        expect(isDeckType(null)).toBe(false);
    });
});

describe('poker-logic normalization', () => {
    it('normalizeCardValue should remove variation selector from mug', () => {
        const mugPlain = '☕'; // U+2615
        const mugWithSelector = '☕️'; // U+2615 U+FE0F
        expect(normalizeCardValue(mugWithSelector)).toBe(mugPlain);
    });

    it('normalizeCardValue should remove text presentation selector from mug', () => {
        const mugPlain = '☕'; // U+2615
        const mugWithTextSelector = '☕︎'; // U+2615 U+FE0E
        expect(normalizeCardValue(mugWithTextSelector)).toBe(mugPlain);
    });

    it('normalizeCardValue should map 1/2 and 0.5 to ½', () => {
        expect(normalizeCardValue('1/2')).toBe('½');
        expect(normalizeCardValue('0.5')).toBe('½');
    });

    it('validateCardValue should succeed with variation selector', () => {
        const mugPlain = '☕';
        const mugWithSelector = '☕️';
        const result = validateCardValue(mugWithSelector, 'scrum');
        expect(result).toBe(mugPlain);
    });

    it('validateCardValue should accept numeric inputs for numeric decks', () => {
        expect(validateCardValue(40, 'scrum')).toBe('40');
        expect(validateCardValue(100, 'scrum')).toBe('100');
    });

    it('validateCardValue should accept 1/2 as ½', () => {
        expect(validateCardValue('1/2', 'scrum')).toBe('½');
        expect(validateCardValue(0.5, 'scrum')).toBe('½');
    });

    it('validateCardValue should work for all deck types with mug', () => {
        const mug = '☕';
        const deckTypes = Object.keys(DECKS) as (keyof typeof DECKS)[];

        for (const deckType of deckTypes) {
            const result = validateCardValue(mug, deckType);
            expect(result).toBe(mug);
        }
    });
});

describe('getInitials', () => {
    it('should return two initials for multiple names', () => {
        expect(getInitials('John Doe')).toBe('JD');
        expect(getInitials('Alice Bob Charlie')).toBe('AB');
    });

    it('should handle single names', () => {
        expect(getInitials('John')).toBe('J');
    });

    it('should handle multiple spaces', () => {
        expect(getInitials('  John   Doe  ')).toBe('JD');
    });

    it('should uppercase initials', () => {
        expect(getInitials('john doe')).toBe('JD');
    });
});

describe('getAvatarColor', () => {
    it('should be deterministic for same name and id', () => {
        const color1 = getAvatarColor('Alice', 'id1');
        const color2 = getAvatarColor('Alice', 'id1');
        expect(color1).toBe(color2);
    });

    it('should return different colors for different ids with same name', () => {
        const color1 = getAvatarColor('Alice', 'id1');
        const color2 = getAvatarColor('Alice', 'id2');
        expect(color1).not.toBe(color2);
    });

    it('should return different colors for different names', () => {
        const color1 = getAvatarColor('Alice', 'id1');
        const color2 = getAvatarColor('Bob', 'id1');
        expect(color1).not.toBe(color2);
    });

    it('should return a valid linear-gradient string', () => {
        const color = getAvatarColor('Alice', 'id1');
        expect(color).toMatch(/^linear-gradient\(135deg, hsl\(\d+, \d+%, \d+%\), hsl\(\d+, \d+%, \d+%\)\)$/);
    });
});

describe('calculateResults – suggestion rounding', () => {
    function makePlayer(id: string, card: string | null) {
        return { id, name: id, selectedCard: card, isHost: false };
    }

    // Reported bug: 5×5 + 1×3 → average 4.666 → nearest is 5, not 3
    it('rounds down to nearest card, not strict floor (reported bug)', () => {
        const players = [
            makePlayer('a', '5'), makePlayer('b', '5'), makePlayer('c', '5'),
            makePlayer('d', '5'), makePlayer('e', '5'), makePlayer('f', '3'),
        ];
        const result = calculateResults(players, 'scrum', 'down');
        expect(result.suggestion).toBe(5);
    });

    it('rounds up to nearest card, not strict ceiling', () => {
        // 1×5 + 5×3 → average 3.333 → nearest is 3
        const players = [
            makePlayer('a', '5'), makePlayer('b', '3'), makePlayer('c', '3'),
            makePlayer('d', '3'), makePlayer('e', '3'), makePlayer('f', '3'),
        ];
        const result = calculateResults(players, 'scrum', 'up');
        expect(result.suggestion).toBe(3);
    });

    it('returns exact deck value when average lands on it', () => {
        const players = [makePlayer('a', '5'), makePlayer('b', '5'), makePlayer('c', '5')];
        const result = calculateResults(players, 'scrum', 'down');
        expect(result.suggestion).toBe(5);
    });

    it('tie-breaks with rounding=down when average is equidistant', () => {
        // scrum deck: 3 and 5 → midpoint is 4 → equidistant → 'down' picks 3
        const players = [makePlayer('a', '3'), makePlayer('b', '5')];
        const result = calculateResults(players, 'scrum', 'down');
        expect(result.suggestion).toBe(3);
    });

    it('tie-breaks with rounding=up when average is equidistant', () => {
        // same midpoint 4 → 'up' picks 5
        const players = [makePlayer('a', '3'), makePlayer('b', '5')];
        const result = calculateResults(players, 'scrum', 'up');
        expect(result.suggestion).toBe(5);
    });

    it('handles T-shirt deck – rounds to nearest, not strict floor', () => {
        // XL=8, XXL=13 → average of 2×XL + 1×XXL = 29/3 ≈ 9.67 → nearer to XL(8 vs 13)? dist 1.67 vs 3.33 → XL
        const players = [
            makePlayer('a', 'XL'), makePlayer('b', 'XL'), makePlayer('c', 'XXL'),
        ];
        const result = calculateResults(players, 'tshirt', 'down');
        expect(result.suggestion).toBe('XL');
    });

    it('uses the rounding preference to break T-shirt deck ties', () => {
        const players = [makePlayer('a', 'M'), makePlayer('b', 'L')];
        expect(calculateResults(players, 'tshirt').suggestion).toBe('M');
        expect(calculateResults(players, 'tshirt', 'down').suggestion).toBe('M');
        expect(calculateResults(players, 'tshirt', 'up').suggestion).toBe('L');
    });

    it('returns T-shirt sizes for averages and ignores non-numeric cards', () => {
        const players = [makePlayer('a', 'S'), makePlayer('b', '?'), makePlayer('c', '☕')];
        const result = calculateResults(players, 'tshirt');
        expect(result.average).toBe('S');
        expect(result.median).toBe('S');
    });

    it('returns empty numeric results when nobody played a numeric card', () => {
        const result = calculateResults([makePlayer('a', '?'), makePlayer('b', '☕')], 'tshirt');
        expect(result.average).toBeNull();
        expect(result.median).toBeNull();
        expect(result.suggestion).toBeNull();
    });

    it('average below all deck values returns smallest card', () => {
        // Only ½ votes – average 0.5 which is actually on the deck
        const players = [makePlayer('a', '½'), makePlayer('b', '½')];
        const result = calculateResults(players, 'scrum', 'down');
        expect(result.suggestion).toBe('½');
    });

    it('average above all deck values returns largest card', () => {
        const players = [makePlayer('a', '100'), makePlayer('b', '100')];
        const result = calculateResults(players, 'scrum', 'up');
        expect(result.suggestion).toBe(100);
    });

    it('rounds an average of 7.8 to 8', () => {
        const players = [
            makePlayer('a', '8'), makePlayer('b', '8'), makePlayer('c', '5'),
            makePlayer('d', '5'), makePlayer('e', '13'),
        ];
        const result = calculateResults(players, 'scrum', 'down');
        expect(result.suggestion).toBe(8);
    });
});
