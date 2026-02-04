'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { useSocket } from '@/context/SocketContext';
import { CardDeck, PlayerList, JoinModal, ResultsPanel } from '@/components';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.roomId as string;

    const { isConnected } = useSocket();
    const {
        room,
        currentPlayer,
        isHost,
        isLoading,
        error,
        joinRoom,
        rejoinRoom,
        selectCard,
        revealCards,
        resetRound,
        playersWithCards
    } = useRoom();

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isRejoining, setIsRejoining] = useState(false);
    const rejoinAttempted = useRef(false);

    // Check if user needs to join
    useEffect(() => {
        if (!isConnected || hasJoined || isLoading || isRejoining) return;

        // Check if we already have room state (happens when navigating from create)
        if (room && room.id === roomId) {
            setHasJoined(true);
            return;
        }

        // Check localStorage for saved player name (for rejoining after refresh)
        const savedPlayerName = localStorage.getItem(`vibepoker-player-${roomId}`);

        if (savedPlayerName && !rejoinAttempted.current) {
            rejoinAttempted.current = true;
            setIsRejoining(true);

            // Try to rejoin with saved name
            rejoinRoom(roomId, savedPlayerName).then(success => {
                setIsRejoining(false);
                if (success) {
                    setHasJoined(true);
                } else {
                    // Rejoin failed, clear saved data and show modal
                    localStorage.removeItem(`vibepoker-player-${roomId}`);
                    setShowJoinModal(true);
                }
            }).catch(() => {
                setIsRejoining(false);
                localStorage.removeItem(`vibepoker-player-${roomId}`);
                setShowJoinModal(true);
            });
            return;
        }

        // Show join modal for new visitors
        if (!room && !savedPlayerName) {
            setShowJoinModal(true);
        }
    }, [isConnected, room, hasJoined, isLoading, roomId, rejoinRoom, isRejoining]);

    const handleJoin = async (name: string) => {
        const success = await joinRoom(roomId, name);
        if (success) {
            setHasJoined(true);
            setShowJoinModal(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Count how many players have voted
    const votedCount = playersWithCards.size;
    const totalPlayers = room?.players.length || 0;
    const allVoted = votedCount === totalPlayers && totalPlayers > 0;

    if (!isConnected) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Verbinde zum Server...</span>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <a href="/" className="flex items-center gap-2 text-white hover:text-violet-400 transition-colors">
                            <span className="text-2xl">🃏</span>
                            <span className="font-bold text-xl hidden sm:inline">VibePOKER</span>
                        </a>
                        <div className="h-6 w-px bg-slate-700" />
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm hidden sm:inline">Raum:</span>
                            <code className="px-3 py-1 rounded-lg bg-slate-800 text-violet-400 font-mono text-sm">
                                {roomId}
                            </code>
                        </div>
                    </div>

                    <button
                        onClick={handleCopyLink}
                        className="
              flex items-center gap-2 px-4 py-2 rounded-xl
              bg-slate-800 hover:bg-slate-700
              text-white text-sm font-medium
              transition-all duration-200
            "
                    >
                        {copySuccess ? (
                            <>
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-emerald-400">Kopiert!</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span className="hidden sm:inline">Link teilen</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Main content */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {room ? (
                    <div className="space-y-8">
                        {/* Status bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`
                  flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                  ${room.isRevealed
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                        : allVoted
                                            ? 'bg-violet-500/10 text-violet-400 border border-violet-500/30 animate-pulse'
                                            : 'bg-slate-700/50 text-slate-300 border border-slate-600'}
                `}>
                                    {room.isRevealed ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Karten aufgedeckt</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{votedCount}/{totalPlayers} gewählt</span>
                                            {allVoted && <span>• Bereit zum Aufdecken!</span>}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Host controls */}
                            {isHost && (
                                <div className="flex gap-3">
                                    {!room.isRevealed ? (
                                        <button
                                            onClick={revealCards}
                                            disabled={votedCount === 0}
                                            className="
                        flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                        bg-gradient-to-r from-emerald-600 to-teal-600
                        hover:from-emerald-500 hover:to-teal-500
                        disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed
                        text-white shadow-lg shadow-emerald-500/30
                        hover:shadow-xl hover:shadow-emerald-500/40
                        transition-all duration-200
                      "
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Aufdecken
                                        </button>
                                    ) : (
                                        <button
                                            onClick={resetRound}
                                            className="
                        flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold
                        bg-gradient-to-r from-violet-600 to-purple-600
                        hover:from-violet-500 hover:to-purple-500
                        text-white shadow-lg shadow-violet-500/30
                        hover:shadow-xl hover:shadow-violet-500/40
                        transition-all duration-200
                      "
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            Neue Runde
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Results panel (when revealed) */}
                        {room.isRevealed && room.results && (
                            <ResultsPanel results={room.results} />
                        )}

                        {/* Players */}
                        <PlayerList
                            players={room.players}
                            currentPlayerId={currentPlayer?.id}
                            isRevealed={room.isRevealed}
                            playersWithCards={playersWithCards}
                        />

                        {/* Card deck (only when not revealed) */}
                        {!room.isRevealed && (
                            <div className="glass-strong rounded-2xl p-6">
                                <CardDeck
                                    selectedCard={currentPlayer?.selectedCard || null}
                                    onSelectCard={selectCard}
                                    disabled={room.isRevealed}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            {isLoading ? (
                                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Lade Raum...</span>
                                </div>
                            ) : (
                                <div className="text-slate-400">Warte auf Beitritt...</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Join Modal */}
            {showJoinModal && (
                <JoinModal
                    onJoin={handleJoin}
                    isLoading={isLoading}
                    error={error}
                />
            )}
        </main>
    );
}
