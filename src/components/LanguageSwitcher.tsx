'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

const LOCALES = [
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
    { code: 'ru', flag: '🇷🇺', name: 'Русский' },
    { code: 'uk', flag: '🇺🇦', name: 'Українська' },
    { code: 'ar', flag: '🇸🇦', name: 'العربية' },
    { code: 'zh', flag: '🇨🇳', name: '中文' },
    { code: 'es', flag: '🇪🇸', name: 'Español' },
] as const;

export const LanguageSwitcher = React.memo(function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const [isPending, startTransition] = React.useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;
        document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
        startTransition(() => {
            router.refresh();
        });
    };

    return (
        <div className="inline-flex items-center">
            <select
                value={locale}
                onChange={handleChange}
                disabled={isPending}
                aria-label="Select language"
                className="
                    inline-flex items-center justify-center text-center
                    min-w-10 min-h-10 sm:min-w-11 sm:min-h-11 px-2 rounded-xl
                    bg-white dark:bg-zinc-900
                    hover:bg-zinc-100 dark:hover:bg-zinc-800
                    text-zinc-600 dark:text-zinc-400
                    hover:text-zinc-950 dark:hover:text-zinc-50
                    border border-zinc-200 dark:border-zinc-800
                    shadow-2xs active:scale-95 transition-all duration-150
                    cursor-pointer appearance-none
                "
            >
                {LOCALES.map(({ code, flag }) => (
                    <option key={code} value={code}>
                        {flag}
                    </option>
                ))}
            </select>
        </div>
    );
});

LanguageSwitcher.displayName = 'LanguageSwitcher';
