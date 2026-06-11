import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

/**
 * price_key: 'lunar' | 'stellar' | 'galactic' | 'credits_10' | 'credits_25' | 'credits_50'
 */
export default function CheckoutButton({ priceKey, userId, children, className = '', style, disabled = false }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    // Block checkout inside an iframe (Base44 preview)
    if (window.self !== window.top) {
      alert('Checkout is only available from the published app, not the preview.');
      return;
    }

    setLoading(true);
    try {
      const origin = window.location.origin;
      const response = await base44.functions.invoke('createCheckout', {
        price_key: priceKey,
        user_id: userId || '',
        success_url: `${origin}/home?payment=success`,
        cancel_url: `${origin}/home?payment=cancelled`,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        alert('Could not start checkout. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={className}
      style={style}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
      {children}
    </button>
  );
}