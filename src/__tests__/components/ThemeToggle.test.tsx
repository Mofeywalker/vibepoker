import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

// Mock next-themes
vi.mock('next-themes', () => ({
    useTheme: vi.fn(),
}));

describe('ThemeToggle', () => {
    const setTheme = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('toggles from light to dark', () => {
        (useTheme as any).mockReturnValue({
            theme: 'light',
            resolvedTheme: 'light',
            setTheme,
        });

        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(setTheme).toHaveBeenCalledWith('dark');
    });

    it('toggles from dark to light', () => {
        (useTheme as any).mockReturnValue({
            theme: 'dark',
            resolvedTheme: 'dark',
            setTheme,
        });

        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(setTheme).toHaveBeenCalledWith('light');
    });

    it('toggles to light when theme is "system" but resolved theme is "dark"', () => {
        // When theme is 'system' and resolvedTheme is 'dark'
        (useTheme as any).mockReturnValue({
            theme: 'system',
            resolvedTheme: 'dark',
            setTheme,
        });

        render(<ThemeToggle />);

        const button = screen.getByRole('button');

        // Should show "Switch to light" title since it's currently dark
        expect(button).toHaveAttribute('title', 'Zum Light Mode wechseln');

        fireEvent.click(button);

        // Should toggle to 'light' because it' currently dark
        expect(setTheme).toHaveBeenCalledWith('light');
    });

    it('toggles to dark when theme is "system" but resolved theme is "light"', () => {
        // When theme is 'system' and resolvedTheme is 'light'
        (useTheme as any).mockReturnValue({
            theme: 'system',
            resolvedTheme: 'light',
            setTheme,
        });

        render(<ThemeToggle />);

        const button = screen.getByRole('button');

        // Should show "Switch to dark" title since it's currently light
        expect(button).toHaveAttribute('title', 'Zum Dark Mode wechseln');

        fireEvent.click(button);

        // Should toggle to 'dark' because it' currently light
        expect(setTheme).toHaveBeenCalledWith('dark');
    });
});
