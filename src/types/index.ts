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
export const CARD_VALUES = DECKS.scrum; // Default for backward compatibility/imports


export interface Player {
  id: string;
  name: string;
  selectedCard: CardValue | null;
  isHost: boolean;
}

export interface Results {
  average: number | null;
  median: number | null;
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
  players: Player[];
  isRevealed: boolean;
  results: Results | null;
  history: EstimationHistoryItem[];
}

// Socket event types
export interface ServerToClientEvents {
  'room-state': (room: Room) => void;
  'player-joined': (player: Player) => void;
  'player-left': (playerId: string) => void;
  'card-selected': (playerId: string, hasCard: boolean) => void;
  'cards-revealed': (room: Room) => void;
  'round-reset': () => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'create-room': (playerName: string, callback: (roomId: string) => void) => void;
  'join-room': (roomId: string, playerName: string, callback: (success: boolean, error?: string) => void) => void;
  'rejoin-room': (roomId: string, playerName: string, callback: (success: boolean) => void) => void;
  'update-topic': (roomId: string, topic: string) => void;
  'select-card': (roomId: string, card: CardValue | null) => void;
  'reveal-cards': (roomId: string) => void;
  'reset-round': (roomId: string) => void;
  'revote': (roomId: string) => void;
  'request-room-state': () => void;
  'accept-estimation': (roomId: string, value: CardValue) => void;
}
