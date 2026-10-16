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

    // If result is accepted, show clean summary banner with subtle emerald check badge
    if (results.acceptedValue) {
        return (
            <section
                aria-label={t('acceptedResult')}
                className="w-full surface-panel rounded-3xl p-8 sm:p-10 text-center animate-zoom-in"
            >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-4">
                    <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-zinc-950 dark:text-zinc-50 mb-1 tracking-tight">
                    {t('acceptedResult')}
                </h2>

                <div className="text-[clamp(2.75rem,5vw+1.5rem,4rem)] font-extrabold font-mono text-zinc-950 dark:text-zinc-50 my-4 tracking-tight tabular-nums leading-none">
                    {results.acceptedValue}
                </div>

                {isHost && (
                    <button
                        type="button"
                        onClick={onStartNewRound}
                        className="
                            inline-flex items-center justify-center gap-2.5 min-h-11 px-6 py-3 rounded-xl text-sm font-semibold
                            bg-zinc-950 hover:bg-zinc-800 text-white
                            dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950
                            shadow-xs active:scale-[0.98] transition-all cursor-pointer
                        "
                    >
                        <svg aria-hidden="true" className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-trim">{t('startNewRound')}</span>
                    </button>
                )}
            </section>
        );
    }

    const totalVotes = results.breakdown.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <section
            aria-labelledby="results-heading"
            className="w-full @container surface-panel rounded-3xl p-5 sm:p-7"
        >
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" aria-hidden="true" />
                    <h2 id="results-heading" className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                        {t('title')}
                    </h2>
                </div>

                {/* Apple UISegmentedControl style Rounding controls for host */}
                {isHost && onSetRounding && (
                    <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-800/90 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/60" role="group" aria-label={t('rounding')}>
                        <button
                            type="button"
                            onClick={() => onSetRounding('down')}
                            aria-pressed={roundingPreference === 'down'}
                            className={`min-h-8 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                                roundingPreference === 'down'
                                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-2xs font-semibold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
                            }`}
                        >
                            {t('roundDown')}
                        </button>
                        <button
                            type="button"
                            onClick={() => onSetRounding('up')}
                            aria-pressed={roundingPreference === 'up'}
                            className={`min-h-8 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                                roundingPreference === 'up'
                                    ? 'bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 shadow-2xs font-semibold'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200'
                            }`}
                        >
                            {t('roundUp')}
                        </button>
                    </div>
                )}
            </div>

            {/* Bento Grid Metrics using Container Queries */}
            <div className="grid grid-cols-2 @2xl:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
                {/* Suggestion - subtle Apple blue accent card */}
                <div className="col-span-2 @2xl:col-span-1 bg-blue-50/35 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 font-semibold mb-1.5">
                            {t('suggestion')}
                        </div>
                        <div className="text-[clamp(1.75rem,3cqi+1rem,2.25rem)] font-extrabold font-mono tabular-nums text-zinc-950 dark:text-zinc-50 leading-tight">
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
                                className="mt-3.5 w-full min-h-10 py-2 px-3.5 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-2xs active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-1.5"
                            >
                                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-trim">{t('accept')}</span>
                            </button>
                        ) : null;
                    })()}
                </div>

                {/* Average */}
                <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5">
                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-1.5">
                        {t('average')}
                    </div>
                    <div className="text-[clamp(1.75rem,3cqi+1rem,2.25rem)] font-extrabold font-mono tabular-nums text-zinc-950 dark:text-zinc-50 leading-tight">
                        {results.average !== null ? results.average : '—'}
                    </div>
                </div>

                {/* Median */}
                <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5">
                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-1.5">
                        {t('median')}
                    </div>
                    <div className="text-[clamp(1.75rem,3cqi+1rem,2.25rem)] font-extrabold font-mono tabular-nums text-zinc-950 dark:text-zinc-50 leading-tight">
                        {results.median !== null ? results.median : '—'}
                    </div>
                </div>

                {/* Mode */}
                <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5">
                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-1.5">
                        {t('mode')}
                    </div>
                    <div className="text-[clamp(1.75rem,3cqi+1rem,2.25rem)] font-extrabold font-mono tabular-nums text-zinc-950 dark:text-zinc-50 leading-tight">
                        {results.mode || '—'}
                    </div>
                </div>
            </div>

            {/* Distribution with clean monochrome proportion bars */}
            {results.breakdown.length > 0 && (
                <div className="mb-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                        {t('distribution')}
                    </h3>
                    <div className="space-y-2.5">
                        {results.breakdown.map(({ value, count }) => {
                            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                            return (
                                <div key={value} className="flex items-center gap-3.5 text-sm">
                                    <span className="w-9 font-mono font-bold tabular-nums text-zinc-950 dark:text-zinc-50 text-right">
                                        {value}
                                    </span>
                                    <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-clip">
                                        <div
                                            className="h-full bg-zinc-950 dark:bg-zinc-100 rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                            role="progressbar"
                                            aria-valuenow={count}
                                            aria-valuemin={0}
                                            aria-valuemax={totalVotes}
                                            aria-label={`${value}: ${count} votes`}
                                        />
                                    </div>
                                    <span className="text-xs sm:text-sm font-mono font-medium text-zinc-500 dark:text-zinc-400 tabular-nums w-12 text-right">
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
                            inline-flex items-center gap-2 min-h-10 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold
                            text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-zinc-50
                            bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700
                            border border-zinc-200 dark:border-zinc-700
                            active:scale-[0.98] transition-all cursor-pointer
                        "
                    >
                        <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-trim">{t('revote')}</span>
                    </button>
                </div>
            )}
        </section>
    );
}

export const ResultsPanel = memo(ResultsPanelComponent);
