'use client';

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

export function Card({
    value,
    isSelected = false,
    isRevealed = false,
    isBack = false,
    onClick,
    size = 'md',
    disabled = false
}: CardProps) {
    const sizeClasses = {
        sm: 'w-12 h-16 text-lg',
        md: 'w-16 h-24 text-2xl',
        lg: 'w-20 h-28 text-3xl'
    };

    const baseClasses = `
    relative rounded-xl font-bold 
    transition-all duration-300 ease-out
    ${sizeClasses[size]}
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
  `;

    const frontClasses = `
    ${baseClasses}
    bg-gradient-to-br from-slate-800 to-slate-900
    border-2 ${isSelected ? 'border-violet-500 shadow-lg shadow-violet-500/30' : 'border-slate-700'}
    hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/20
    hover:scale-105 hover:-translate-y-1
    flex items-center justify-center
    text-white
  `;

    const backClasses = `
    ${baseClasses}
    bg-gradient-to-br from-violet-600 to-purple-700
    border-2 border-violet-500
    flex items-center justify-center
    overflow-hidden
  `;

    const revealedClasses = `
    ${baseClasses}
    bg-gradient-to-br from-emerald-600 to-teal-700
    border-2 border-emerald-400
    flex items-center justify-center
    text-white
    shadow-lg shadow-emerald-500/30
  `;

    if (isBack && !isRevealed) {
        return (
            <div className={backClasses}>
                {/* Pattern for card back */}
                <div className="absolute inset-2 rounded-lg border border-violet-400/30 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-violet-400/20 animate-pulse" />
                </div>
            </div>
        );
    }

    if (isRevealed) {
        return (
            <div className={revealedClasses}>
                <span className="drop-shadow-lg">{value}</span>
            </div>
        );
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={frontClasses}
        >
            <span className={`drop-shadow-lg ${isSelected ? 'scale-110' : ''}`}>
                {value}
            </span>
            {isSelected && (
                <div className="absolute inset-0 rounded-xl bg-violet-500/10 animate-pulse" />
            )}
        </button>
    );
}
