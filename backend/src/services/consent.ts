import { Page } from "playwright";

// High-confidence accept selectors — these clearly dismiss consent banners
const CONSENT_SELECTORS = [
  // ── Provider-specific (most reliable) ──
  '#onetrust-accept-btn-handler',                    // OneTrust
  '#accept-recommended-btn-handler',                 // OneTrust recommended
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll', // Cookiebot
  '#CybotCookiebotDialogBodyButtonAccept',
  '#ketch-banner-button-primary',                    // Ketch (used by Vultr)
  'button[data-testid="ketch-banner-accept"]',
  '[data-cky-tag="accept-button"]',                  // CookieYes
  '#truste-consent-button',                          // TrustArc
  '.trustarc-agree-btn',
  '.qc-cmp2-summary-buttons button[mode="primary"]', // Quantcast Choice
  '#didomi-notice-agree-button',                     // Didomi
  '.cmplz-btn.cmplz-accept',                         // Complianz
  '#moove_gdpr_cookie_modal .moove-gdpr-infobar-allow-all', // GDPR Cookie Compliance
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

  // ── Generic attribute-based ──
  'button[id*="accept" i]',
  'button[class*="accept" i]',
  'a[id*="accept" i]',
  '[data-testid*="accept" i]',
  '[aria-label*="accept" i]',
  'button[id*="agree" i]',
  'button[class*="agree" i]',

  // ── Ketch generic ──
  '[class*="ketch"] button',

  // ── Text-matching (Playwright :has-text) ──
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

  // ── Low-confidence dismiss fallbacks (close/dismiss only, NOT reject/decline) ──
  'button:has-text("Close")',
  'button:has-text("Dismiss")',
  '[class*="privacy"] button',
];

// Selectors for the banner container itself — used to force-hide if clicking fails
const BANNER_SELECTORS = [
  '#onetrust-banner-sdk',
  '#onetrust-consent-sdk',
  '#CybotCookiebotDialog',
  '#truste-consent-track',
  '.qc-cmp2-container',
  '#didomi-host',
  '[id*="ketch"]',
  '[class*="ketch"]',
  '.cmplz-cookiebanner',
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
      if (await el.isVisible({ timeout: 600 })) {
        await el.click({ timeout: 2000 });
        dismissed = true;
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

  // Remove any remaining overlays that block interaction (use computed style, not inline)
  await page.evaluate(() => {
    const overlays = document.querySelectorAll('[class*="overlay"], [class*="modal-backdrop"], [class*="consent"], [class*="cookie"]');
    overlays.forEach((el) => {
      if (el instanceof HTMLElement) {
        const z = parseInt(window.getComputedStyle(el).zIndex);
        if (z > 999) {
          el.style.display = "none";
        }
      }
    });
    // Reset body overflow in case it was locked
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }).catch(() => {});

  return dismissed;
}
