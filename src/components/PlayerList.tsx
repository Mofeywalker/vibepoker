'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import type { Player } from '@/types';
import { Card } from './Card';

interface PlayerItemProps {
    player: Player;
    isCurrentPlayer: boolean;
    hasCard: boolean;
    isRevealed: boolean;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getAvatarColor(name: string): string {
    const colors = [
        'from-pink-500 to-rose-500',
        'from-violet-500 to-purple-500',
        'from-blue-500 to-cyan-500',
        'from-emerald-500 to-teal-500',
        'from-amber-500 to-orange-500',
        'from-red-500 to-pink-500',
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

const PlayerItem = memo(({ player, isCurrentPlayer, hasCard, isRevealed }: PlayerItemProps) => {
    const t = useTranslations('players');

    return (
        <div
            className={`
                relative flex flex-col items-center gap-3 p-4 rounded-2xl
                bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border
                ${isCurrentPlayer
                    ? 'border-violet-500/50 bg-violet-100/50 dark:bg-violet-900/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/50'}
                transition-all duration-300
            `}
        >
            {/* Host badge */}
            {player.isHost && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                    Host
                </div>
            )}

            {/* Avatar */}
            <div className={`
                w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(player.name)}
                flex items-center justify-center text-white font-bold text-lg
                shadow-lg
            `}>
                {getInitials(player.name)}
            </div>

            {/* Name */}
            <span className={`
                text-sm font-medium truncate max-w-full
                ${isCurrentPlayer ? 'text-violet-800 dark:text-violet-300' : 'text-slate-900 dark:text-slate-300'}
            `}>
                {player.name}
                {isCurrentPlayer && ` ${t('you')}`}
            </span>

            {/* Card status */}
            <div className="mt-1">
                {isRevealed && player.selectedCard ? (
                    <Card
                        value={player.selectedCard}
                        isRevealed={true}
                        size="sm"
                    />
                ) : isCurrentPlayer && player.selectedCard ? (
                    <div className="relative group">
                        <Card
                            value={player.selectedCard}
                            isRevealed={false}
                            isSelected={true}
                            size="sm"
                        />
                    </div>
                ) : hasCard ? (
                    <Card
                        value="?"
                        isBack={true}
                        size="sm"
                    />
                ) : (
                    <div className="w-12 h-16 rounded-lg border-2 border-dashed border-slate-400 dark:border-slate-600 flex items-center justify-center">
                        <span className="text-slate-500 dark:text-slate-500 text-xs">—</span>
                    </div>
                )}
            </div>
        </div>
    );
});

PlayerItem.displayName = 'PlayerItem';

interface PlayerListProps {
    players: Player[];
    currentPlayerId: string | undefined;
    isRevealed: boolean;
    playersWithCards: Set<string>;
}

function PlayerListComponent({ players, currentPlayerId, isRevealed, playersWithCards }: PlayerListProps) {
    const t = useTranslations('players');

    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-300 mb-4">
                {t('title')} ({players.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {players.map((player) => (
                    <PlayerItem
                        key={player.id}
                        player={player}
                        isCurrentPlayer={player.id === currentPlayerId}
                        hasCard={playersWithCards.has(player.id)}
                        isRevealed={isRevealed}
                    />
                ))}
            </div>
        </div>
    );
}

export const PlayerList = memo(PlayerListComponent);
