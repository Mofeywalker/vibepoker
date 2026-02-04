import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { JoinModal } from '@/components/JoinModal';

describe('JoinModal', () => {
    it('renders correctly', () => {
        render(<JoinModal onJoin={() => { }} />);

        expect(screen.getByText('Join Room')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. John Doe')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
    });

    it('disables join button when input is empty', () => {
        render(<JoinModal onJoin={() => { }} />);
        const button = screen.getByRole('button', { name: 'Join' });
        expect(button).toBeDisabled();
    });

    it('calls onJoin with input value when submitted', () => {
        const handleJoin = vi.fn();
        render(<JoinModal onJoin={handleJoin} />);

        const input = screen.getByPlaceholderText('e.g. John Doe');
        fireEvent.change(input, { target: { value: 'Alice' } });

        const button = screen.getByRole('button', { name: 'Join' });
        expect(button).not.toBeDisabled();

        fireEvent.click(button);

        expect(handleJoin).toHaveBeenCalledWith('Alice');
    });

    it('displays error message if provided', () => {
        render(<JoinModal onJoin={() => { }} error="Name taken" />);
        expect(screen.getByText('Name taken')).toBeInTheDocument();
    });

    it('shows loading state', () => {
        render(<JoinModal onJoin={() => { }} isLoading={true} />);
        expect(screen.getByText('Joining...')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
