'use client';

import { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex items-center justify-center min-h-dvh p-4">
                    <div className="text-center p-8 surface-panel rounded-3xl border border-red-200 dark:border-red-900/60 max-w-md">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/12 text-red-600 dark:text-red-400 mb-4 border border-red-500/20">
                            <svg aria-hidden="true" className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 mb-2 tracking-tight">
                            Something went wrong
                        </h2>
                        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mb-6">
                            An unexpected error occurred. Please try reloading the page.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="min-h-11 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 active:scale-[0.98] transition-all font-semibold text-sm cursor-pointer shadow-xs"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
