'use client';

import { useState, memo } from 'react';
import { useTranslations } from 'next-intl';

interface JoinModalProps {
    onJoin: (name: string) => void;
    isLoading?: boolean;
    error?: string | null;
}

function JoinModalComponent({ onJoin, isLoading = false, error }: JoinModalProps) {
    const [name, setName] = useState('');
    const t = useTranslations('join');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onJoin(name.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 mb-4 shadow-lg shadow-violet-500/30">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {t('title')}
                    </h2>
                    <p className="text-slate-400">
                        {t('description')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                            {t('yourName')}
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('namePlaceholder')}
                            className="
                w-full px-4 py-3 rounded-xl
                bg-slate-800/50 border border-slate-600
                text-white placeholder-slate-500
                focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                transition-all duration-200
              "
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!name.trim() || isLoading}
                        className="
              w-full py-3 px-6 rounded-xl font-semibold
              bg-gradient-to-r from-violet-600 to-purple-600
              hover:from-violet-500 hover:to-purple-500
              disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed
              text-white shadow-lg shadow-violet-500/30
              hover:shadow-xl hover:shadow-violet-500/40
              transition-all duration-200
              flex items-center justify-center gap-2
            "
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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
