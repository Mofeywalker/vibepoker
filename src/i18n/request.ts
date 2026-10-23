import { getRequestConfig } from 'next-intl/server';
import { headers, cookies } from 'next/headers';

const locales = ['de', 'en', 'tr', 'ru', 'uk', 'ar', 'zh', 'es'] as const;

export default getRequestConfig(async () => {
    // Get locale from accept-language header
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language') || '';

    // Parse accept-language header to find the best match
    let locale: typeof locales[number] = 'de';
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;

    if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
        locale = cookieLocale as typeof locales[number];
    } else {
        // Fallback to accept-language header (existing logic)
        for (const lang of acceptLanguage.split(',')) {
            const code = lang.split(';')[0].trim().slice(0, 2).toLowerCase();
            if (locales.includes(code as typeof locales[number])) {
                locale = code as typeof locales[number];
                break;
            }
        }
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default
    };
});
