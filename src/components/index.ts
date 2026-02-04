import dynamic from 'next/dynamic';

export { Card } from './Card';
export { CardDeck } from './CardDeck';
export { PlayerList } from './PlayerList';
export { ThemeToggle } from './ThemeToggle';

// Dynamic exports for code splitting and performance
export const JoinModal = dynamic(() => import('./JoinModal').then(mod => mod.JoinModal));
export const ResultsPanel = dynamic(() => import('./ResultsPanel').then(mod => mod.ResultsPanel));
