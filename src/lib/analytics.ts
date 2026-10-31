// Thin wrapper over Google Analytics (gtag) and Meta Pixel (fbq).
// Both are optional; the scripts are only loaded when their env IDs are set (see step 6).

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEvent =
  | 'cta_click'
  | 'form_start'
  | 'enquiry_submitted'
  | 'waitlist_joined'
  | 'payment_started'
  | 'payment_success';

const PIXEL_STANDARD: Partial<Record<AnalyticsEvent, string>> = {
  form_start: 'Lead',
  payment_started: 'InitiateCheckout',
  payment_success: 'Purchase',
};

export function track(event: AnalyticsEvent, props: Props = {}) {
  if (typeof window === 'undefined') return;
  try {
    window.gtag?.('event', event, props);
    const std = PIXEL_STANDARD[event];
    if (std) window.fbq?.('track', std, props);
    else window.fbq?.('trackCustom', event, props);
  } catch {
    // analytics must never break the page
  }
}
