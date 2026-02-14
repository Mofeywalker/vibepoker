import { describe, it, expect } from 'vitest';
import { validateCardValue, normalizeCardValue } from '../../lib/poker-logic';
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
