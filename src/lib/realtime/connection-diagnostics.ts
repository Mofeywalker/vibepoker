export interface ConnectionReport {
    timestamp: string;
    roomId?: string;
    host: string;
    url?: string;
    closeCode: number | null;
    closeCodeName: string;
    reason: string | null;
    isOnline: boolean;
    httpStatus: string | null;
    diagnosticMessage: string;
    suggestion: string;
}

const CLOSE_CODE_NAMES: Record<number, string> = {
    1000: 'Normal Closure',
    1001: 'Going Away',
    1002: 'Protocol Error',
    1003: 'Unsupported Data',
    1005: 'No Status Received',
    1006: 'Abnormal Closure',
    1007: 'Invalid Frame Payload Data',
    1008: 'Policy Violation',
    1009: 'Message Too Big',
    1010: 'Mandatory Extension Missing',
    1011: 'Internal Server Error',
    1012: 'Service Restart',
    1013: 'Try Again Later',
    1014: 'Bad Gateway',
    1015: 'TLS Handshake Failure',
};

export function getCloseCodeName(code: number | null | undefined): string {
    if (code == null) return 'No Code';
    return CLOSE_CODE_NAMES[code] || `Close Code ${code}`;
}

export function getDiagnosticExplanation(
    code: number | null | undefined,
    reason?: unknown,
    isOnline: boolean = true,
    host?: string
): { diagnosticMessage: string; suggestion: string } {
    const cleanReason = typeof reason === 'string' && reason.trim() && !reason.startsWith('[object ') ? reason.trim() : null;
    if (!isOnline) {
        return {
            diagnosticMessage: 'Browser is offline. No internet connection detected.',
            suggestion: 'Please check your Wi-Fi or mobile network connection and try again.',
        };
    }

    const isLocal = Boolean(host && (host.includes('localhost') || host.includes('127.0.0.1')));

    switch (code) {
        case 1006:
            return {
                diagnosticMessage:
                    'WebSocket closed abnormally without receiving a close frame. The server could not be reached, connection was refused, or the network connection dropped.',
                suggestion: isLocal
                    ? `Ensure the local PartyKit server is running on ${host || 'localhost:1999'} ('npm run partykit' or 'npx partyserver').`
                    : `Check your internet connection, firewall/VPN settings, or verify that the server at ${host || 'remote host'} is online.`,
            };
        case 1011:
            return {
                diagnosticMessage: `Server encountered an internal error while handling the connection${cleanReason ? `: ${cleanReason}` : ''}.`,
                suggestion: 'Check the PartyKit server logs for unhandled exceptions or runtime errors.',
            };
        case 1008:
            return {
                diagnosticMessage: `Connection rejected due to policy violation${cleanReason ? `: ${cleanReason}` : ''}.`,
                suggestion: cleanReason === 'IDENTITY_MISMATCH'
                    ? 'Session conflict detected. Try re-entering your name to start a new session.'
                    : 'The request parameters or origin were rejected by the server.',
            };
        case 1001:
            return {
                diagnosticMessage: 'Server or client is going away (server restart or page navigation).',
                suggestion: 'Wait a moment and try reconnecting.',
            };
        case 1002:
            return {
                diagnosticMessage: 'WebSocket protocol error occurred during communication.',
                suggestion: 'Check client and server compatibility.',
            };
        case 1012:
            return {
                diagnosticMessage: 'PartyKit server is currently restarting.',
                suggestion: 'Wait a few seconds for the service to finish restarting, then retry.',
            };
        case 1013:
            return {
                diagnosticMessage: 'PartyKit server is temporarily unavailable or overloaded.',
                suggestion: 'Please try again in a few moments.',
            };
        case 1015:
            return {
                diagnosticMessage: 'TLS handshake failed while establishing secure WebSocket connection.',
                suggestion: 'Check your SSL/TLS certificate configuration or proxy settings.',
            };
        default:
            return {
                diagnosticMessage: `Connection terminated unexpectedly${code ? ` (code ${code}: ${getCloseCodeName(code)})` : ''}${cleanReason ? ` - ${cleanReason}` : ''}.`,
                suggestion: 'Please try reconnecting. If the issue persists, verify server status.',
            };
    }
}

export function createConnectionReport(params: {
    roomId?: string;
    host?: string;
    url?: string;
    closeCode?: number | null;
    reason?: unknown;
    isOnline?: boolean;
    httpStatus?: string | null;
}): ConnectionReport {
    const host = params.host || process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';
    const isOnline = params.isOnline ?? (typeof navigator !== 'undefined' ? navigator.onLine : true);
    const closeCode = typeof params.closeCode === 'number' ? params.closeCode : null;
    const reason = typeof params.reason === 'string' && params.reason.trim() && !params.reason.startsWith('[object ')
        ? params.reason.trim()
        : null;
    const { diagnosticMessage, suggestion } = getDiagnosticExplanation(closeCode, reason, isOnline, host);
    return {
        timestamp: new Date().toISOString(),
        roomId: params.roomId,
        host,
        url: params.url,
        closeCode,
        closeCodeName: getCloseCodeName(closeCode),
        reason,
        isOnline,
        httpStatus: params.httpStatus ?? null,
        diagnosticMessage,
        suggestion,
    };
}

export function parseErrorToReport(
    error: string,
    context?: { roomId?: string; host?: string }
): ConnectionReport {
    const closeCodeMatch = error.match(/^Connection error \((\d+)\)$/)?.[1];
    const closeCode = closeCodeMatch ? parseInt(closeCodeMatch, 10) : null;
    const isPolicy = error === 'IDENTITY_MISMATCH' || error === 'NAME_TAKEN' || error === 'ROOM_FULL' || error === 'INVALID_NAME';

    return createConnectionReport({
        roomId: context?.roomId,
        host: context?.host,
        closeCode: isPolicy ? 1008 : closeCode,
        reason: isPolicy ? error : null,
    });
}

export async function probeServer(
    host: string,
    roomId?: string
): Promise<{ httpStatus: string; diagnosticMessage?: string; suggestion?: string }> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') {
        return { httpStatus: 'N/A' };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return {
            httpStatus: 'Offline',
            diagnosticMessage: 'Device is offline. No internet connection detected.',
            suggestion: 'Check your Wi-Fi or network connection.',
        };
    }

    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const protocol = window.location.protocol === 'https:' && !isLocal ? 'https:' : 'http:';
    const targetUrl = roomId
        ? `${protocol}//${host}/parties/main/${encodeURIComponent(roomId)}`
        : `${protocol}//${host}/`;

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });

        if (response.status === 403) {
            return {
                httpStatus: 'HTTP 403 Forbidden',
                diagnosticMessage: `Server rejected connection with HTTP 403 Forbidden. Origin '${window.location.origin}' may not be allowed.`,
                suggestion: 'Ensure your app URL is included in the PartyKit ALLOWED_ORIGINS setting.',
            };
        }

        if (response.status === 400) {
            return {
                httpStatus: 'HTTP 400 Bad Request',
                diagnosticMessage: `Server responded with HTTP 400 Bad Request for room '${roomId || ''}'.`,
                suggestion: 'Verify that the room ID is valid (4 to 64 alphanumeric characters).',
            };
        }

        if (response.status >= 500) {
            return {
                httpStatus: `HTTP ${response.status} Server Error`,
                diagnosticMessage: `Server returned HTTP ${response.status} error.`,
                suggestion: 'Check server logs for internal exceptions.',
            };
        }

        return {
            httpStatus: `HTTP ${response.status}`,
            diagnosticMessage: `Server is reachable via HTTP (${response.status}), but the WebSocket connection failed.`,
            suggestion: 'A VPN, proxy, firewall, or adblocker may be blocking WebSocket connections.',
        };
    } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return {
            httpStatus: `Unreachable (${errMsg})`,
            diagnosticMessage: `Could not connect to ${host} via HTTP (${errMsg}).`,
            suggestion: isLocal
                ? `PartyKit server is not running on ${host}. Start it with 'npm run partykit' or 'npx partyserver'.`
                : `PartyKit server at ${host} is unreachable. Check your VPN, firewall, or proxy settings, or verify the server is online.`,
        };
    }
}

export function formatReportAsText(report: ConnectionReport): string {
    const lines = [
        '=== VibePOKER Connection Diagnostic Report ===',
        `Timestamp:     ${report.timestamp}`,
        `Host:          ${report.host}`,
    ];

    if (report.roomId) {
        lines.push(`Room ID:       ${report.roomId}`);
    }
    if (report.url) {
        lines.push(`WebSocket URL: ${report.url}`);
    }

    lines.push(`Network:       ${report.isOnline ? 'Online' : 'Offline'}`);
    lines.push(`Close Code:    ${report.closeCode != null ? `${report.closeCode} (${report.closeCodeName})` : 'None'}`);

    if (report.reason) {
        lines.push(`Close Reason:  ${report.reason}`);
    }
    if (report.httpStatus) {
        lines.push(`HTTP Probe:    ${report.httpStatus}`);
    }

    lines.push(`Diagnosis:     ${report.diagnosticMessage}`);
    lines.push(`Suggestion:    ${report.suggestion}`);

    if (typeof navigator !== 'undefined' && navigator.userAgent) {
        lines.push(`User Agent:    ${navigator.userAgent}`);
    }

    lines.push('==============================================');
    return lines.join('\n');
}
