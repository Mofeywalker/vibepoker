import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { CardDeck } from '@/components/CardDeck';
import { DECKS } from '@/types';

describe('CardDeck', () => {
    const deck = DECKS.fibonacci;

    it('renders all cards', () => {
        const handleSelect = vi.fn();
        render(<CardDeck selectedCard={null} onSelectCard={handleSelect} values={deck} />);

        // Fibonnaci sequence usually: 0, 1, 2, 3, 5, 8, 13, 20, etc. or similar set
        // Based on previous file views, I saw "5", "13", "8", "3" in the background of page.tsx
        // Let's assume standard set or check if "Select your estimate" text is present (header)
        expect(screen.getByText('Select your estimate')).toBeInTheDocument();

        // Check for a few card values
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('13')).toBeInTheDocument();
    });

    it('calls onSelectCard when a card is clicked', () => {
        const handleSelect = vi.fn();
        render(<CardDeck selectedCard={null} onSelectCard={handleSelect} values={deck} />);

        const card5 = screen.getByText('5');
        fireEvent.click(card5);

        expect(handleSelect).toHaveBeenCalledWith('5');
    });

    it('deselects card when clicked again', () => {
        const handleSelect = vi.fn();
        render(<CardDeck selectedCard="5" onSelectCard={handleSelect} values={deck} />);

        const card5 = screen.getByText('5');
        fireEvent.click(card5);

        expect(handleSelect).toHaveBeenCalledWith(null);
    });

    it('does not trigger selection when disabled', () => {
        const handleSelect = vi.fn();
        render(<CardDeck selectedCard={null} onSelectCard={handleSelect} disabled={true} values={deck} />);

        const card5 = screen.getByText('5');
        fireEvent.click(card5);

        expect(handleSelect).not.toHaveBeenCalled();
    });
});
