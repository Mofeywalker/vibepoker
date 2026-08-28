'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PartyKitClient } from '@/lib/realtime/partykit-client';
import type { Room, Player, CardValue, DeckType, RoundingPreference } from '@/types';

interface UseRoomReturn {
    room: Room | null;
    currentPlayer: Player | null;
    isHost: boolean;
    isLoading: boolean;
    error: string | null;
    createRoom: (playerName: string, deckType?: DeckType) => Promise<string>;
    joinRoom: (roomId: string, playerName: string, deckType?: DeckType) => Promise<boolean>;
    selectCard: (card: CardValue | null) => void;
    revealCards: () => void;
    resetRound: () => void;
    updateTopic: (topic: string) => void;
    acceptEstimation: (value: CardValue) => void;
    revote: () => void;
    setRounding: (rounding: RoundingPreference) => void;
    transferHost: (playerId: string) => void;
    playersWithCards: Set<string>;
}

export function useRoom(): UseRoomReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef<PartyKitClient | null>(null);

    useEffect(() => {
        clientRef.current = new PartyKitClient();

        clientRef.current.onRoomUpdate((newRoom) => {
            setRoom(newRoom);
            setIsLoading(false);
        });

        clientRef.current.onError((errorMsg) => {
            setError(errorMsg);
            setIsLoading(false);
        });

        return () => {
            clientRef.current?.disconnect();
        };
    }, []);

    const currentPlayer = room?.players.find(
        p => p.id === currentPlayerId
    ) || null;

    const playersWithCards = useMemo(() => {
        const withCards = new Set<string>();
        room?.players.forEach(p => {
            if (p.selectedCard !== null) {
                withCards.add(p.id);
            }
        });
        return withCards;
    }, [room?.players]);

    const createRoom = useCallback(async (playerName: string, deckType: DeckType = 'scrum'): Promise<string> => {
        if (!clientRef.current) throw new Error('Client not initialized');

        // Generate a cryptographically secure room ID (~82 bits of entropy)
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const roomId = Array.from(bytes, b => alphabet[b % 36]).join('');

        setIsLoading(true);
        setError(null);
        setCurrentPlayerId(null);

        try {
            setCurrentPlayerId(await clientRef.current.connect({ roomId, playerName, deckType }));
            return roomId;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create room');
            setIsLoading(false);
            throw err;
        }
    }, []);

    const joinRoom = useCallback(async (roomId: string, playerName: string, deckType?: DeckType): Promise<boolean> => {
        if (!clientRef.current) return false;

        setIsLoading(true);
        setError(null);
        setCurrentPlayerId(null);

        try {
            setCurrentPlayerId(await clientRef.current.connect({ roomId, playerName, deckType }));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join room');
            setIsLoading(false);
            return false;
        }
    }, []);

    return {
        room,
        currentPlayer,
        isHost: currentPlayer?.isHost || false,
        isLoading,
        error,
        playersWithCards,
        createRoom,
        joinRoom,
        selectCard: useCallback((card: CardValue | null) =>
            clientRef.current?.selectCard(card), []),
        updateTopic: useCallback((topic: string) =>
            clientRef.current?.updateTopic(topic), []),
        revealCards: useCallback(() =>
            clientRef.current?.revealCards(), []),
        acceptEstimation: useCallback((value: CardValue) =>
            clientRef.current?.acceptEstimation(value), []),
        resetRound: useCallback(() =>
            clientRef.current?.resetRound(), []),
        revote: useCallback(() =>
            clientRef.current?.revote(), []),
        setRounding: useCallback((rounding: RoundingPreference) =>
            clientRef.current?.setRounding(rounding), []),
        transferHost: useCallback((playerId: string) =>
            clientRef.current?.transferHost(playerId), [])
    };
}
