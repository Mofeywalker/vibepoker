// Card values for Planning Poker
export const DECKS = {
  fibonacci: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'],
  scrum: ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '☕'],
  sequential: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?', '☕'],
  hourly: ['1', '2', '3', '4', '6', '8', '12', '16', '24', '32', '40', '?', '☕'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕']
} as const;

export type DeckType = keyof typeof DECKS;
export type CardValue = string;

export function isDeckType(value: unknown): value is DeckType {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DECKS, value);
}

export type RoundingPreference = 'up' | 'down';

export interface Player {
  id: string;
  name: string;
  selectedCard: CardValue | null;
  isHost: boolean;
}

export interface Results {
  average: string | number | null;
  median: string | number | null;
  mode: CardValue | null;
  suggestion: string | number | null;
  breakdown: { value: CardValue; count: number }[];
  acceptedValue?: CardValue;
}


export interface EstimationHistoryItem {
  topic: string;
  value: CardValue;
  timestamp: number;
}

export interface Room {
  id: string;
  hostId: string;
  topic: string | null;
  deckType?: DeckType;
  roundingPreference?: RoundingPreference;
  players: Player[];
  isRevealed: boolean;
  results: Results | null;
  history: EstimationHistoryItem[];
  lastActivityAt?: number;
}
