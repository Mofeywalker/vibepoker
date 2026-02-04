'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import type { Room, Player, CardValue } from '@/types';

interface UseRoomReturn {
    room: Room | null;
    currentPlayer: Player | null;
    isHost: boolean;
    isLoading: boolean;
    error: string | null;
    createRoom: (playerName: string) => Promise<string>;
    joinRoom: (roomId: string, playerName: string) => Promise<boolean>;
    rejoinRoom: (roomId: string, playerName: string) => Promise<boolean>;
    selectCard: (card: CardValue | null) => void;
    revealCards: () => void;
    resetRound: () => void;
    playersWithCards: Set<string>;
}

export function useRoom(): UseRoomReturn {
    const { socket, isConnected } = useSocket();
    const [room, setRoom] = useState<Room | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playersWithCards, setPlayersWithCards] = useState<Set<string>>(new Set());

    const currentPlayer = room?.players.find(p => p.id === socket?.id) || null;
    const isHost = currentPlayer?.isHost || false;

    useEffect(() => {
        if (!socket) return;

        const handleRoomState = (newRoom: Room) => {
            setRoom(newRoom);
            // Update players with cards
            const withCards = new Set<string>();
            newRoom.players.forEach(p => {
                if (p.selectedCard !== null) {
                    withCards.add(p.id);
                }
            });
            setPlayersWithCards(withCards);
            setIsLoading(false);
        };

        const handleCardSelected = (playerId: string, hasCard: boolean) => {
            setPlayersWithCards(prev => {
                const next = new Set(prev);
                if (hasCard) {
                    next.add(playerId);
                } else {
                    next.delete(playerId);
                }
                return next;
            });
        };

        const handleCardsRevealed = (newRoom: Room) => {
            setRoom(newRoom);
        };

        const handleRoundReset = () => {
            setPlayersWithCards(new Set());
        };

        const handlePlayerLeft = (playerId: string) => {
            setPlayersWithCards(prev => {
                const next = new Set(prev);
                next.delete(playerId);
                return next;
            });
        };

        const handleError = (message: string) => {
            setError(message);
            setIsLoading(false);
        };

        socket.on('room-state', handleRoomState);
        socket.on('card-selected', handleCardSelected);
        socket.on('cards-revealed', handleCardsRevealed);
        socket.on('round-reset', handleRoundReset);
        socket.on('player-left', handlePlayerLeft);
        socket.on('error', handleError);

        // Request current room state in case we already joined
        socket.emit('request-room-state');

        return () => {
            socket.off('room-state', handleRoomState);
            socket.off('card-selected', handleCardSelected);
            socket.off('cards-revealed', handleCardsRevealed);
            socket.off('round-reset', handleRoundReset);
            socket.off('player-left', handlePlayerLeft);
            socket.off('error', handleError);
        };
    }, [socket]);

    const createRoom = useCallback(async (playerName: string): Promise<string> => {
        if (!socket || !isConnected) {
            throw new Error('Socket not connected');
        }

        setIsLoading(true);
        setError(null);

        return new Promise((resolve) => {
            socket.emit('create-room', playerName, (roomId) => {
                // Store player info for reconnection
                localStorage.setItem(`vibepoker-player-${roomId}`, playerName);
                resolve(roomId);
            });
        });
    }, [socket, isConnected]);

    const joinRoom = useCallback(async (roomId: string, playerName: string): Promise<boolean> => {
        if (!socket || !isConnected) {
            throw new Error('Socket not connected');
        }

        setIsLoading(true);
        setError(null);

        return new Promise((resolve) => {
            socket.emit('join-room', roomId, playerName, (success, errorMsg) => {
                if (!success && errorMsg) {
                    setError(errorMsg);
                } else if (success) {
                    // Store player info for reconnection
                    localStorage.setItem(`vibepoker-player-${roomId}`, playerName);
                }
                setIsLoading(false);
                resolve(success);
            });
        });
    }, [socket, isConnected]);

    const rejoinRoom = useCallback(async (roomId: string, playerName: string): Promise<boolean> => {
        if (!socket || !isConnected) {
            throw new Error('Socket not connected');
        }

        setIsLoading(true);
        setError(null);

        return new Promise((resolve) => {
            socket.emit('rejoin-room', roomId, playerName, (success) => {
                setIsLoading(false);
                resolve(success);
            });
        });
    }, [socket, isConnected]);

    const selectCard = useCallback((card: CardValue | null) => {
        if (!socket || !room) return;
        socket.emit('select-card', room.id, card);
    }, [socket, room]);

    const revealCards = useCallback(() => {
        if (!socket || !room || !isHost) return;
        socket.emit('reveal-cards', room.id);
    }, [socket, room, isHost]);

    const resetRound = useCallback(() => {
        if (!socket || !room || !isHost) return;
        socket.emit('reset-round', room.id);
    }, [socket, room, isHost]);

    return {
        room,
        currentPlayer,
        isHost,
        isLoading,
        error,
        createRoom,
        joinRoom,
        rejoinRoom,
        selectCard,
        revealCards,
        resetRound,
        playersWithCards
    };
}
