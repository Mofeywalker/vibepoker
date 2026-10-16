'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRoom } from '@/hooks/useRoom';
import { ThemeToggle } from '@/components';
import type { DeckType } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { createRoom } = useRoom();
  const t = useTranslations('home');

  const [joinRoomId, setJoinRoomId] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<DeckType>('scrum');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorName.trim()) return;

    setIsCreating(true);
    try {
      const roomId = await createRoom(creatorName.trim(), selectedDeck);
      localStorage.setItem(`vibepoker-player-${roomId}`, creatorName.trim());
      localStorage.setItem(`vibepoker-deck-${roomId}`, selectedDeck);
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    router.push(`/room/${joinRoomId.trim()}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Header Bar with Theme Toggle */}
      <header className="absolute top-6 right-6 z-40">
        <ThemeToggle />
      </header>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-xl">
        {/* Brand Mark & Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs mb-5 text-zinc-950 dark:text-zinc-50">
            {/* Geometric Playing Cards SVG Logo */}
            <svg aria-hidden="true" className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="5" width="12" height="16" rx="2" strokeWidth="1.75" />
              <rect x="9" y="3" width="12" height="16" rx="2" strokeWidth="1.75" className="text-indigo-600 dark:text-indigo-400" />
              <path d="M15 9l-1 2h2l-1 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight mb-2">
            Vibe<span className="text-indigo-600 dark:text-indigo-400">POKER</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            {t('tagline')}
          </p>
        </div>

        {/* Action Panel */}
        <div className="surface-panel rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Create Room Section */}
          <section aria-labelledby="create-room-heading">
            <h2 id="create-room-heading" className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              {t('createRoom')}
            </h2>

            {!showCreateForm ? (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="
                  w-full py-3.5 px-5 rounded-xl font-semibold text-sm
                  bg-zinc-950 hover:bg-zinc-800 text-white
                  dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950
                  shadow-xs transition-colors duration-150
                  flex items-center justify-center gap-2.5 cursor-pointer
                "
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>{t('createRoom')}</span>
              </button>
            ) : (
              <form onSubmit={handleCreateRoom} className="space-y-4 animate-zoom-in">
                <div>
                  <label htmlFor="creatorName" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {t('yourName')}
                  </label>
                  <input
                    type="text"
                    id="creatorName"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    autoComplete="name"
                    required
                    autoFocus
                    className="
                      w-full px-3.5 py-2.5 rounded-lg
                      bg-zinc-50 dark:bg-zinc-800/60
                      border border-zinc-300 dark:border-zinc-700
                      text-zinc-950 dark:text-zinc-50
                      placeholder-zinc-400 dark:placeholder-zinc-500
                      text-sm transition-colors duration-150
                    "
                  />
                </div>

                <div>
                  <label htmlFor="deckType" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    {t('selectDeck')}
                  </label>
                  <div className="relative">
                    <select
                      id="deckType"
                      value={selectedDeck}
                      onChange={(e) => setSelectedDeck(e.target.value as DeckType)}
                      className="
                        w-full px-3.5 py-2.5 rounded-lg
                        bg-zinc-50 dark:bg-zinc-800/60
                        border border-zinc-300 dark:border-zinc-700
                        text-zinc-950 dark:text-zinc-50
                        text-sm transition-colors duration-150
                        appearance-none cursor-pointer pr-10
                      "
                    >
                      <option value="scrum">Scrum (0, ½, 1, 2, 3...)</option>
                      <option value="fibonacci">Fibonacci (0, 1, 2, 3, 5...)</option>
                      <option value="sequential">Sequential (0-10)</option>
                      <option value="hourly">Hourly (1h, 2h, 4h...)</option>
                      <option value="tshirt">T-Shirt (XS, S, M...)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                      <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="
                      flex-1 py-2.5 px-4 rounded-lg font-medium text-sm
                      text-zinc-700 dark:text-zinc-300
                      bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
                      border border-zinc-200 dark:border-zinc-700/60
                      transition-colors cursor-pointer
                    "
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!creatorName.trim() || isCreating}
                    className="
                      flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm
                      bg-zinc-950 hover:bg-zinc-800 text-white
                      dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950
                      disabled:bg-zinc-200 disabled:text-zinc-400
                      dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600
                      disabled:cursor-not-allowed
                      shadow-xs transition-colors cursor-pointer
                      flex items-center justify-center gap-2
                    "
                  >
                    {isCreating ? (
                      <>
                        <svg aria-hidden="true" className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{t('creating')}</span>
                      </>
                    ) : (
                      t('create')
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-zinc-400 dark:text-zinc-600 text-xs uppercase font-mono">{t('or')}</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Join Room Section */}
          <section aria-labelledby="join-room-heading">
            <h2 id="join-room-heading" className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              {t('joinRoom')}
            </h2>
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <div>
                <label htmlFor="roomId" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t('roomId')}
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder={t('roomIdPlaceholder')}
                  autoComplete="off"
                  spellCheck="false"
                  className="
                    w-full px-3.5 py-2.5 rounded-lg font-mono
                    bg-zinc-50 dark:bg-zinc-800/60
                    border border-zinc-300 dark:border-zinc-700
                    text-zinc-950 dark:text-zinc-50
                    placeholder-zinc-400 dark:placeholder-zinc-500
                    text-sm transition-colors duration-150
                  "
                />
              </div>
              <button
                type="submit"
                disabled={!joinRoomId.trim()}
                className="
                  w-full py-2.5 px-4 rounded-lg font-semibold text-sm
                  bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700
                  text-zinc-950 dark:text-zinc-50
                  border border-zinc-200 dark:border-zinc-700/60
                  disabled:bg-zinc-50 disabled:text-zinc-400 disabled:border-zinc-200
                  dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 dark:disabled:border-zinc-800
                  disabled:cursor-not-allowed
                  transition-colors duration-150
                  flex items-center justify-center gap-2 cursor-pointer
                "
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>{t('joinRoom')}</span>
              </button>
            </form>
          </section>
        </div>

        {/* Footer with High Contrast Status Pill */}
        <footer className="mt-8 text-center">
          <p className="inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>{t('footer')}</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
