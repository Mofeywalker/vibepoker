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
        sm: 'w-12 h-16 text-base rounded-lg',
        md: 'w-16 h-24 text-2xl rounded-xl',
        lg: 'w-20 h-28 text-3xl rounded-xl'
    };

    const baseClasses = `
        relative font-bold tabular-nums select-none
        transition-all duration-150 ease-out
        ${sizeClasses[size]}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
    `;

    const frontClasses = `
        ${baseClasses}
        ${isSelected
            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-2 border-indigo-600 dark:border-indigo-400 text-indigo-950 dark:text-indigo-100 -translate-y-1.5 shadow-md ring-2 ring-indigo-500/20 dark:ring-indigo-400/20'
            : 'bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs hover:border-zinc-400 dark:hover:border-zinc-500 hover:-translate-y-0.5 hover:shadow-sm'}
        flex items-center justify-center
    `;

    const backClasses = `
        ${baseClasses}
        card-back-pattern
        border border-zinc-700 dark:border-zinc-600
        flex items-center justify-center
        overflow-hidden shadow-2xs
    `;

    const revealedClasses = `
        ${baseClasses}
        bg-white dark:bg-zinc-900
        border-2 border-emerald-600 dark:border-emerald-500
        flex items-center justify-center
        text-zinc-950 dark:text-zinc-50
        shadow-xs
    `;

    if (isBack && !isRevealed) {
        return (
            <div className={backClasses} aria-hidden="true">
                <div className="absolute inset-1.5 rounded-md border border-zinc-600/50 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rotate-45 border border-zinc-400/60 bg-zinc-800" />
                </div>
            </div>
        );
    }

    if (isRevealed) {
        return (
            <div className={revealedClasses}>
                {size !== 'sm' && (
                    <span aria-hidden="true" className="absolute top-1.5 left-2 text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 leading-none">
                        {value}
                    </span>
                )}
                <span className="emoji-text tracking-tight">{value}</span>
                {size !== 'sm' && (
                    <span aria-hidden="true" className="absolute bottom-1.5 right-2 text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 leading-none rotate-180">
                        {value}
                    </span>
                )}
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
                        className="absolute top-1.5 left-2 text-[10px] font-mono font-medium leading-none before:content-[attr(data-corner)] text-zinc-400 dark:text-zinc-500"
                    />
                    <span
                        aria-hidden="true"
                        data-corner={value}
                        className="absolute bottom-1.5 right-2 text-[10px] font-mono font-medium leading-none rotate-180 before:content-[attr(data-corner)] text-zinc-400 dark:text-zinc-500"
                    />
                </>
            )}
            <span className="emoji-text tracking-tight">
                {value}
            </span>
            {isSelected && (
                <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-2 ring-white dark:ring-zinc-950"
                />
            )}
        </button>
    );
}

export const Card = memo(CardComponent);
