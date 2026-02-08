import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { CARD_VALUES, type CardValue } from '@/types';
import { Card } from './Card';

interface CardDeckProps {
    selectedCard: CardValue | null;
    onSelectCard: (card: CardValue | null) => void;
    values: readonly string[];
    disabled?: boolean;
}

function CardDeckComponent({ selectedCard, onSelectCard, values, disabled = false }: CardDeckProps) {
    const t = useTranslations('cardDeck');

    const handleCardClick = (value: CardValue) => {
        if (disabled) return;

        // Toggle selection
        if (selectedCard === value) {
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
                {values.map((value) => (
                    <Card
                        key={value}
                        value={value}
                        isSelected={selectedCard === value}
                        onClick={() => handleCardClick(value)}
                        disabled={disabled}
                        size="md"
                    />
                ))}
            </div>
        </div>
    );
}

export const CardDeck = memo(CardDeckComponent);
