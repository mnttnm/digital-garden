import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { validateUnsubscribeToken } from '../../lib/newsletter/unsubscribe';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

function htmlResponse(status: number, title: string, message: string, isError = false): Response {
  const bgColor = isError ? '#fef2f2' : '#f0fdf4';
  const textColor = isError ? '#991b1b' : '#166534';
  const iconColor = isError ? '#dc2626' : '#16a34a';
  const icon = isError
    ? '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>'
    : '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none"/>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${bgColor};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .icon {
      width: 48px;
      height: 48px;
      color: ${iconColor};
      margin-bottom: 16px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      color: ${textColor};
      margin-bottom: 12px;
    }
    p {
      font-size: 15px;
      color: #6b7280;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <svg class="icon" viewBox="0 0 24 24" fill="none">${icon}</svg>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return htmlResponse(400, 'Missing Token', 'No unsubscribe token provided. Please use the link from your email.', true);
  }

  const secret = import.meta.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    console.error('UNSUBSCRIBE_SECRET not configured');
    return htmlResponse(500, 'Configuration Error', 'Unsubscribe is not configured. Please contact the site owner.', true);
  }

  const validation = validateUnsubscribeToken(token, secret);

  if (!validation.valid || !validation.email) {
    const errorMsg = validation.error === 'Token expired'
      ? 'This unsubscribe link has expired. Please use a more recent email.'
      : 'Invalid unsubscribe link. Please use the link from your email.';
    return htmlResponse(400, 'Invalid Link', errorMsg, true);
  }

  const audienceId = import.meta.env.RESEND_AUDIENCE_ID;
  if (!audienceId) {
    console.error('RESEND_AUDIENCE_ID not configured');
    return htmlResponse(500, 'Configuration Error', 'Newsletter is not configured. Please contact the site owner.', true);
  }

  try {
    // Update contact to unsubscribed
    const result = await resend.contacts.update({
      audienceId,
      id: validation.email, // Resend accepts email as ID
      unsubscribed: true,
    });

    if (result.error) {
      // Contact might not exist, which is fine
      if (result.error.message?.includes('not found')) {
        return htmlResponse(200, 'Unsubscribed', "You've been unsubscribed. You won't receive any more emails from us.");
      }
      throw new Error(result.error.message);
    }

    return htmlResponse(200, 'Unsubscribed', "You've been unsubscribed successfully. You won't receive any more emails from us.");
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return htmlResponse(500, 'Something Went Wrong', 'Failed to process unsubscribe. Please try again or contact the site owner.', true);
  }
};
