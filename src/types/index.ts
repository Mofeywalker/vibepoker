// Card values for Planning Poker (Fibonacci-like sequence)
export const CARD_VALUES = ['?', '0', '1', '2', '3', '5', '8', '13', '21', '∞'] as const;
export type CardValue = typeof CARD_VALUES[number];

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
  suggestion: number | null;
  breakdown: { value: CardValue; count: number }[];
}

export interface Room {
  id: string;
  hostId: string;
  topic: string | null;
  players: Player[];
  isRevealed: boolean;
  results: Results | null;
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
  'request-room-state': () => void;
}
