interface LogoProps {
    className?: string;
}

/**
 * Brand mark: two overlapping estimation cards with geometric line art.
 * Inherits color from the surrounding text via `currentColor`.
 */
export function Logo({ className = 'w-5 h-5' }: LogoProps) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect x="3" y="4.8" width="9.4" height="14.4" rx="2" transform="rotate(-9 7.7 12)" />
            <rect x="11.6" y="4.8" width="9.4" height="14.4" rx="2" transform="rotate(9 16.3 12)" />
            <path d="M16.3 9.6l1.7 2.4-1.7 2.4-1.7-2.4z" />
        </svg>
    );
}
