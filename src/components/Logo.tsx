import { memo } from 'react';

interface LogoProps {
    className?: string;
}

/**
 * Brand mark: two overlapping estimation cards with clean monochrome geometric line art.
 * Inherits color from the surrounding text via `currentColor`.
 */
export const Logo = memo(function Logo({ className = 'w-6 h-6' }: LogoProps) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect
                x="2.75"
                y="4.5"
                width="10.5"
                height="15"
                rx="2.25"
                transform="rotate(-8 8 12)"
                className="opacity-45"
            />
            <rect
                x="10.25"
                y="4"
                width="11"
                height="15.5"
                rx="2.25"
                transform="rotate(6 15.75 11.75)"
                className="fill-white dark:fill-zinc-900"
            />
            <path
                d="M15.75 9.25l1.85 2.5-1.85 2.5-1.85-2.5z"
                strokeWidth={1.6}
            />
        </svg>
    );
});

Logo.displayName = 'Logo';
