'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRoom } from '@/hooks/useRoom';
import { CardDeck, PlayerList, JoinModal, ResultsPanel, ThemeToggle, HistoryPanel, Logo } from '@/components';
import { DECKS, type DeckType } from '@/types';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const t = useTranslations('room');

    const {
        room,
        currentPlayer,
        isHost,
        isLoading,
        error,
        joinRoom,
        selectCard,
        revealCards,
        resetRound,
        updateTopic,
        acceptEstimation,
        revote,
        setRounding,
        transferHost,
        playersWithCards
    } = useRoom();

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isEditingTopic, setIsEditingTopic] = useState(false);
    const [topicInput, setTopicInput] = useState('');
    const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
    const prevHostId = useRef<string | null>(null);
    const attemptedAutoJoin = useRef(false);

    // Watch for host changes to show toast
    useEffect(() => {
        const currentHostId = room?.hostId || null;
        if (currentHostId && prevHostId.current && currentHostId !== prevHostId.current) {
            const newHost = room?.players.find(p => p.id === currentHostId);
            if (newHost) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setToast({
                    message: t('hostChanged', { name: newHost.name }),
                    visible: true
                });
            }
        }
        prevHostId.current = currentHostId;
    }, [room?.hostId, room?.players, t]);

    // Handle toast timeout
    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, visible: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.visible, toast.message]);

    const handleSaveTopic = () => {
        updateTopic(topicInput);
        setIsEditingTopic(false);
    };

    // Check if user needs to join
    useEffect(() => {
        if (isLoading) return;

        if (room && room.id === roomId) {
            return;
        }

        const savedPlayerName = localStorage.getItem(`vibepoker-player-${roomId}`);
        const savedDeckType = localStorage.getItem(`vibepoker-deck-${roomId}`) as DeckType | null;

        if (savedPlayerName) {
            if (attemptedAutoJoin.current) {
                if (error) {
                    if (error !== 'Connection error') {
                        localStorage.removeItem(`vibepoker-player-${roomId}`);
                        localStorage.removeItem(`vibepoker-deck-${roomId}`);
                    }
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setShowJoinModal(true);
                }
                return;
            }

            joinRoom(roomId, savedPlayerName, savedDeckType ?? undefined).then(success => {
                attemptedAutoJoin.current = true;
                if (!success) setShowJoinModal(true);
            }).catch(() => {
                attemptedAutoJoin.current = true;
                setShowJoinModal(true);
            });
            return;
        }

        if (!room && !savedPlayerName) {
            setShowJoinModal(true);
        }
    }, [room, isLoading, error, roomId, joinRoom]);

    const handleJoin = useCallback(async (name: string) => {
        const success = await joinRoom(roomId, name);
        if (success) {
            setShowJoinModal(false);
        }
    }, [joinRoom, roomId]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const votedCount = playersWithCards.size;
    const totalPlayers = room?.players.length || 0;
    const allVoted = votedCount === totalPlayers && totalPlayers > 0;

    const deckValues = room?.deckType && DECKS[room.deckType] ? DECKS[room.deckType] : DECKS.scrum;

    return (
        <main className="min-h-dvh flex flex-col">
            {/* Top Navigation Bar — Clean Apple / Vercel Header */}
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link
                            href="/"
                            className="flex items-center gap-2.5 text-zinc-950 dark:text-zinc-50 hover:opacity-75 transition-opacity shrink-0"
                            aria-label="VibePoker Home"
                        >
                            <Logo className="w-6 h-6" />
                            <span className="font-extrabold text-base sm:text-lg tracking-tight hidden sm:inline">
                                VibePOKER
                            </span>
                        </Link>

                        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" aria-hidden="true" />

                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium hidden sm:inline">{t('room')}:</span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 font-semibold tabular-nums truncate">
                                {roomId}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="
                                inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold
                                bg-zinc-950 hover:bg-zinc-800 text-white
                                dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950
                                shadow-xs active:scale-[0.98] transition-all duration-150 cursor-pointer min-h-10 sm:min-h-11
                            "
                        >
                            {copySuccess ? (
                                <>
                                    <svg aria-hidden="true" className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-trim">{t('copied')}</span>
                                </>
                            ) : (
                                <>
                                    <svg aria-hidden="true" className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    <span className="hidden sm:inline text-trim">{t('shareLink')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Workspace */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {room ? (
                    <div className="space-y-6 sm:space-y-8">
                        {/* Topic Header */}
                        <div className="flex items-center justify-center min-h-[3.25rem]">
                            {isEditingTopic && isHost ? (
                                <div className="flex items-center gap-2 w-full max-w-xl animate-zoom-in">
                                    <label htmlFor="topic-input" className="visually-hidden">
                                        {t('topicPlaceholder')}
                                    </label>
                                    <input
                                        id="topic-input"
                                        type="text"
                                        value={topicInput}
                                        onChange={(e) => setTopicInput(e.target.value)}
                                        placeholder={t('topicPlaceholder')}
                                        className="
                                            flex-1 min-h-11 bg-white dark:bg-zinc-900
                                            border border-zinc-300 dark:border-zinc-700
                                            rounded-xl px-4 py-2.5 text-base sm:text-sm
                                            text-zinc-950 dark:text-zinc-50
                                            placeholder-zinc-400 dark:placeholder-zinc-500
                                            shadow-2xs
                                        "
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (!e.nativeEvent.isComposing && e.key === 'Enter') {
                                                handleSaveTopic();
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSaveTopic}
                                        className="min-w-11 min-h-11 inline-flex items-center justify-center p-2.5 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
                                        title={t('save')}
                                        aria-label={t('save')}
                                    >
                                        <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingTopic(false);
                                            setTopicInput(room.topic || '');
                                        }}
                                        className="min-w-11 min-h-11 inline-flex items-center justify-center p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                                        title={t('cancel')}
                                        aria-label={t('cancel')}
                                    >
                                        <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2.5 max-w-2xl text-center">
                                    <h1 className={`text-[clamp(1.375rem,2.5vw+0.75rem,2rem)] font-bold tracking-tight leading-snug ${room.topic ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500 italic'}`}>
                                        {room.topic || t('noTopicSet')}
                                    </h1>
                                    {isHost && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTopicInput(room.topic || '');
                                                setIsEditingTopic(true);
                                            }}
                                            className="
                                                inline-flex items-center justify-center min-w-9 min-h-9 p-2
                                                text-zinc-500 dark:text-zinc-400
                                                hover:text-zinc-950 dark:hover:text-zinc-50
                                                hover:bg-zinc-200/70 dark:hover:bg-zinc-800
                                                rounded-xl transition-colors cursor-pointer
                                                focus-visible:opacity-100 shrink-0
                                            "
                                            aria-label={t('editTopic')}
                                            title={t('editTopic')}
                                        >
                                            <svg aria-hidden="true" className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Status Bar & Host Actions — Monochrome Vercel Status Pill */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-zinc-200 dark:border-zinc-800 py-3.5">
                            <div className="flex items-center gap-3">
                                <div
                                    role="status"
                                    aria-live="polite"
                                    className={`
                                        inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full text-xs sm:text-sm
                                        bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs
                                        ${room.isRevealed || allVoted
                                            ? 'text-zinc-950 dark:text-zinc-50 font-semibold'
                                            : 'text-zinc-600 dark:text-zinc-400 font-medium'}
                                    `}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`w-2 h-2 rounded-full ${
                                            room.isRevealed
                                                ? 'bg-emerald-500'
                                                : allVoted
                                                    ? 'bg-blue-600 dark:bg-blue-400'
                                                    : 'bg-zinc-400 dark:bg-zinc-600'
                                        }`}
                                    />
                                    {room.isRevealed ? (
                                        <span className="text-trim">{t('cardsRevealed')}</span>
                                    ) : (
                                        <span className="tabular-nums text-trim">
                                            {t('votedOf', { voted: votedCount, total: totalPlayers })}
                                            {allVoted && ` • ${t('readyToReveal')}`}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Host Primary Controls */}
                            {isHost && (
                                <div className="flex gap-2.5">
                                    {!room.isRevealed ? (
                                        <button
                                            type="button"
                                            onClick={revealCards}
                                            disabled={votedCount === 0}
                                            className="
                                                inline-flex items-center justify-center gap-2 min-h-10 sm:min-h-11 px-4 sm:px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm
                                                bg-zinc-950 hover:bg-zinc-800 text-white
                                                dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950
                                                disabled:bg-zinc-200 disabled:text-zinc-400
                                                dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600
                                                disabled:cursor-not-allowed
                                                shadow-xs active:scale-[0.98] transition-all cursor-pointer
                                            "
                                        >
                                            <svg aria-hidden="true" className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span className="text-trim">{t('reveal')}</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={resetRound}
                                            className="
                                                inline-flex items-center justify-center gap-2 min-h-10 sm:min-h-11 px-4 sm:px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm
                                                bg-zinc-950 hover:bg-zinc-800 text-white
                                                dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950
                                                shadow-xs active:scale-[0.98] transition-all cursor-pointer
                                            "
                                        >
                                            <svg aria-hidden="true" className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span className="text-trim">{t('newRound')}</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Results panel (when revealed) */}
                        {room.isRevealed && room.results && (
                            <ResultsPanel
                                results={room.results}
                                isHost={isHost}
                                validCards={deckValues}
                                roundingPreference={room.roundingPreference}
                                onAccept={acceptEstimation}
                                onRevote={revote}
                                onStartNewRound={resetRound}
                                onSetRounding={setRounding}
                            />
                        )}

                        {/* History panel (collapsible table) */}
                        {room.history && room.history.length > 0 && (
                            <HistoryPanel history={room.history} />
                        )}

                        {/* Players List Grid */}
                        <PlayerList
                            players={room.players}
                            currentPlayerId={currentPlayer?.id}
                            isRevealed={room.isRevealed}
                            playersWithCards={playersWithCards}
                            onTransferHost={transferHost}
                            canTransferHost={isHost}
                        />

                        {/* Card deck */}
                        {!room.isRevealed && (
                            <div className="surface-panel rounded-3xl p-5 sm:p-7">
                                <CardDeck
                                    selectedCard={currentPlayer?.selectedCard || null}
                                    onSelectCard={selectCard}
                                    values={deckValues}
                                    disabled={room.isRevealed}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            {isLoading ? (
                                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full surface-panel text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm font-medium">
                                    <svg aria-hidden="true" className="animate-spin h-4.5 w-4.5 text-zinc-950 dark:text-zinc-100" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>{t('loadingRoom')}</span>
                                </div>
                            ) : (
                                <div className="text-zinc-500 text-sm sm:text-base">{t('waitingToJoin')}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Join Modal Overlay */}
            {showJoinModal && !room && (
                <JoinModal
                    onJoin={handleJoin}
                    isLoading={isLoading}
                    error={error}
                />
            )}

            {/* Accessible Toast Notification */}
            {toast.visible && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in"
                >
                    <div className="bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 px-4 py-3 rounded-2xl shadow-xl border border-zinc-800 dark:border-zinc-200 flex items-center gap-2.5 text-xs sm:text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-white dark:bg-zinc-950" aria-hidden="true" />
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </main>
    );
}
