'use client';

import { useState, memo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface JoinModalProps {
    onJoin: (name: string) => void;
    isLoading?: boolean;
    error?: string | null;
}

function JoinModalComponent({ onJoin, isLoading = false, error }: JoinModalProps) {
    const [name, setName] = useState('');
    const t = useTranslations('join');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onJoin(name.trim());
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-modal-title"
            aria-describedby="join-modal-desc"
        >
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl animate-zoom-in">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-4 text-zinc-950 dark:text-zinc-50">
                        <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 id="join-modal-title" className="text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight mb-1">
                        {t('title')}
                    </h2>
                    <p id="join-modal-desc" className="text-sm text-zinc-600 dark:text-zinc-400">
                        {t('description')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="join-name-input" className="block text-xs font-mono font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                            {t('yourName')}
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            id="join-name-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('namePlaceholder')}
                            autoComplete="name"
                            disabled={isLoading}
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

                    {error && (
                        <div
                            role="alert"
                            aria-live="polite"
                            className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2"
                        >
                            <span aria-hidden="true">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!name.trim() || isLoading}
                        className="
                            w-full py-2.5 px-4 rounded-lg font-semibold text-sm
                            bg-zinc-950 hover:bg-zinc-800 text-white
                            dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950
                            disabled:bg-zinc-200 disabled:text-zinc-400
                            dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600
                            disabled:cursor-not-allowed
                            shadow-xs transition-colors cursor-pointer
                            flex items-center justify-center gap-2
                        "
                    >
                        {isLoading ? (
                            <>
                                <svg aria-hidden="true" className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>{t('joining')}</span>
                            </>
                        ) : (
                            t('join')
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

export const JoinModal = memo(JoinModalComponent);
