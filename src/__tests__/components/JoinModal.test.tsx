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

    it('displays friendly message for IDENTITY_MISMATCH', () => {
        render(<JoinModal onJoin={() => { }} error="IDENTITY_MISMATCH" />);
        expect(screen.getByText('Session conflict. Session was reset – please try joining again.')).toBeInTheDocument();
    });

    it('displays friendly message for NAME_TAKEN', () => {
        render(<JoinModal onJoin={() => { }} error="NAME_TAKEN" />);
        expect(screen.getByText('This name is already taken in this room.')).toBeInTheDocument();
    });

    it('maps close codes to friendly messages', () => {
        const { unmount } = render(<JoinModal onJoin={() => { }} error="Connection error (1011)" />);
        expect(screen.getByText('Server error. Please try again later.')).toBeInTheDocument();
        unmount();
        render(<JoinModal onJoin={() => { }} error="Connection error (1006)" />);
        expect(screen.getByText('Connection error. Please try again.')).toBeInTheDocument();
    });

    it('retries the join with the entered name', () => {
        const handleJoin = vi.fn();
        render(<JoinModal onJoin={handleJoin} error="Connection error (1006)" />);

        fireEvent.change(screen.getByPlaceholderText('e.g. John Doe'), { target: { value: 'Alice' } });
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

        expect(handleJoin).toHaveBeenCalledWith('Alice');
    });

    it('shows loading state', () => {
        render(<JoinModal onJoin={() => { }} isLoading={true} />);
        expect(screen.getByText('Joining...')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('toggles detailed connection diagnostic report', () => {
        render(<JoinModal onJoin={() => { }} error="Connection error (1006)" roomId="test-room" />);

        const detailsButton = screen.getByRole('button', { name: 'Show details' });
        expect(detailsButton).toBeInTheDocument();
        expect(screen.queryByText('Connection Diagnostic Report')).not.toBeInTheDocument();

        fireEvent.click(detailsButton);

        expect(screen.getByText('Connection Diagnostic Report')).toBeInTheDocument();
        expect(screen.getByText(/1006 \(Abnormal Closure\)/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Hide details' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Copy report' })).toBeInTheDocument();
    });

    it('copies diagnostic report to clipboard', async () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: {
                writeText: writeTextMock
            }
        });

        render(<JoinModal onJoin={() => { }} error="Connection error (1006)" roomId="test-room" />);
        fireEvent.click(screen.getByRole('button', { name: 'Show details' }));

        const copyButton = screen.getByRole('button', { name: 'Copy report' });
        fireEvent.click(copyButton);

        expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('1006 (Abnormal Closure)'));
    });

    it('pre-fills initialName when provided', () => {
        render(<JoinModal onJoin={() => { }} initialName="Bob" />);
        const input = screen.getByPlaceholderText('e.g. John Doe') as HTMLInputElement;
        expect(input.value).toBe('Bob');
    });
});
