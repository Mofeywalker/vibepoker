import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getCloseCodeName,
    getDiagnosticExplanation,
    createConnectionReport,
    parseErrorToReport,
    probeServer,
    formatReportAsText
} from '@/lib/realtime/connection-diagnostics';

describe('connection-diagnostics', () => {
    describe('getCloseCodeName', () => {
        it('returns friendly name for standard WebSocket codes', () => {
            expect(getCloseCodeName(1000)).toBe('Normal Closure');
            expect(getCloseCodeName(1006)).toBe('Abnormal Closure');
            expect(getCloseCodeName(1011)).toBe('Internal Server Error');
            expect(getCloseCodeName(1008)).toBe('Policy Violation');
            expect(getCloseCodeName(1012)).toBe('Service Restart');
            expect(getCloseCodeName(1013)).toBe('Try Again Later');
        });

        it('handles null, undefined and unknown codes', () => {
            expect(getCloseCodeName(null)).toBe('No Code');
            expect(getCloseCodeName(undefined)).toBe('No Code');
            expect(getCloseCodeName(4999)).toBe('Close Code 4999');
        });
    });

    describe('getDiagnosticExplanation', () => {
        it('identifies offline browser state', () => {
            const explanation = getDiagnosticExplanation(1006, null, false);
            expect(explanation.diagnosticMessage).toContain('Browser is offline');
            expect(explanation.suggestion).toContain('check your Wi-Fi');
        });

        it('gives local PartyKit advice for code 1006 on localhost', () => {
            const explanation = getDiagnosticExplanation(1006, null, true, 'localhost:1999');
            expect(explanation.diagnosticMessage).toContain('WebSocket closed abnormally');
            expect(explanation.suggestion).toContain('npm run partykit');
        });

        it('gives remote advice for code 1006 on remote host', () => {
            const explanation = getDiagnosticExplanation(1006, null, true, 'vibepoker.app');
            expect(explanation.suggestion).toContain('firewall/VPN');
        });

        it('explains code 1011 internal server error', () => {
            const explanation = getDiagnosticExplanation(1011, 'DB failed', true);
            expect(explanation.diagnosticMessage).toContain('DB failed');
            expect(explanation.suggestion).toContain('PartyKit server logs');
        });

        it('explains code 1008 policy violations', () => {
            const explanation = getDiagnosticExplanation(1008, 'IDENTITY_MISMATCH', true);
            expect(explanation.suggestion).toContain('Session conflict');
        });

        it('explains code 1012 service restart', () => {
            const explanation = getDiagnosticExplanation(1012, null, true);
            expect(explanation.diagnosticMessage).toContain('restarting');
        });
    });

    describe('createConnectionReport and parseErrorToReport', () => {
        it('creates a populated report with defaults', () => {
            const report = createConnectionReport({
                roomId: 'test-room',
                host: 'custom-host:1999',
                closeCode: 1006,
                isOnline: true
            });

            expect(report.roomId).toBe('test-room');
            expect(report.host).toBe('custom-host:1999');
            expect(report.closeCode).toBe(1006);
            expect(report.closeCodeName).toBe('Abnormal Closure');
            expect(report.isOnline).toBe(true);
            expect(report.timestamp).toBeTruthy();
        });

        it('parses error string with code into structured report', () => {
            const report = parseErrorToReport('Connection error (1011)', { roomId: 'room-1' });
            expect(report.closeCode).toBe(1011);
            expect(report.closeCodeName).toBe('Internal Server Error');
            expect(report.roomId).toBe('room-1');
        });

        it('parses policy errors into structured report', () => {
            const report = parseErrorToReport('IDENTITY_MISMATCH', { roomId: 'room-2' });
            expect(report.closeCode).toBe(1008);
            expect(report.reason).toBe('IDENTITY_MISMATCH');
        });
    });

    describe('formatReportAsText', () => {
        it('formats report for clipboard copy', () => {
            const report = createConnectionReport({
                roomId: 'room-abc',
                host: 'localhost:1999',
                closeCode: 1006,
                httpStatus: 'Unreachable (Failed to fetch)'
            });

            const text = formatReportAsText(report);
            expect(text).toContain('=== VibePOKER Connection Diagnostic Report ===');
            expect(text).toContain('Room ID:       room-abc');
            expect(text).toContain('Host:          localhost:1999');
            expect(text).toContain('Close Code:    1006 (Abnormal Closure)');
            expect(text).toContain('HTTP Probe:    Unreachable (Failed to fetch)');
            expect(text).toContain('==============================================');
        });
    });

    describe('probeServer', () => {
        const originalFetch = globalThis.fetch;

        afterEach(() => {
            globalThis.fetch = originalFetch;
        });

        it('detects 403 Forbidden origin mismatch', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue(new Response('', { status: 403 }));

            const result = await probeServer('localhost:1999', 'room-1');
            expect(result.httpStatus).toBe('HTTP 403 Forbidden');
            expect(result.diagnosticMessage).toContain('403 Forbidden');
        });

        it('detects 400 Bad Request room format issue', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue(new Response('', { status: 400 }));

            const result = await probeServer('localhost:1999', 'bad!');
            expect(result.httpStatus).toBe('HTTP 400 Bad Request');
            expect(result.suggestion).toContain('room ID');
        });

        it('detects connection failure / server down', async () => {
            globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

            const result = await probeServer('localhost:1999', 'room-1');
            expect(result.httpStatus).toContain('Unreachable');
            expect(result.suggestion).toContain('npm run partykit');
        });
    });
});
