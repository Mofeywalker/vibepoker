'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import type { Player } from '@/types';
import { Card } from './Card';
import { getInitials } from '@/lib/poker-logic';

interface PlayerItemProps {
    player: Player;
    isCurrentPlayer: boolean;
    hasCard: boolean;
    isRevealed: boolean;
    onTransferHost?: (playerId: string) => void;
    canTransferHost?: boolean;
}

function arePlayerItemPropsEqual(prev: PlayerItemProps, next: PlayerItemProps): boolean {
    return (
        prev.player.id === next.player.id &&
        prev.player.name === next.player.name &&
        prev.player.isHost === next.player.isHost &&
        prev.player.selectedCard === next.player.selectedCard &&
        prev.player.disconnectedAt === next.player.disconnectedAt &&
        prev.isCurrentPlayer === next.isCurrentPlayer &&
        prev.hasCard === next.hasCard &&
        prev.isRevealed === next.isRevealed &&
        prev.canTransferHost === next.canTransferHost &&
        prev.onTransferHost === next.onTransferHost
    );
}

const PlayerItem = memo(({ player, isCurrentPlayer, hasCard, isRevealed, onTransferHost, canTransferHost }: PlayerItemProps) => {
    const t = useTranslations('players');
    const initials = getInitials(player.name);

    return (
        <li
            className={`
                relative group/player flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl
                border transition-all duration-150
                ${isCurrentPlayer
                    ? 'bg-white dark:bg-zinc-900 border-blue-500/50 dark:border-blue-400/40 ring-2 ring-blue-500/8 dark:ring-blue-400/10 shadow-xs'
                    : 'bg-white/80 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 shadow-2xs'}
            `}
        >
            {/* Host badge — clean monochrome pill */}
            {player.isHost && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 border border-zinc-950 dark:border-zinc-100 text-[0.6875rem] font-semibold uppercase px-2.5 py-0.5 rounded-full z-10 tracking-wider shadow-2xs">
                    <span className="text-trim">{t('host')}</span>
                </span>
            )}

            {/* Transfer Host Button - accessible on touch devices, hover, AND keyboard focus */}
            {canTransferHost && !player.isHost && onTransferHost && (
                <button
                    type="button"
                    onClick={() => onTransferHost(player.id)}
                    className="
                        absolute -top-3 right-2
                        opacity-100 sm:opacity-0
                        sm:group-hover/player:opacity-100 focus-visible:opacity-100
                        inline-flex items-center gap-1 min-h-7
                        bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300
                        hover:bg-zinc-950 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950
                        border border-zinc-300 dark:border-zinc-700
                        text-xs font-medium px-2.5 py-1 rounded-full shadow-xs
                        transition-all duration-150 z-10 cursor-pointer active:scale-95
                    "
                    aria-label={`${t('makeHost')}: ${player.name}`}
                >
                    <span className="text-trim">{t('makeHost')}</span>
                </button>
            )}

            {/* Monochrome Apple / Vercel Avatar (zero rainbow gradients) */}
            <div
                aria-hidden="true"
                className={`
                    w-11 h-11 rounded-full flex items-center justify-center font-mono font-semibold text-sm select-none
                    ${isCurrentPlayer
                        ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
                        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'}
                `}
            >
                {initials}
            </div>

            {/* Name */}
            <div className="flex items-center justify-center max-w-full text-center min-w-0">
                <span className={`
                    text-sm tracking-tight truncate
                    ${isCurrentPlayer ? 'text-zinc-950 dark:text-zinc-50 font-bold' : 'text-zinc-800 dark:text-zinc-200 font-medium'}
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
                        className="w-14 h-20 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/30"
                        aria-label="No estimate chosen"
                    >
                        <span className="text-zinc-400 dark:text-zinc-600 text-sm font-mono select-none">—</span>
                    </div>
                )}
            </div>
        </li>
    );
}, arePlayerItemPropsEqual);

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
        <section className="w-full @container" aria-labelledby="player-list-heading">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <svg aria-hidden="true" className="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 id="player-list-heading" className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-trim">
                        {t('title')} ({players.length})
                    </h2>
                </div>
            </div>
            <ul className="grid grid-cols-2 @sm:grid-cols-3 @2xl:grid-cols-4 @5xl:grid-cols-6 gap-3.5 sm:gap-4 list-none p-0 m-0">
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
