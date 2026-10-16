'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import type { Player } from '@/types';
import { Card } from './Card';
import { getInitials, getAvatarColor } from '@/lib/poker-logic';

interface PlayerItemProps {
    player: Player;
    isCurrentPlayer: boolean;
    hasCard: boolean;
    isRevealed: boolean;
    onTransferHost?: (playerId: string) => void;
    canTransferHost?: boolean;
}

const PlayerItem = memo(({ player, isCurrentPlayer, hasCard, isRevealed, onTransferHost, canTransferHost }: PlayerItemProps) => {
    const t = useTranslations('players');

    return (
        <li
            className={`
                relative group/player flex flex-col items-center gap-3 p-4 rounded-xl
                border transition-all duration-150
                ${isCurrentPlayer
                    ? 'bg-zinc-50 dark:bg-zinc-900 border-indigo-400 dark:border-indigo-600/70 shadow-xs'
                    : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 shadow-2xs'}
            `}
        >
            {/* Host badge */}
            {player.isHost && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full z-10 tracking-wider">
                    {t('host')}
                </span>
            )}

            {/* Transfer Host Button - accessible on hover AND keyboard focus */}
            {canTransferHost && !player.isHost && onTransferHost && (
                <button
                    type="button"
                    onClick={() => onTransferHost(player.id)}
                    className="
                        absolute -top-2.5 right-2 opacity-0
                        group-hover/player:opacity-100 focus-visible:opacity-100
                        bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400
                        hover:bg-amber-50 dark:hover:bg-amber-950/40
                        border border-amber-300 dark:border-amber-700/60
                        text-[10px] font-medium px-2 py-0.5 rounded-md shadow-2xs
                        transition-opacity duration-150 z-10 cursor-pointer
                    "
                    aria-label={`${t('makeHost')}: ${player.name}`}
                >
                    {t('makeHost')}
                </button>
            )}

            {/* Avatar */}
            <div
                aria-hidden="true"
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-xs border border-white/20 select-none"
                style={{ background: getAvatarColor(player.name, player.id) }}
            >
                {getInitials(player.name)}
            </div>

            {/* Name */}
            <div className="flex items-center justify-center max-w-full text-center">
                <span className={`
                    text-xs font-medium truncate
                    ${isCurrentPlayer ? 'text-indigo-950 dark:text-indigo-200 font-semibold' : 'text-zinc-900 dark:text-zinc-200'}
                `}>
                    {player.name}{isCurrentPlayer && ` ${t('you')}`}
                </span>
            </div>

            {/* Card status */}
            <div className="mt-auto pt-1">
                {isRevealed && player.selectedCard ? (
                    <Card
                        value={player.selectedCard}
                        isRevealed={true}
                        size="sm"
                    />
                ) : isCurrentPlayer && player.selectedCard ? (
                    <Card
                        value={player.selectedCard}
                        isRevealed={false}
                        isSelected={true}
                        size="sm"
                    />
                ) : hasCard ? (
                    <Card
                        value="?"
                        isBack={true}
                        size="sm"
                    />
                ) : (
                    <div
                        className="w-12 h-16 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/30"
                        aria-label="No estimate chosen"
                    >
                        <span className="text-zinc-400 dark:text-zinc-600 text-xs font-mono select-none">—</span>
                    </div>
                )}
            </div>
        </li>
    );
});

PlayerItem.displayName = 'PlayerItem';

interface PlayerListProps {
    players: Player[];
    currentPlayerId: string | undefined;
    isRevealed: boolean;
    playersWithCards: Set<string>;
    onTransferHost?: (playerId: string) => void;
    canTransferHost?: boolean;
}

function PlayerListComponent({ players, currentPlayerId, isRevealed, playersWithCards, onTransferHost, canTransferHost }: PlayerListProps) {
    const t = useTranslations('players');

    return (
        <section className="w-full" aria-labelledby="player-list-heading">
            <div className="flex items-center justify-between mb-4">
                <h2 id="player-list-heading" className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                    {t('title')} ({players.length})
                </h2>
            </div>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 list-none p-0 m-0">
                {players.map((player) => (
                    <PlayerItem
                        key={player.id}
                        player={player}
                        isCurrentPlayer={player.id === currentPlayerId}
                        hasCard={playersWithCards.has(player.id)}
                        isRevealed={isRevealed}
                        onTransferHost={onTransferHost}
                        canTransferHost={canTransferHost}
                    />
                ))}
            </ul>
        </section>
    );
}

export const PlayerList = memo(PlayerListComponent);
