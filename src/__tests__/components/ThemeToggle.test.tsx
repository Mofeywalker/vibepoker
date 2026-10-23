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
    const mockTheme = (resolvedTheme: 'light' | 'dark', theme: string = resolvedTheme) => {
        vi.mocked(useTheme).mockReturnValue({
            theme,
            resolvedTheme,
            setTheme,
            themes: ['light', 'dark', 'colorful', 'system'],
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('toggles from light to dark', () => {
        mockTheme('light');

        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(setTheme).toHaveBeenCalledWith('dark');
    });

    it('cycles from dark to colorful', () => {
        mockTheme('dark');

        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('title', 'Switch to colorful mode');
        fireEvent.click(button);

        expect(setTheme).toHaveBeenCalledWith('colorful');
    });

    it('cycles from colorful back to light', () => {
        mockTheme('light', 'colorful');

        render(<ThemeToggle />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('title', 'Switch to light mode');
        fireEvent.click(button);

        expect(setTheme).toHaveBeenCalledWith('light');
    });

    it('continues from resolved dark when theme is "system"', () => {
        // When theme is 'system' and resolvedTheme is 'dark'
        mockTheme('dark', 'system');

        render(<ThemeToggle />);

        const button = screen.getByRole('button');

        // Resolved dark is followed by colorful
        expect(button).toHaveAttribute('title', 'Switch to colorful mode');

        fireEvent.click(button);

        // 'system' resolves to dark, so the cycle continues to colorful
        expect(setTheme).toHaveBeenCalledWith('colorful');
    });

    it('toggles to dark when theme is "system" but resolved theme is "light"', () => {
        // When theme is 'system' and resolvedTheme is 'light'
        mockTheme('light', 'system');

        render(<ThemeToggle />);

        const button = screen.getByRole('button');

        // Should show "Switch to dark" title since it's currently light
        expect(button).toHaveAttribute('title', 'Switch to dark mode');

        fireEvent.click(button);

        // Should toggle to 'dark' because it' currently light
        expect(setTheme).toHaveBeenCalledWith('dark');
    });
});
