'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
    socket: TypedSocket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false
});

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<TypedSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketInstance: TypedSocket = io({
            path: '/socket.io',
            transports: ['websocket', 'polling']
        });

        socketInstance.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
