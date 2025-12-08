import React from 'react';
import { Heart, Coffee } from 'lucide-react';
import { openExternal, trackEvent } from '../../../../services/electronAPI';
import './DonationSection.css';

export function DonationSection(): React.JSX.Element {
  return (
    <div className="donation-container">
      <p className="donation-text">Enjoying the app?</p>
      <div className="donation-buttons">
        <button
          className="donation-link"
          aria-label="Donate via PayPal"
          onClick={async () => {
            trackEvent('donation_clicked', { location: 'left_panel', type: 'paypal' });
            try {
              await openExternal('https://www.paypal.com/donate/?hosted_button_id=HTJXGMEGMWWD6');
            } catch (error) {
              console.error('Failed to open donation link:', error);
            }
          }}
        >
          Donate <Heart size={12} className="heart-icon" fill="currentColor" />
        </button>
        <span className="donation-separator">•</span>
        <button
          className="donation-link"
          aria-label="Buy me a coffee"
          onClick={async () => {
            trackEvent('donation_clicked', { location: 'left_panel', type: 'buymeacoffee' });
            try {
              await openExternal('https://www.buymeacoffee.com/pedrovsiqueira');
            } catch (error) {
              console.error('Failed to open donation link:', error);
            }
          }}
        >
          Buy me a coffee <Coffee size={12} className="coffee-icon" />
        </button>
      </div>
    </div>
  );
}
