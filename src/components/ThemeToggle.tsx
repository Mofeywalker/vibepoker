'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';

const THEME_CYCLE = ['light', 'dark', 'colorful'] as const;
type ThemeName = (typeof THEME_CYCLE)[number];

export const ThemeToggle = React.memo(function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    const t = useTranslations('theme');

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-10 h-10 sm:w-11 sm:h-11" aria-hidden="true" />;
    }

    const current = (theme === 'system' ? resolvedTheme : theme) as ThemeName | undefined;
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(current ?? 'light') + 1) % THEME_CYCLE.length];
    const title = next === 'dark'
        ? t('switchToDark')
        : next === 'colorful'
            ? t('switchToColorful')
            : t('switchToLight');

    return (
        <button
            type="button"
            onClick={() => setTheme(next)}
            className="
                inline-flex items-center justify-center
                min-w-10 min-h-10 sm:min-w-11 sm:min-h-11 p-2.5 rounded-xl
                bg-white dark:bg-zinc-900
                hover:bg-zinc-100 dark:hover:bg-zinc-800
                text-zinc-600 dark:text-zinc-400
                hover:text-zinc-950 dark:hover:text-zinc-50
                border border-zinc-200 dark:border-zinc-800
                shadow-2xs active:scale-95 transition-all duration-150
                cursor-pointer
            "
            aria-label={t('toggle')}
            title={title}
        >
            {current === 'dark' ? (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364 6.364l-1.06-1.06M6.697 6.697l-1.06-1.06m12.727 0l-1.06 1.06M6.697 17.303l-1.06 1.06M16.25 12a4.25 4.25 0 11-8.5 0 4.25 4.25 0 018.5 0z" />
                </svg>
            ) : current === 'colorful' ? (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 3a9 9 0 100 18h1.5a2.5 2.5 0 002.5-2.5c0-.69-.28-1.32-.73-1.77A2.5 2.5 0 0117.5 12H19a2 2 0 002-2 7 7 0 00-9-7z" />
                    <circle cx="7.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
                    <circle cx="10" cy="7.5" r="1" fill="currentColor" stroke="none" />
                    <circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" />
                </svg>
            ) : (
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
});

ThemeToggle.displayName = 'ThemeToggle';
