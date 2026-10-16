'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { type Results, type CardValue, type RoundingPreference } from '@/types';

interface ResultsPanelProps {
    results: Results;
    isHost: boolean;
    validCards: readonly string[];
    roundingPreference?: RoundingPreference;
    onAccept: (value: CardValue) => void;
    onRevote: () => void;
    onStartNewRound: () => void;
    onSetRounding?: (rounding: RoundingPreference) => void;
}

function ResultsPanelComponent({
    results,
    isHost,
    validCards,
    roundingPreference = 'down',
    onAccept,
    onRevote,
    onStartNewRound,
    onSetRounding
}: ResultsPanelProps) {
    const t = useTranslations('results');

    // If result is accepted, show clean summary banner
    if (results.acceptedValue) {
        return (
            <section
                aria-label={t('acceptedResult')}
                className="w-full bg-white dark:bg-zinc-900 border border-emerald-500/30 dark:border-emerald-500/30 rounded-2xl p-8 shadow-sm text-center animate-zoom-in"
            >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-500/20">
                    <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 mb-1">
                    {t('acceptedResult')}
                </h2>

                <div className="text-5xl font-extrabold font-mono text-zinc-950 dark:text-zinc-50 my-4 tracking-tight tabular-nums">
                    {results.acceptedValue}
                </div>

                {isHost && (
                    <button
                        type="button"
                        onClick={onStartNewRound}
                        className="
                            inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
                            bg-zinc-950 hover:bg-zinc-800 text-white
                            dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950
                            shadow-xs transition-colors cursor-pointer
                        "
                    >
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{t('startNewRound')}</span>
                    </button>
                )}
            </section>
        );
    }

    const totalVotes = results.breakdown.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <section
            aria-labelledby="results-heading"
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs"
        >
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" aria-hidden="true" />
                    <h2 id="results-heading" className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                        {t('title')}
                    </h2>
                </div>

                {/* Rounding controls for host */}
                {isHost && onSetRounding && (
                    <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60" role="group" aria-label={t('rounding')}>
                        <button
                            type="button"
                            onClick={() => onSetRounding('down')}
                            aria-pressed={roundingPreference === 'down'}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                roundingPreference === 'down'
                                    ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-100 shadow-2xs font-semibold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
                            }`}
                        >
                            {t('roundDown')}
                        </button>
                        <button
                            type="button"
                            onClick={() => onSetRounding('up')}
                            aria-pressed={roundingPreference === 'up'}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                                roundingPreference === 'up'
                                    ? 'bg-white dark:bg-zinc-700 text-zinc-950 dark:text-zinc-100 shadow-2xs font-semibold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
                            }`}
                        >
                            {t('roundUp')}
                        </button>
                    </div>
                )}
            </div>

            {/* Bento Grid Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {/* Suggestion - highlighted card */}
                <div className="col-span-2 md:col-span-1 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-900/80 dark:text-indigo-300 font-semibold mb-1">
                            {t('suggestion')}
                        </div>
                        <div className="text-3xl font-extrabold font-mono tabular-nums text-indigo-950 dark:text-indigo-100">
                            {results.suggestion !== null ? results.suggestion : '—'}
                        </div>
                    </div>
                    {isHost && results.suggestion !== null && (() => {
                        const suggestionStr = results.suggestion.toString();
                        const isValidCard = validCards.includes(suggestionStr);
                        return isValidCard ? (
                            <button
                                type="button"
                                onClick={() => onAccept(suggestionStr as CardValue)}
                                className="mt-3 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer text-center"
                            >
                                {t('accept')}
                            </button>
                        ) : null;
                    })()}
                </div>

                {/* Average */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                        {t('average')}
                    </div>
                    <div className="text-3xl font-extrabold font-mono tabular-nums text-zinc-950 dark:text-zinc-50">
                        {results.average !== null ? results.average : '—'}
                    </div>
                </div>

                {/* Median */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                        {t('median')}
                    </div>
                    <div className="text-3xl font-extrabold font-mono tabular-nums text-zinc-950 dark:text-zinc-50">
                        {results.median !== null ? results.median : '—'}
                    </div>
                </div>

                {/* Mode */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                        {t('mode')}
                    </div>
                    <div className="text-3xl font-extrabold font-mono tabular-nums text-zinc-950 dark:text-zinc-50">
                        {results.mode || '—'}
                    </div>
                </div>
            </div>

            {/* Distribution with clean proportion bars */}
            {results.breakdown.length > 0 && (
                <div className="mb-5">
                    <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                        {t('distribution')}
                    </h3>
                    <div className="space-y-2">
                        {results.breakdown.map(({ value, count }) => {
                            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                            return (
                                <div key={value} className="flex items-center gap-3 text-sm">
                                    <span className="w-8 font-mono font-bold tabular-nums text-zinc-950 dark:text-zinc-50 text-right">
                                        {value}
                                    </span>
                                    <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                            role="progressbar"
                                            aria-valuenow={count}
                                            aria-valuemin={0}
                                            aria-valuemax={totalVotes}
                                            aria-label={`${value}: ${count} votes`}
                                        />
                                    </div>
                                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums w-12 text-right">
                                        ×{count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Actions for Host */}
            {isHost && (
                <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                        type="button"
                        onClick={onRevote}
                        className="
                            inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                            text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50
                            bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700
                            border border-zinc-200 dark:border-zinc-700/60
                            transition-colors cursor-pointer
                        "
                    >
                        <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{t('revote')}</span>
                    </button>
                </div>
            )}
        </section>
    );
}

export const ResultsPanel = memo(ResultsPanelComponent);
