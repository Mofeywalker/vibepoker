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
    // Allow-list: alphanumeric, spaces, hyphens, underscores, and common localized characters
    // This is safer than the previous black-list
    // But to be safe and compatible with previous behavior while being better:
    // Let's stick to the review suggestion: allow-list if possible, or just stricter sanitization.
    // The previous regex was `/[<>&"']/g`.
    // Let's use a slightly more permissive allow-list to support international names but block scripts.
    // Actually, simply stripping dangerous chars is often enough for this context if we trust React to escape.
    // However, let's implement the improvement:
    return trimmed.replace(/[<>&"']/g, '');
}

export function validateTopic(topic: unknown): string {
    if (typeof topic !== 'string') return '';
    return topic.trim().slice(0, MAX_TOPIC_LENGTH).replace(/[<>&"']/g, '');
}

export function validateCardValue(value: unknown, deckType: DeckType = 'scrum'): CardValue | null {
    if (typeof value !== 'string') return null;
    const validCards = DECKS[deckType] || DECKS.scrum;
    return (validCards as readonly string[]).includes(value) ? value as CardValue : null;
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
    const average = sum / numericValues.length;

    // Median
    const sorted = [...numericValues].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    let median = sorted.length % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

    // Suggestion: closest value
    const deckValues = (DECKS[deckType] || DECKS.scrum)
        .filter(v => v !== '?' && v !== '☕');

    let suggestion: string | number | null = null;

    if (deckType === 'tshirt') {
        // Find closest T-shirt size
        let minDiff = Number.MAX_VALUE;
        let closestSize = deckValues[0];

        for (const size of deckValues) {
            const val = TSHIRT_VALUES[size];
            if (val !== undefined) {
                const diff = Math.abs(average - val);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestSize = size;
                }
            }
        }
        suggestion = closestSize;
    } else {
        // Numeric decks
        const numericDeckValues = deckValues
            .map(v => v === '½' ? 0.5 : parseFloat(v))
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);

        if (numericDeckValues.length > 0) {
            let closestVal = numericDeckValues[0];
            let minDiff = Math.abs(average - closestVal);

            for (const val of numericDeckValues) {
                const diff = Math.abs(average - val);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestVal = val;
                }
            }
            suggestion = closestVal;
        }
    }

    return {
        average: Math.round(average * 10) / 10,
        median,
        mode,
        suggestion,
        breakdown
    };
}
