import { memo, useMemo } from 'react';
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

function CardDeckComponent({ selectedCard, onSelectCard, values, disabled = false }: CardDeckProps) {
    const t = useTranslations('cardDeck');

    const normalizedValues = useMemo(
        () => values.map(v => normalizeCardValue(v)),
        [values]
    );

    const normalizedSelected = selectedCard !== null ? normalizeCardValue(selectedCard) : null;

    const handleCardClick = (value: CardValue, normalizedValue: string) => {
        if (disabled) return;

        if (normalizedSelected === normalizedValue) {
            onSelectCard(null);
        } else {
            onSelectCard(value);
        }
    };

    return (
        <div className="w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-300 mb-4 text-center">
                {t('selectEstimate')}
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
                {values.map((value, i) => (
                    <Card
                        key={value}
                        value={value}
                        isSelected={normalizedSelected !== null && normalizedSelected === normalizedValues[i]}
                        onClick={() => handleCardClick(value, normalizedValues[i])}
                        disabled={disabled}
                        size="md"
                    />
                ))}
            </div>
        </div>
    );
}

export const CardDeck = memo(CardDeckComponent);
