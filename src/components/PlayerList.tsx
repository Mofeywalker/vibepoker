'use client';

import type { Player, CardValue } from '@/types';
import { Card } from './Card';

interface PlayerListProps {
    players: Player[];
    currentPlayerId: string | undefined;
    isRevealed: boolean;
    playersWithCards: Set<string>;
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

export function PlayerList({ players, currentPlayerId, isRevealed, playersWithCards }: PlayerListProps) {
    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold text-slate-300 mb-4">
                Spieler ({players.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {players.map((player) => {
                    const isCurrentPlayer = player.id === currentPlayerId;
                    const hasCard = playersWithCards.has(player.id);

                    return (
                        <div
                            key={player.id}
                            className={`
                relative flex flex-col items-center gap-3 p-4 rounded-2xl
                bg-slate-800/50 backdrop-blur-sm border
                ${isCurrentPlayer ? 'border-violet-500/50 bg-violet-900/20' : 'border-slate-700/50'}
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
                ${isCurrentPlayer ? 'text-violet-300' : 'text-slate-300'}
              `}>
                                {player.name}
                                {isCurrentPlayer && ' (Du)'}
                            </span>

                            {/* Card status */}
                            <div className="mt-1">
                                {isRevealed && player.selectedCard ? (
                                    <Card
                                        value={player.selectedCard}
                                        isRevealed={true}
                                        size="sm"
                                    />
                                ) : hasCard ? (
                                    <Card
                                        value="?"
                                        isBack={true}
                                        size="sm"
                                    />
                                ) : (
                                    <div className="w-12 h-16 rounded-lg border-2 border-dashed border-slate-600 flex items-center justify-center">
                                        <span className="text-slate-500 text-xs">—</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
