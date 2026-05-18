import { Page } from "playwright";

// Common cookie consent selectors — covers most CMP providers
const CONSENT_SELECTORS = [
  // Generic accept buttons
  'button[id*="accept" i]',
  'button[class*="accept" i]',
  'a[id*="accept" i]',
  '[data-testid*="accept" i]',
  '[aria-label*="accept" i]',

  // "I agree" / "Got it" / "OK" buttons
  'button[id*="agree" i]',
  'button[class*="agree" i]',
  'button[id*="consent" i]',
  'button[class*="consent" i]',

  // Common CMP providers
  '#onetrust-accept-btn-handler',                    // OneTrust
  '#onetrust-pc-btn-handler',                        // OneTrust "Accept All" in preferences
  '.onetrust-close-btn-handler',
  '#accept-recommended-btn-handler',                 // OneTrust recommended
  'button.save-preference-btn-handler',              // OneTrust save
  '#ketch-banner-button-primary',                    // Ketch (used by Vultr)
  '[class*="ketch"] button',                         // Ketch generic
  'button[data-testid="ketch-banner-accept"]',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', // Cookiebot
  '#CybotCookiebotDialogBodyButtonAccept',
  '[data-cky-tag="accept-button"]',                  // CookieYes
  '.cc-accept-all',                                  // Cookie Consent (Osano)
  '.cc-btn.cc-dismiss',
  '#cookie-accept',
  '.cookie-accept',
  '#gdpr-cookie-accept',
  '.js-cookie-consent-agree',
  '[data-cookie-consent="accept"]',
  '#allow-all-cookies',
  '.accept-cookies',
  '#cookieAcceptAll',

  // Broader text-matching fallbacks
  'button:has-text("Accept All")',
  'button:has-text("Accept all")',
  'button:has-text("Accept Cookies")',
  'button:has-text("Accept cookies")',
  'button:has-text("Allow All")',
  'button:has-text("Allow all")',
  'button:has-text("Allow Cookies")',
  'button:has-text("I Agree")',
  'button:has-text("I agree")',
  'button:has-text("Got it")',
  'button:has-text("OK")',
  'button:has-text("Okay")',
  'button:has-text("Understood")',
  'a:has-text("Accept All")',
  'a:has-text("Accept Cookies")',
  'a:has-text("I Agree")',
  'button:has-text("Reject All")',       // sometimes "Reject All" is the dismiss button
  'button:has-text("Decline")',
  'button:has-text("Close")',
  'button:has-text("Dismiss")',
  'button:has-text("Continue")',
  '[class*="privacy"] button',
  '[class*="ketch"] button',
];

// Common overlay/banner selectors to hide if clicking fails
const BANNER_SELECTORS = [
  '#onetrust-banner-sdk',
  '#onetrust-consent-sdk',
  '#CybotCookiebotDialog',
  '[id*="ketch"]',
  '[class*="ketch"]',
  '.cookie-banner',
  '.cookie-consent',
  '#cookie-notice',
  '.gdpr-banner',
  '[class*="cookie-banner"]',
  '[class*="consent-banner"]',
  '[id*="cookie-banner"]',
  '[id*="consent-banner"]',
];

export async function dismissConsentPopups(page: Page): Promise<boolean> {
  let dismissed = false;

  // Try clicking accept buttons
  for (const selector of CONSENT_SELECTORS) {
    try {
      const el = page.locator(selector).first();
      if (await el.isVisible({ timeout: 300 })) {
        await el.click({ timeout: 2000 });
        dismissed = true;
        // Wait briefly for banner to close
        await page.waitForTimeout(500);
        break;
      }
    } catch {
      // Selector not found or not clickable — continue
    }
  }

  // If no button worked, try hiding banners via JS
  if (!dismissed) {
    for (const selector of BANNER_SELECTORS) {
      try {
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el instanceof HTMLElement) {
            el.style.display = "none";
            return true;
          }
          return false;
        }, selector);
      } catch {
        // ignore
      }
    }
  }

  // Remove any remaining overlays that block interaction
  await page.evaluate(() => {
    const overlays = document.querySelectorAll('[class*="overlay"], [class*="modal-backdrop"]');
    overlays.forEach((el) => {
      if (el instanceof HTMLElement && el.style.zIndex && parseInt(el.style.zIndex) > 999) {
        el.style.display = "none";
      }
    });
    // Reset body overflow in case it was locked
    document.body.style.overflow = "auto";
  }).catch(() => {});

  return dismissed;
}
