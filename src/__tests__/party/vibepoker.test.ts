
import { describe, it, expect } from 'vitest';
import { calculateResults } from '../../../party/vibepoker';
import { Player } from '../../types';

describe('calculateResults', () => {
    const createPlayer = (id: string, card: string | null): Player => ({
        id,
        name: `Player ${id}`,
        selectedCard: card,
        isHost: false
    });

    it('should calculate T-shirt suggestion correctly (Average falls on exact value)', () => {
        const players = [
            createPlayer('1', 'S'), // 2
            createPlayer('2', 'S'), // 2
            createPlayer('3', 'S')  // 2
        ];
        // Average: 2 (S)
        const results = calculateResults(players, 'tshirt');
        expect(results.suggestion).toBe('S');
        expect(results.average).toBe(2);
    });

    it('should calculate T-shirt suggestion correctly (Average falls between values)', () => {
        const players = [
            createPlayer('1', 'S'), // 2
            createPlayer('2', 'L')  // 5
        ];
        // Average: 3.5. Closest to 3.5 is M (3) or L (5)?
        // 3.5 - 3 = 0.5
        // 5 - 3.5 = 1.5
        // So M is closer.
        const results = calculateResults(players, 'tshirt');
        expect(results.suggestion).toBe('M');
        expect(results.average).toBe(3.5);
    });

    it('should calculate T-shirt suggestion correctly (Rounding up)', () => {
        const players = [
            createPlayer('1', 'M'), // 3
            createPlayer('2', 'L')  // 5
        ];
        // Average: 4. Closest to 4 is M (3) or L (5)?
        // 4 - 3 = 1
        // 5 - 4 = 1
        // Distances are equal. Our logic picks the first one found that is strictly smaller?
        // Logic: if (diff < minDiff). Since M comes before L in the list.
        // It will pick M first. Then check L. Diff is same. Condition is <, so it keeps M.
        // Let's verify what we want. Usually we don't care much, but let's see.
        const results = calculateResults(players, 'tshirt');
        expect(results.suggestion).toBe('M');
    });

    it('should handle non-numeric values in T-shirt deck (ignore ? and coffee)', () => {
        const players = [
            createPlayer('1', 'S'),
            createPlayer('2', '?'),
            createPlayer('3', '☕')
        ];
        const results = calculateResults(players, 'tshirt');
        expect(results.suggestion).toBe('S');
        expect(results.average).toBe(2);
    });

    it('should fall back to basic results if no valid values', () => {
        const players = [
            createPlayer('1', '?'),
            createPlayer('2', '☕')
        ];
        const results = calculateResults(players, 'tshirt');
        expect(results.suggestion).toBeNull();
        expect(results.average).toBeNull();
    });

    it('should still work for Scrum deck', () => {
        const players = [
            createPlayer('1', '1'),
            createPlayer('2', '3')
        ];
        const results = calculateResults(players, 'scrum');
        expect(results.suggestion).toBe(2);
        expect(results.average).toBe(2);
    });
});
