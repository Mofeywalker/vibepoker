import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { ResultsPanel } from '@/components/ResultsPanel';

describe('ResultsPanel', () => {
    const mockResults = {
        average: 4.5,
        median: 4.0,
        mode: 3,
        suggestion: 5,
        breakdown: [
            { value: '3', count: 2 },
            { value: '5', count: 1 },
            { value: '8', count: 1 }
        ]
    };

    const defaultProps = {
        results: mockResults as any,
        isHost: false,
        onAccept: vi.fn(),
        onRevote: vi.fn()
    };

    it('renders result statistics correctly', () => {
        render(<ResultsPanel {...defaultProps} />);

        expect(screen.getByText('Results')).toBeInTheDocument();
        expect(screen.getByText('Average')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument();

        // Suggestion '5' and breakdown value '5' might cause multiple matches
        const fives = screen.getAllByText('5');
        expect(fives.length).toBeGreaterThan(0);
    });

    it('renders the breakdown list', () => {
        render(<ResultsPanel {...defaultProps} />);

        expect(screen.getByText('Distribution')).toBeInTheDocument();
        expect(screen.getByText('×2')).toBeInTheDocument();
        expect(screen.getAllByText('×1')).toHaveLength(2);
    });

    it('shows actions for host', () => {
        render(<ResultsPanel {...defaultProps} isHost={true} />);
        expect(screen.getByText('Accept')).toBeInTheDocument();
        expect(screen.getByText('Re-vote')).toBeInTheDocument();
    });

    it('does not show actions for non-host', () => {
        render(<ResultsPanel {...defaultProps} isHost={false} />);
        expect(screen.queryByText('Accept')).not.toBeInTheDocument();
        expect(screen.queryByText('Re-vote')).not.toBeInTheDocument();
    });

    it('calls onAccept when accept button is clicked', () => {
        const onAccept = vi.fn();
        render(<ResultsPanel {...defaultProps} isHost={true} onAccept={onAccept} />);

        fireEvent.click(screen.getByText('Accept'));
        expect(onAccept).toHaveBeenCalledWith('5');
    });

    it('calls onRevote when revote button is clicked', () => {
        const onRevote = vi.fn();
        render(<ResultsPanel {...defaultProps} isHost={true} onRevote={onRevote} />);

        fireEvent.click(screen.getByText('Re-vote'));
        expect(onRevote).toHaveBeenCalled();
    });
});

