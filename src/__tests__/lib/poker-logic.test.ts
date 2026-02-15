import { describe, it, expect } from 'vitest';
import { validateCardValue, normalizeCardValue, getInitials, getAvatarColor } from '../../lib/poker-logic';
import { DECKS } from '../../types';

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


