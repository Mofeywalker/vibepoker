import { describe, it, expect } from 'vitest';
import { validateCardValue, normalizeCardValue } from '../../lib/poker-logic';
import { DECKS } from '../../types';

describe('poker-logic normalization', () => {
    it('normalizeCardValue should remove variation selector from mug', () => {
        const mugPlain = '☕'; // U+2615
        const mugWithSelector = '☕️'; // U+2615 U+FE0F
        expect(normalizeCardValue(mugWithSelector)).toBe(mugPlain);
    });

    it('validateCardValue should succeed with variation selector', () => {
        const mugPlain = '☕';
        const mugWithSelector = '☕️';
        const result = validateCardValue(mugWithSelector, 'scrum');
        expect(result).toBe(mugPlain);
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
