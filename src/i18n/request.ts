import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { routing } from './routing';

export default getRequestConfig(async () => {
    // Get locale from accept-language header
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language') || '';

    // Parse accept-language header to find the best match
    let locale = routing.defaultLocale;

    for (const lang of acceptLanguage.split(',')) {
        const code = lang.split(';')[0].trim().slice(0, 2).toLowerCase();
        if (routing.locales.includes(code as typeof routing.locales[number])) {
            locale = code;
            break;
        }
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default
    };
});
