'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const t = useTranslations('theme');

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-10 h-10" aria-hidden="true" />;
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="
                inline-flex items-center justify-center
                min-w-10 min-h-10 p-2 rounded-lg
                bg-white dark:bg-zinc-900
                hover:bg-zinc-100 dark:hover:bg-zinc-800
                text-zinc-700 dark:text-zinc-300
                hover:text-zinc-950 dark:hover:text-zinc-50
                border border-zinc-300 dark:border-zinc-800
                shadow-2xs transition-colors duration-150
                cursor-pointer
            "
            aria-label={t('toggle')}
            title={isDark ? t('switchToLight') : t('switchToDark')}
        >
            {isDark ? (
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
}
