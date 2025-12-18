import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DonationSection } from '../DonationSection';
import { overrideElectronAPI } from '../../../../../test/utils';
import { logger } from '../../../../../services/logger';

describe('DonationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render donation text and buttons', () => {
    render(<DonationSection />);

    expect(screen.getByText('Enjoying the app?')).toBeInTheDocument();
    expect(screen.getByLabelText('Donate via PayPal')).toBeInTheDocument();
    expect(screen.getByLabelText('Buy me a coffee')).toBeInTheDocument();
  });

  it('should call openExternal with PayPal URL when PayPal button is clicked', async () => {
    const mockOpenExternal = vi.fn().mockResolvedValue(undefined);
    overrideElectronAPI({
      openExternal: mockOpenExternal,
    });

    render(<DonationSection />);

    const paypalButton = screen.getByLabelText('Donate via PayPal');
    fireEvent.click(paypalButton);

    await waitFor(() => {
      expect(mockOpenExternal).toHaveBeenCalledWith(
        'https://www.paypal.com/donate/?hosted_button_id=HTJXGMEGMWWD6'
      );
    });
  });

  it('should call openExternal with Buy Me a Coffee URL when button is clicked', async () => {
    const mockOpenExternal = vi.fn().mockResolvedValue(undefined);
    overrideElectronAPI({
      openExternal: mockOpenExternal,
    });

    render(<DonationSection />);

    const coffeeButton = screen.getByLabelText('Buy me a coffee');
    fireEvent.click(coffeeButton);

    await waitFor(() => {
      expect(mockOpenExternal).toHaveBeenCalledWith('https://www.buymeacoffee.com/pedrovsiqueira');
    });
  });

  it('should handle error when openExternal fails for PayPal', async () => {
    const mockOpenExternal = vi.fn().mockRejectedValue(new Error('Failed to open link'));

    overrideElectronAPI({
      openExternal: mockOpenExternal,
    });

    render(<DonationSection />);

    const paypalButton = screen.getByLabelText('Donate via PayPal');
    fireEvent.click(paypalButton);

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith('Failed to open donation link:', expect.any(Error));
    });
  });

  it('should handle error when openExternal fails for Buy Me a Coffee', async () => {
    const mockOpenExternal = vi.fn().mockRejectedValue(new Error('Failed to open link'));

    overrideElectronAPI({
      openExternal: mockOpenExternal,
    });

    render(<DonationSection />);

    const coffeeButton = screen.getByLabelText('Buy me a coffee');
    fireEvent.click(coffeeButton);

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith('Failed to open donation link:', expect.any(Error));
    });
  });

  it('should handle error when trackEvent fails for PayPal', async () => {
    const mockTrackEvent = vi.fn().mockRejectedValue(new Error('Failed to track'));

    overrideElectronAPI({
      trackEvent: mockTrackEvent,
      openExternal: vi.fn().mockResolvedValue(undefined),
    });

    render(<DonationSection />);

    const paypalButton = screen.getByLabelText('Donate via PayPal');
    fireEvent.click(paypalButton);

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to track donation click'),
        expect.any(Error)
      );
    });
  });

  it('should handle error when trackEvent fails for Buy Me a Coffee', async () => {
    const mockTrackEvent = vi.fn().mockRejectedValue(new Error('Failed to track'));

    overrideElectronAPI({
      trackEvent: mockTrackEvent,
      openExternal: vi.fn().mockResolvedValue(undefined),
    });

    render(<DonationSection />);

    const coffeeButton = screen.getByLabelText('Buy me a coffee');
    fireEvent.click(coffeeButton);

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to track donation click'),
        expect.any(Error)
      );
    });
  });

  it('should have proper aria-labels for accessibility', () => {
    render(<DonationSection />);

    const paypalButton = screen.getByLabelText('Donate via PayPal');
    const coffeeButton = screen.getByLabelText('Buy me a coffee');

    expect(paypalButton).toHaveAttribute('aria-label', 'Donate via PayPal');
    expect(coffeeButton).toHaveAttribute('aria-label', 'Buy me a coffee');
  });

  it('should display separator between buttons', () => {
    render(<DonationSection />);

    const separator = screen.getByText('•');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('donation-separator');
  });

  it('should render icons in buttons', () => {
    const { container } = render(<DonationSection />);

    const heartIcon = container.querySelector('.heart-icon');
    const coffeeIcon = container.querySelector('.coffee-icon');

    expect(heartIcon).toBeInTheDocument();
    expect(coffeeIcon).toBeInTheDocument();
  });
});
