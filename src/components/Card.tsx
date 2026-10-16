'use client';

import { memo } from 'react';
import type { CardValue } from '@/types';

interface CardProps {
    value: CardValue;
    isSelected?: boolean;
    isRevealed?: boolean;
    isBack?: boolean;
    onClick?: () => void;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
}

function getCenterTextSize(value: string, size: 'sm' | 'md' | 'lg'): string {
    const isSymbol = value === '☕' || value === '?';
    const len = value.length;

    if (size === 'sm') {
        if (isSymbol) return 'text-xl';
        if (len >= 3) return 'text-sm tracking-tighter';
        return 'text-lg tracking-tight';
    }

    if (size === 'lg') {
        if (isSymbol) return 'text-4xl';
        if (len >= 3) return 'text-2xl tracking-tighter';
        return 'text-3xl tracking-tight';
    }

    // md (default deck size — responsive across mobile & desktop)
    if (isSymbol) return 'text-3xl sm:text-4xl';
    if (len >= 3) return 'text-lg sm:text-xl tracking-tighter';
    if (len === 2) return 'text-2xl sm:text-[1.75rem] tracking-tight';
    return 'text-2xl sm:text-3xl tracking-tight';
}

function CardComponent({
    value,
    isSelected = false,
    isRevealed = false,
    isBack = false,
    onClick,
    size = 'md',
    disabled = false
}: CardProps) {
    const sizeClasses = {
        sm: 'w-14 h-20 rounded-xl',
        md: 'w-16 h-24 sm:w-20 sm:h-28 rounded-2xl',
        lg: 'w-20 h-28 sm:w-24 sm:h-32 rounded-2xl'
    };

    const centerTextClasses = getCenterTextSize(value, size);

    const baseClasses = `
        relative font-bold tabular-nums select-none
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
        flex items-center justify-center
    `;

    const backClasses = `
        ${baseClasses}
        card-back-pattern
        border border-zinc-800 dark:border-zinc-700
        flex items-center justify-center
        overflow-clip shadow-xs
    `;

    const revealedClasses = `
        ${baseClasses}
        card-surface
        bg-white dark:bg-zinc-900
        border border-zinc-300 dark:border-zinc-700
        flex items-center justify-center
        text-zinc-950 dark:text-zinc-50
    `;

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
            <div className={revealedClasses}>
                {size !== 'sm' && (
                    <>
                        <span
                            aria-hidden="true"
                            data-corner={value}
                            className="absolute top-2 left-2.5 text-[0.6875rem] font-mono font-semibold leading-none before:content-[attr(data-corner)] text-zinc-400 dark:text-zinc-500"
                        />
                        <span
                            aria-hidden="true"
                            data-corner={value}
                            className="absolute bottom-2 right-2.5 text-[0.6875rem] font-mono font-semibold leading-none rotate-180 before:content-[attr(data-corner)] text-zinc-400 dark:text-zinc-500"
                        />
                    </>
                )}
                <span className={`emoji-text ${centerTextClasses}`}>{value}</span>
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
        >
            {size !== 'sm' && (
                <>
                    <span
                        aria-hidden="true"
                        data-corner={value}
                        className={`absolute top-2 left-2.5 text-[0.6875rem] font-mono font-semibold leading-none before:content-[attr(data-corner)] ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                    />
                    <span
                        aria-hidden="true"
                        data-corner={value}
                        className={`absolute bottom-2 right-2.5 text-[0.6875rem] font-mono font-semibold leading-none rotate-180 before:content-[attr(data-corner)] ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                    />
                </>
            )}
            <span className={`emoji-text ${centerTextClasses}`}>
                {value}
            </span>
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
