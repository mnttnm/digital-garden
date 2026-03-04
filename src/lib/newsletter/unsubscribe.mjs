/**
 * Unsubscribe Token Utility
 *
 * Generates and validates signed tokens for newsletter unsubscribe links.
 * Tokens include email + expiry + HMAC signature for security.
 */

import { createHmac } from 'node:crypto';

const TOKEN_EXPIRY_DAYS = 90; // Tokens valid for 90 days

/**
 * Generate a signed unsubscribe token for an email
 */
export function generateUnsubscribeToken(email, secret) {
  const expiry = Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${email}:${expiry}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);
  const token = `${payload}:${signature}`;
  return Buffer.from(token).toString('base64url');
}

/**
 * Validate an unsubscribe token and extract the email
 */
export function validateUnsubscribeToken(token, secret) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');

    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [email, expiryStr, providedSignature] = parts;
    const expiry = parseInt(expiryStr, 10);

    // Check expiry
    if (isNaN(expiry) || Date.now() > expiry) {
      return { valid: false, error: 'Token expired' };
    }

    // Verify signature
    const payload = `${email}:${expiryStr}`;
    const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);

    if (providedSignature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true, email };
  } catch {
    return { valid: false, error: 'Token decode failed' };
  }
}

/**
 * Build a full unsubscribe URL for an email
 */
export function buildUnsubscribeUrl(email, siteUrl, secret) {
  const token = generateUnsubscribeToken(email, secret);
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  return `${normalizedSiteUrl}/api/unsubscribe?token=${token}`;
}
