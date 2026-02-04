import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['de', 'en'],
    defaultLocale: 'de',
    localeDetection: true,
    localePrefix: 'never' // Don't add locale prefix to URLs
});
