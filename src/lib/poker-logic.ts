import { DECKS, type DeckType, type CardValue, type Player, type Results } from '@/types';

// Constants
export const MAX_NAME_LENGTH = 50;
export const MAX_TOPIC_LENGTH = 200;
export const MAX_HISTORY_ITEMS = 50;

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

export function validateTopic(topic: unknown): string {
    if (typeof topic !== 'string') return '';
    return topic.trim().slice(0, MAX_TOPIC_LENGTH).replace(/[<>&"']/g, '');
}

/**
 * Normalizes a card value by removing emoji variation selectors
 * and performing standard Unicode normalization.
 */
export function normalizeCardValue(value: string): string {
    return value
        .normalize('NFC')
        .replace(/\ufe0f/g, '');
}

export function validateCardValue(value: unknown, deckType: DeckType = 'scrum'): CardValue | null {
    if (typeof value !== 'string') return null;

    const normalizedValue = normalizeCardValue(value);
    const validCards = DECKS[deckType] || DECKS.scrum;

    // Find a matching card in the deck using normalized comparison
    const matchedCard = (validCards as readonly string[]).find(
        card => normalizeCardValue(card) === normalizedValue
    );

    return (matchedCard as CardValue) || null;
}

// Helper to find closest T-shirt size
function findClosestTshirtSize(value: number, deckValues: readonly string[]): string {
    let minDiff = Number.MAX_VALUE;
    let closestSize = deckValues[0];

    for (const size of deckValues) {
        const val = TSHIRT_VALUES[size];
        if (val !== undefined) {
            const diff = Math.abs(value - val);
            if (diff < minDiff) {
                minDiff = diff;
                closestSize = size;
            }
        }
    }
    return closestSize;
}

// Result Calculation
export function calculateResults(players: Player[], deckType: DeckType = 'scrum'): Results {
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
    let numericMedian = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

    const deckValues = (DECKS[deckType] || DECKS.scrum)
        .filter(v => v !== '?' && v !== '☕');

    let suggestion: string | number | null = null;
    let average: string | number | null = null;
    let median: string | number | null = null;

    if (deckType === 'tshirt') {
        suggestion = findClosestTshirtSize(numericAverage, deckValues);
        average = findClosestTshirtSize(numericAverage, deckValues);
        median = findClosestTshirtSize(numericMedian, deckValues);
    } else {
        // Numeric decks
        const numericDeckValues = deckValues
            .map(v => v === '½' ? 0.5 : parseFloat(v))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);

        if (numericDeckValues.length > 0) {
            let closestVal = numericDeckValues[0];
            let minDiff = Math.abs(numericAverage - closestVal);

            for (const val of numericDeckValues) {
                const diff = Math.abs(numericAverage - val);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestVal = val;
                }
            }
            suggestion = closestVal;
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
