'use client';

import { memo, type CSSProperties } from 'react';
import type { CardValue } from '@/types';

interface CardProps {
    value: CardValue;
    isSelected?: boolean;
    isRevealed?: boolean;
    isBack?: boolean;
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    /** Position in the deck — drives the ordered rainbow hue in the colorful theme. */
    colorIndex?: number;
    colorCount?: number;
}
export const CoffeeIcon = memo(function CoffeeIcon({ className = 'w-7 h-7', showSteam = true }: { className?: string; showSteam?: boolean }) {
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
            {showSteam && (
                <>
                    <path d="M8.5 2.75v2.25" />
                    <path d="M12.5 2.75v2.25" />
                </>
            )}
            <path d="M4.5 7.5h11a1 1 0 0 1 1 1v4.75a5.25 5.25 0 0 1-5.25 5.25h-2.5A5.25 5.25 0 0 1 3.5 13.25V8.5a1 1 0 0 1 1-1Z" />
            <path d="M16.5 9h1.75a2.75 2.75 0 0 1 0 5.5H16.5" />
            <path d="M4 21h12" />
        </svg>
    );
});

function getCenterTextSize(value: string, size: 'sm' | 'md' | 'lg'): string {
    const isQuestion = value === '?';
    const len = value.length;

    if (size === 'sm') {
        if (isQuestion) return 'text-xl';
        if (len >= 3) return 'text-sm tracking-tighter';
        return 'text-lg tracking-tight';
    }

    if (size === 'lg') {
        if (isQuestion) return 'text-4xl';
        if (len >= 3) return 'text-2xl tracking-tighter';
        return 'text-3xl tracking-tight';
    }

    // md (default deck size — responsive across mobile & desktop)
    if (isQuestion) return 'text-3xl sm:text-4xl';
    if (len >= 3) return 'text-lg sm:text-xl tracking-tighter';
    if (len === 2) return 'text-2xl sm:text-[1.75rem] tracking-tight';
    return 'text-2xl sm:text-3xl tracking-tight';
}

function getCoffeeIconSize(size: 'sm' | 'md' | 'lg'): string {
    if (size === 'sm') return 'w-5 h-5';
    if (size === 'lg') return 'w-9 h-9';
    return 'w-7 h-7 sm:w-8 sm:h-8';
}
/** Stable pseudo-random hue per card value — same card always gets the same rainbow color. */
function getCardHue(value: string, colorIndex?: number, colorCount?: number): number {
    if (colorIndex !== undefined && colorCount && colorCount > 1) {
        // Full rainbow from the first (red) to the last card (magenta)
        return Math.round((colorIndex / (colorCount - 1)) * 300);
    }
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return Math.round((hash * 137.508) % 360);
}

function CardComponent({
    value,
    isSelected = false,
    isRevealed = false,
    isBack = false,
    onClick,
    size = 'md',
    disabled = false,
    colorIndex,
    colorCount
}: CardProps) {
    const sizeClasses = {
        sm: 'w-14 h-20 rounded-xl',
        md: 'w-16 h-24 sm:w-20 sm:h-28 rounded-2xl',
        lg: 'w-20 h-28 sm:w-24 sm:h-32 rounded-2xl'
    };

    const isCoffee = value === '☕';
    const centerTextClasses = getCenterTextSize(value, size);
    const coffeeSizeClasses = getCoffeeIconSize(size);

    const baseClasses = `
        relative font-bold tabular-nums select-none shrink-0 inline-flex items-center justify-center
        ${sizeClasses[size]}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-[0.97]'}
    `;

    // Subtle Apple Configurator-style selection: crisp blue border + ultra-light tint, never kitschy
    const frontClasses = `
        ${baseClasses}
        card-surface
        ${isSelected
            ? 'card-surface-selected bg-blue-50/45 dark:bg-blue-950/25 border-2 border-blue-600 dark:border-blue-400 text-zinc-950 dark:text-zinc-50 -translate-y-2 scale-[1.02] ring-3 ring-blue-500/12 dark:ring-blue-400/15'
            : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 hover:-translate-y-1 hover:shadow-md'}
    `;

    const backClasses = `
        ${baseClasses}
        card-back-pattern
        border border-zinc-800 dark:border-zinc-700
        overflow-clip shadow-xs
    `;

    const revealedClasses = `
        ${baseClasses}
        card-surface
        bg-white dark:bg-zinc-900
        border border-zinc-300 dark:border-zinc-700
        text-zinc-950 dark:text-zinc-50
    `;

    const renderCornerIndices = (colorClass: string) => {
        if (size === 'sm') return null;

        if (isCoffee) {
            return (
                <>
                    <span aria-hidden="true" className={`absolute top-2 left-2.5 ${colorClass}`}>
                        <CoffeeIcon className="w-3 h-3" showSteam={false} />
                    </span>
                    <span aria-hidden="true" className={`absolute bottom-2 right-2.5 rotate-180 ${colorClass}`}>
                        <CoffeeIcon className="w-3 h-3" showSteam={false} />
                    </span>
                </>
            );
        }

        return (
            <>
                <span
                    aria-hidden="true"
                    data-corner={value}
                    className={`absolute top-2 left-2.5 text-[0.6875rem] font-mono font-semibold leading-none before:content-[attr(data-corner)] ${colorClass}`}
                />
                <span
                    aria-hidden="true"
                    data-corner={value}
                    className={`absolute bottom-2 right-2.5 text-[0.6875rem] font-mono font-semibold leading-none rotate-180 before:content-[attr(data-corner)] ${colorClass}`}
                />
            </>
        );
    };

    const renderCenterSymbol = () => {
        if (isCoffee) {
            return (
                <span className="inline-flex items-center justify-center">
                    <span className="visually-hidden">{value}</span>
                    <CoffeeIcon className={coffeeSizeClasses} />
                </span>
            );
        }
        return <span className={centerTextClasses}>{value}</span>;
    };

    if (isBack && !isRevealed) {
        return (
            <div className={backClasses} aria-hidden="true">
                <div className="absolute inset-1.5 rounded-lg border border-zinc-700/70 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center shadow-2xs">
                        <svg aria-hidden="true" className="w-3.5 h-3.5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
            </div>
        );
    }

    if (isRevealed) {
        return (
            <div className={revealedClasses} style={{ '--card-hue': getCardHue(value, colorIndex, colorCount) } as CSSProperties}>
                {renderCornerIndices('text-zinc-400 dark:text-zinc-500')}
                {renderCenterSymbol()}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-pressed={isSelected}
            className={frontClasses}
            style={{ '--card-hue': getCardHue(value, colorIndex, colorCount) } as CSSProperties}
        >
            {renderCornerIndices(isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500')}
            {renderCenterSymbol()}
            {isSelected && (
                <span
                    aria-hidden="true"
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-zinc-950 shadow-xs"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </span>
            )}
        </button>
    );
}

export const Card = memo(CardComponent);
