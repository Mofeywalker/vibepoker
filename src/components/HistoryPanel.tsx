'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { EstimationHistoryItem } from '@/types';
import { CoffeeIcon } from './Card';

interface HistoryPanelProps {
    history: EstimationHistoryItem[];
}

function HistoryPanelComponent({ history }: HistoryPanelProps) {
    const t = useTranslations('results');
    const [isOpen, setIsOpen] = useState(false);

    if (history.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="history-heading"
            className="w-full surface-panel rounded-3xl overflow-clip"
        >
            {/* Header / Disclosure Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="history-table-content"
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer text-left"
            >
                <div className="flex items-center gap-3">
                    <svg aria-hidden="true" className="w-4.5 h-4.5 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.85} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 id="history-heading" className="text-sm sm:text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
                        {t('history')}
                    </h2>
                    <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60 rounded-full tabular-nums text-trim">
                        {history.length}
                    </span>
                </div>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400">
                    <svg
                        aria-hidden="true"
                        className={`w-4 h-4 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>

            {/* Content - Collapsible with ARIA and semantic table */}
            {isOpen && (
                <div id="history-table-content" className="px-5 sm:px-6 pb-5 pt-1 border-t border-zinc-200/80 dark:border-zinc-800">
                    <div className="overflow-x-auto overscroll-contain rounded-xl border border-zinc-200/80 dark:border-zinc-800 mt-3" style={{ scrollbarGutter: 'stable' }}>
                        <table className="w-full text-sm text-left">
                            <caption className="visually-hidden">
                                {t('history')}
                            </caption>
                            <thead className="bg-zinc-50/90 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase text-xs font-semibold tracking-wider">
                                <tr>
                                    <th scope="col" className="px-4 py-3">{t('topic')}</th>
                                    <th scope="col" className="px-4 py-3 text-right">{t('estimate')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 bg-white/80 dark:bg-zinc-900/80">
                                {history.map((item) => (
                                    <tr key={item.timestamp} className="hover:bg-zinc-50/90 dark:hover:bg-zinc-800/35 transition-colors">
                                        <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-medium">
                                            {item.topic}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center justify-center min-w-8 h-8 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 font-mono font-bold text-xs sm:text-sm tabular-nums">
                                                {item.value === '☕' ? (
                                                    <>
                                                        <span className="visually-hidden">☕</span>
                                                        <CoffeeIcon className="w-4 h-4" />
                                                    </>
                                                ) : (
                                                    item.value
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}

export const HistoryPanel = memo(HistoryPanelComponent);
