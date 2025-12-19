import React from 'react';
import { Heart, Coffee } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { openExternal, trackEvent, logger } from '../../../../services';
import './DonationSection.css';

const PAYPAL_DONATION_URL = 'https://www.paypal.com/donate/?hosted_button_id=HTJXGMEGMWWD6';
const BUY_ME_A_COFFEE_URL = 'https://www.buymeacoffee.com/pedrovsiqueira';

function DonationSection(): React.JSX.Element {
  const handleDonationClick = async (url: string, type: string) => {
    trackEvent('donation_clicked', { location: 'left_panel', type }).catch((error) => {
      logger.error(`Failed to track donation click (type: ${type}, url: ${url}):`, error);
    });
    try {
      await openExternal(url);
    } catch (error) {
      logger.error('Failed to open donation link:', error);
    }
  };

  return (
    <div className="donation-container">
      <p className="donation-text">Enjoying the app?</p>
      <div className="donation-buttons">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Donate via PayPal"
          onClick={() => handleDonationClick(PAYPAL_DONATION_URL, 'paypal')}
          className="donation-link"
        >
          Donate <Heart size={12} className="heart-icon" fill="currentColor" />
        </Button>
        <span className="donation-separator">•</span>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Buy me a coffee"
          onClick={() => handleDonationClick(BUY_ME_A_COFFEE_URL, 'buymeacoffee')}
          className="donation-link"
        >
          Buy me a coffee <Coffee size={12} className="coffee-icon" />
        </Button>
      </div>
    </div>
  );
}

export { DonationSection };
