'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PartyKitClient } from '@/lib/realtime/partykit-client';
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
    updateTopic: (topic: string) => void;
    acceptEstimation: (value: CardValue) => void;
    revote: () => void;
    playersWithCards: Set<string>;
}

export function useRoom(): UseRoomReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef<PartyKitClient | null>(null);
    const currentRoomIdRef = useRef<string | null>(null);

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
            setIsLoading(false);
        };
    }, []);

    const currentPlayer = room?.players.find(
        p => p.id === clientRef.current?.currentPlayerId
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

    const createRoom = useCallback(async (playerName: string): Promise<string> => {
        if (!clientRef.current) throw new Error('Client not initialized');

        // Generate room ID (8 characters like before)
        const roomId = Math.random().toString(36).substring(2, 10);
        currentRoomIdRef.current = roomId;

        setIsLoading(true);
        setError(null);

        try {
            await clientRef.current.connect({ roomId, playerName });
            return roomId;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create room');
            setIsLoading(false);
            throw err;
        }
    }, []);

    const joinRoom = useCallback(async (roomId: string, playerName: string): Promise<boolean> => {
        if (!clientRef.current) return false;

        currentRoomIdRef.current = roomId;
        setIsLoading(true);
        setError(null);

        try {
            await clientRef.current.connect({ roomId, playerName });
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join room');
            setIsLoading(false);
            return false;
        }
    }, []);

    const rejoinRoom = useCallback(async (roomId: string, playerName: string): Promise<boolean> => {
        // PartyKit handles rejoin the same as join
        return joinRoom(roomId, playerName);
    }, [joinRoom]);

    return {
        room,
        currentPlayer,
        isHost: currentPlayer?.isHost || false,
        isLoading,
        error,
        playersWithCards,
        createRoom,
        joinRoom,
        rejoinRoom,
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
            clientRef.current?.revote(), [])
    };
}
