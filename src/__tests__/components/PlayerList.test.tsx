import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { PlayerList } from '@/components/PlayerList';

describe('PlayerList', () => {
    const mockPlayers = [
        { id: '1', name: 'Alice', isHost: true, selectedCard: '5' },
        { id: '2', name: 'Bob', isHost: false, selectedCard: null }
    ];

    it('renders all players', () => {
        render(
            <PlayerList
                players={mockPlayers as any}
                currentPlayerId="1"
                isRevealed={false}
                playersWithCards={new Set(['1'])}
            />
        );

        expect(screen.getByText('Players (2)')).toBeInTheDocument();
        expect(screen.getByText('Alice (You)')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('shows host badge', () => {
        render(
            <PlayerList
                players={mockPlayers as any}
                currentPlayerId="2"
                isRevealed={false}
                playersWithCards={new Set()}
            />
        );

        expect(screen.getByText('Host')).toBeInTheDocument();
    });
});
