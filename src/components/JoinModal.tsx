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

    const formatErrorMessage = (err: string) => {
        switch (err) {
            case 'NAME_TAKEN':
                return t('errors.nameTaken');
            case 'ROOM_FULL':
                return t('errors.roomFull');
            case 'INVALID_NAME':
            case 'NAME_REQUIRED':
                return t('errors.invalidName');
            case 'IDENTITY_MISMATCH':
                return t('errors.identityMismatch');
            default: {
                const closeCode = err.match(/^Connection error \((\d+)\)$/)?.[1];
                if (closeCode === '1011') return t('errors.serverError');
                if (closeCode) return t('errors.connectionError');
                return err;
            }
        }
    };

    const handleRetry = () => {
        if (name.trim()) {
            onJoin(name.trim());
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 dark:bg-black/65 backdrop-blur-md overscroll-contain"
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-modal-title"
            aria-describedby="join-modal-desc"
        >
            <div className="relative w-full max-w-md surface-panel rounded-3xl p-6 sm:p-8 shadow-2xl animate-zoom-in">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mb-4 text-zinc-950 dark:text-zinc-50">
                        <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 id="join-modal-title" className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight mb-1.5">
                        {t('title')}
                    </h2>
                    <p id="join-modal-desc" className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                        {t('description')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="join-name-input" className="block text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
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
                                w-full min-h-11 px-4 py-3 rounded-xl
                                bg-white dark:bg-zinc-900
                                border border-zinc-300 dark:border-zinc-700
                                text-zinc-950 dark:text-zinc-50
                                placeholder-zinc-400 dark:placeholder-zinc-500
                                text-base sm:text-sm shadow-2xs transition-colors duration-150
                            "
                        />
                    </div>

                    {error && (
                        <div
                            role="alert"
                            aria-live="polite"
                            className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2.5"
                        >
                            <svg aria-hidden="true" className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.502-1.667-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="flex-1">{formatErrorMessage(error)}</span>
                            {!isLoading && name.trim() && (
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    className="shrink-0 font-semibold underline underline-offset-2 cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    {t('errors.retry')}
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!name.trim() || isLoading}
                        className="
                            w-full min-h-11 py-3 px-5 rounded-xl font-semibold text-sm
                            bg-zinc-950 hover:bg-zinc-800 text-white
                            dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950
                            disabled:bg-zinc-200 disabled:text-zinc-400
                            dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600
                            disabled:cursor-not-allowed
                            shadow-xs active:scale-[0.99] transition-all cursor-pointer
                            flex items-center justify-center gap-2
                        "
                    >
                        {isLoading ? (
                            <>
                                <svg aria-hidden="true" className="animate-spin h-4.5 w-4.5" fill="none" viewBox="0 0 24 24">
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
