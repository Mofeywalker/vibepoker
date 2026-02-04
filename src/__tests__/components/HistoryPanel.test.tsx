import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { HistoryPanel } from '@/components/HistoryPanel';

describe('HistoryPanel', () => {
    const mockHistory = [
        { topic: 'Feature A', value: '5' as any, timestamp: 123 },
        { topic: 'Bug Fix B', value: '3' as any, timestamp: 456 },
        { topic: 'Refactoring C', value: '8' as any, timestamp: 789 }
    ];

    it('does not render when history is empty', () => {
        const { container } = render(<HistoryPanel history={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders history header with count', () => {
        render(<HistoryPanel history={mockHistory} />);
        expect(screen.getByText('History')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // Count badge
    });

    it('starts collapsed by default', () => {
        render(<HistoryPanel history={mockHistory} />);

        // History items should not be visible initially
        expect(screen.queryByText('Feature A')).not.toBeInTheDocument();
        expect(screen.queryByText('Bug Fix B')).not.toBeInTheDocument();
    });

    it('expands when header is clicked', () => {
        render(<HistoryPanel history={mockHistory} />);

        // Click the header button to expand
        const headerButton = screen.getByRole('button');
        fireEvent.click(headerButton);

        // History items should now be visible
        expect(screen.getByText('Feature A')).toBeInTheDocument();
        expect(screen.getByText('Bug Fix B')).toBeInTheDocument();
        expect(screen.getByText('Refactoring C')).toBeInTheDocument();
    });

    it('displays all history items with correct values', () => {
        render(<HistoryPanel history={mockHistory} />);

        // Expand the panel
        fireEvent.click(screen.getByRole('button'));

        // Check all topics are displayed
        expect(screen.getByText('Feature A')).toBeInTheDocument();
        expect(screen.getByText('Bug Fix B')).toBeInTheDocument();
        expect(screen.getByText('Refactoring C')).toBeInTheDocument();

        // Check all values are displayed (note: '3' appears twice - in badge and table)
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('toggles between expanded and collapsed states', () => {
        render(<HistoryPanel history={mockHistory} />);

        const headerButton = screen.getByRole('button');

        // Initially collapsed
        expect(screen.queryByText('Feature A')).not.toBeInTheDocument();

        // Expand
        fireEvent.click(headerButton);
        expect(screen.getByText('Feature A')).toBeInTheDocument();

        // Collapse again
        fireEvent.click(headerButton);
        expect(screen.queryByText('Feature A')).not.toBeInTheDocument();
    });
});
