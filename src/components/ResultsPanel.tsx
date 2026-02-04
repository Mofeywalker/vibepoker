'use client';

import { useTranslations } from 'next-intl';
import type { Results } from '@/types';

interface ResultsPanelProps {
    results: Results;
}

export function ResultsPanel({ results }: ResultsPanelProps) {
    const t = useTranslations('results');

    return (
        <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                    📊
                </span>
                {t('title')}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Suggestion - highlighted */}
                <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-violet-200/50 to-purple-200/50 dark:from-violet-600/30 dark:to-purple-600/30 border border-violet-500/50 rounded-xl p-4 text-center">
                    <div className="text-4xl font-bold text-violet-900 dark:text-white mb-1">
                        {results.suggestion !== null ? results.suggestion : '—'}
                    </div>
                    <div className="text-sm text-violet-800 dark:text-violet-300 font-medium">
                        {t('suggestion')}
                    </div>
                </div>

                {/* Average */}
                <div className="bg-slate-200 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {results.average !== null ? results.average : '—'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                        {t('average')}
                    </div>
                </div>

                {/* Median */}
                <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {results.median !== null ? results.median : '—'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t('median')}
                    </div>
                </div>

                {/* Mode */}
                <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                        {results.mode || '—'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t('mode')}
                    </div>
                </div>
            </div>

            {/* Breakdown */}
            {results.breakdown.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">{t('distribution')}</h4>
                    <div className="flex flex-wrap gap-2">
                        {results.breakdown.map(({ value, count }) => (
                            <div
                                key={value}
                                className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700/50 rounded-lg px-3 py-2"
                            >
                                <span className="text-lg font-bold text-slate-900 dark:text-white">{value}</span>
                                <span className="text-sm text-slate-600 dark:text-slate-400">×{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
