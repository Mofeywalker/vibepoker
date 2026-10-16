'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { EstimationHistoryItem } from '@/types';

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
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden"
        >
            {/* Header / Disclosure Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="history-table-content"
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer text-left"
            >
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600" aria-hidden="true" />
                    <h2 id="history-heading" className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                        {t('history')}
                    </h2>
                    <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 rounded-full tabular-nums">
                        {history.length}
                    </span>
                </div>
                <svg
                    aria-hidden="true"
                    className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Content - Collapsible with ARIA and semantic table */}
            {isOpen && (
                <div id="history-table-content" className="px-5 pb-5 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 mt-2">
                        <table className="w-full text-sm text-left">
                            <caption className="visually-hidden">
                                {t('history')}
                            </caption>
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-mono font-semibold tracking-wider">
                                <tr>
                                    <th scope="col" className="px-4 py-2.5">{t('topic')}</th>
                                    <th scope="col" className="px-4 py-2.5 text-right">{t('estimate')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                {history.map((item, index) => (
                                    <tr key={index} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100 font-medium">
                                            {item.topic}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                            <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 font-mono font-bold text-xs tabular-nums">
                                                {item.value}
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
