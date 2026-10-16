import { memo, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { type CardValue } from '@/types';
import { normalizeCardValue } from '@/lib/poker-logic';
import { Card } from './Card';

interface CardDeckProps {
    selectedCard: CardValue | null;
    onSelectCard: (card: CardValue | null) => void;
    values: readonly string[];
    disabled?: boolean;
}

interface CardDeckItemProps {
    value: string;
    isSelected: boolean;
    disabled: boolean;
    onSelect: (value: CardValue, normalizedValue: string) => void;
    normalizedValue: string;
}

const CardDeckItem = memo(function CardDeckItem({
    value,
    isSelected,
    disabled,
    onSelect,
    normalizedValue
}: CardDeckItemProps) {
    const handleClick = useCallback(() => {
        onSelect(value, normalizedValue);
    }, [onSelect, value, normalizedValue]);

    return (
        <Card
            value={value}
            isSelected={isSelected}
            onClick={handleClick}
            disabled={disabled}
            size="md"
        />
    );
});

function CardDeckComponent({ selectedCard, onSelectCard, values, disabled = false }: CardDeckProps) {
    const t = useTranslations('cardDeck');

    const normalizedValues = useMemo(
        () => values.map(v => normalizeCardValue(v)),
        [values]
    );

    const normalizedSelected = selectedCard !== null ? normalizeCardValue(selectedCard) : null;

    const handleCardClick = useCallback((value: CardValue, normalizedValue: string) => {
        if (disabled) return;

        if (normalizedSelected === normalizedValue) {
            onSelectCard(null);
        } else {
            onSelectCard(value);
        }
    }, [disabled, normalizedSelected, onSelectCard]);

    return (
        <div className="w-full" role="group" aria-labelledby="card-deck-heading">
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-5">
                <svg aria-hidden="true" className="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h2 id="card-deck-heading" className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 text-center text-trim">
                    {t('selectEstimate')}
                </h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-1">
                {values.map((value, i) => (
                    <CardDeckItem
                        key={value}
                        value={value}
                        normalizedValue={normalizedValues[i]}
                        isSelected={normalizedSelected !== null && normalizedSelected === normalizedValues[i]}
                        onSelect={handleCardClick}
                        disabled={disabled}
                    />
                ))}
            </div>
        </div>
    );
}

export const CardDeck = memo(CardDeckComponent);
