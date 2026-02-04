import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { ResultsPanel } from '@/components/ResultsPanel';

describe('ResultsPanel', () => {
    const mockResults = {
        average: 4.5,
        median: 4.0,
        mode: 3,
        min: 1,
        max: 8,
        suggestion: 5,
        breakdown: [
            { value: '3', count: 2 },
            { value: '5', count: 1 },
            { value: '8', count: 1 }
        ]
    };

    it('renders result statistics correctly', () => {
        render(<ResultsPanel results={mockResults as any} />);

        expect(screen.getByText('Results')).toBeInTheDocument();
        expect(screen.getByText('Average')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument();

        // Suggestion '5' and breakdown value '5' might cause multiple matches
        const fives = screen.getAllByText('5');
        expect(fives.length).toBeGreaterThan(0);
    });

    it('renders the breakdown list', () => {
        render(<ResultsPanel results={mockResults as any} />);

        expect(screen.getByText('Distribution')).toBeInTheDocument();
        expect(screen.getByText('×2')).toBeInTheDocument();
        expect(screen.getAllByText('×1')).toHaveLength(2);
    });
});
