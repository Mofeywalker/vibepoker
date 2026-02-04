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
        <div className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-lg">
                        📜
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {t('history')}
                    </h3>
                    <span className="px-2 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                        {history.length}
                    </span>
                </div>
                <svg
                    className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Content - Collapsible */}
            {isOpen && (
                <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-4 py-3">{t('topic')}</th>
                                    <th className="px-4 py-3 text-right">{t('estimate')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white/50 dark:bg-slate-800/20">
                                {history.map((item, index) => (
                                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                                            {item.topic}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 font-bold">
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
        </div>
    );
}

export const HistoryPanel = memo(HistoryPanelComponent);
