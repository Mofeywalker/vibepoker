'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRoom } from '@/hooks/useRoom';
import { Card, ThemeToggle } from '@/components';

export default function HomePage() {
  const router = useRouter();
  const { createRoom } = useRoom();
  const t = useTranslations('home');

  const [joinRoomId, setJoinRoomId] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorName.trim()) return;

    setIsCreating(true);
    try {
      const roomId = await createRoom(creatorName.trim());
      // Save to sessionStorage so the room page knows we're already a member
      sessionStorage.setItem(`vibepoker-joined-${roomId}`, 'true');
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
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Decorative cards */}
      <div className="fixed top-20 left-10 opacity-20 hidden lg:block animate-float">
        <Card value="5" size="lg" />
      </div>
      <div className="fixed top-40 right-16 opacity-20 hidden lg:block animate-float-delayed">
        <Card value="13" size="lg" />
      </div>
      <div className="fixed bottom-20 left-20 opacity-20 hidden lg:block animate-float-delayed">
        <Card value="8" size="lg" />
      </div>
      <div className="fixed bottom-32 right-10 opacity-20 hidden lg:block animate-float">
        <Card value="3" size="lg" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-lg">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 mb-6 shadow-2xl shadow-violet-500/40">
            <span className="text-4xl text-white">🃏</span>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Vibe<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">POKER</span>
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-400">
            {t('tagline')}
          </p>
        </div>



        {/* Action cards */}
        <div className="space-y-4">
          {/* Create Room */}
          <div className="glass-strong rounded-2xl p-6">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="
                  w-full py-4 px-6 rounded-xl font-semibold text-lg
                  bg-gradient-to-r from-violet-600 to-purple-600
                  hover:from-violet-500 hover:to-purple-500
                  disabled:from-slate-400 disabled:to-slate-500 dark:disabled:from-slate-600 dark:disabled:to-slate-700 disabled:cursor-not-allowed
                  text-white shadow-lg shadow-violet-500/30
                  hover:shadow-xl hover:shadow-violet-500/40
                  transition-all duration-300
                  flex items-center justify-center gap-3
                "
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('createRoom')}
              </button>
            ) : (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label htmlFor="creatorName" className="block text-sm font-medium text-slate-800 dark:text-slate-300 mb-2">
                    {t('yourName')}
                  </label>
                  <input
                    type="text"
                    id="creatorName"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder={t('namePlaceholder')}
                    className="
                      w-full px-4 py-3 rounded-xl
                      bg-white/50 dark:bg-slate-800/50 
                      border border-slate-200 dark:border-slate-600
                      text-slate-900 dark:text-white 
                      placeholder-slate-500 dark:placeholder-slate-500
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                      transition-all duration-200
                    "
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!creatorName.trim() || isCreating}
                    className="
                      flex-1 py-3 px-4 rounded-xl font-semibold
                      bg-gradient-to-r from-violet-600 to-purple-600
                      hover:from-violet-500 hover:to-purple-500
                      disabled:from-slate-400 disabled:to-slate-500 dark:disabled:from-slate-600 dark:disabled:to-slate-700 disabled:cursor-not-allowed
                      text-white transition-all duration-200
                      flex items-center justify-center gap-2
                    "
                  >
                    {isCreating ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700" />
            <span className="text-slate-500 text-sm">{t('or')}</span>
            <div className="flex-1 h-px bg-slate-300 dark:bg-slate-700" />
          </div>

          {/* Join Room */}
          <form onSubmit={handleJoinRoom} className="glass-strong rounded-2xl p-6 space-y-4">
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('roomId')}
              </label>
              <input
                type="text"
                id="roomId"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder={t('roomIdPlaceholder')}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-white/50 dark:bg-slate-800/50 
                  border border-slate-200 dark:border-slate-600
                  text-slate-900 dark:text-white 
                  placeholder-slate-400 dark:placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                  transition-all duration-200
                "
              />
            </div>
            <button
              type="submit"
              disabled={!joinRoomId.trim()}
              className="
                w-full py-3 px-6 rounded-xl font-semibold
                bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600
                disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:cursor-not-allowed
                text-slate-900 dark:text-white transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              {t('joinRoom')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 dark:text-slate-600 text-sm mt-12">
          {t('footer')}
        </p>
      </div>
    </main>
  );
}
