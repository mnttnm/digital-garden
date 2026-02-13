import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Frequency = 'daily' | 'weekly';
type Preference = 'all' | 'projects';

function jsonResponse(
  status: number,
  payload: { success: boolean; code: string; message: string }
) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function normalizeFrequency(value: unknown): Frequency | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'daily' || normalized === 'weekly') return normalized;
  return null;
}

function normalizePreference(value: unknown): Preference | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'all' || normalized === 'projects') return normalized;
  return null;
}

// Welcome email template
function getWelcomeEmail(frequency: Frequency, preference: Preference) {
  const frequencyText = frequency === 'daily' ? 'daily' : 'weekly';
  const preferenceText =
    preference === 'projects'
      ? 'project launches, milestones, and updates'
      : 'all updates: learnings, curated links, and project updates';

  return {
    subject: "Welcome to my corner of the internet 👋",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 40px 20px;">

  <p style="font-size: 17px; margin-bottom: 24px;">
    Hey there! 👋
  </p>

  <p style="font-size: 17px; margin-bottom: 24px;">
    Thanks for subscribing — I'm genuinely glad you're here.
  </p>

  <p style="font-size: 17px; margin-bottom: 24px;">
    I'll be sending you a <strong>${frequencyText} digest</strong> of what I've been learning, building,
    and finding interesting, focused on <strong>${preferenceText}</strong>. Think of it as a curated peek into my notes — the good stuff
    without the noise.
  </p>

  <p style="font-size: 17px; margin-bottom: 24px;">
    Here's what you can expect:
  </p>

  <ul style="font-size: 17px; margin-bottom: 24px; padding-left: 24px;">
    <li style="margin-bottom: 8px;">Essays on AI, product building, and working smarter</li>
    <li style="margin-bottom: 8px;">Links to things that made me think</li>
    <li style="margin-bottom: 8px;">Code snippets and technical learnings</li>
    <li style="margin-bottom: 8px;">Updates on projects I'm shipping</li>
  </ul>

  <p style="font-size: 17px; margin-bottom: 24px;">
    In the meantime, feel free to explore the site or just reply to this email
    if you want to say hi. I read every response.
  </p>

  <p style="font-size: 17px; margin-bottom: 8px;">
    Talk soon,
  </p>
  <p style="font-size: 17px; margin-bottom: 24px;">
    <strong>Mohit</strong>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">

  <p style="font-size: 14px; color: #666;">
    P.S. If this landed in spam or promotions, dragging it to your inbox helps
    make sure you don't miss future emails.
  </p>

</body>
</html>
    `,
    text: `Hey there! 

Thanks for subscribing — I'm genuinely glad you're here.

I'll be sending you a ${frequencyText} digest of what I've been learning, building, and finding interesting, focused on ${preferenceText}. Think of it as a curated peek into my notes — the good stuff without the noise.

Here's what you can expect:
- Essays on AI, product building, and working smarter
- Links to things that made me think
- Code snippets and technical learnings
- Updates on projects I'm shipping

In the meantime, feel free to explore the site or just reply to this email if you want to say hi. I read every response.

Talk soon,
Mohit

---

P.S. If this landed in spam or promotions, dragging it to your inbox helps make sure you don't miss future emails.
    `
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
    const frequency = normalizeFrequency(data?.frequency);
    const preference = normalizePreference(data?.preference);

    // Validate input
    if (!email || !frequency || !preference) {
      return jsonResponse(400, {
        success: false,
        code: 'invalid_payload',
        message: 'Email, frequency, and preference are required.',
      });
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      return jsonResponse(400, {
        success: false,
        code: 'invalid_email',
        message: 'Invalid email format.',
      });
    }

    // Add to Resend Audience
    const audienceId = import.meta.env.RESEND_AUDIENCE_ID;

    if (!audienceId) {
      console.error('RESEND_AUDIENCE_ID not configured');
      return jsonResponse(500, {
        success: false,
        code: 'newsletter_not_configured',
        message: 'Newsletter is not configured.',
      });
    }

    // Upsert contact in audience
    const createResult = await resend.contacts.create({
      email,
      audienceId,
      firstName: '',
      lastName: '',
      unsubscribed: false,
      properties: {
        frequency,
        preference,
      },
    });

    if (createResult.error) {
      const isAlreadySubscribed =
        createResult.error.message.includes('already exists') ||
        createResult.error.name === 'validation_error';

      if (isAlreadySubscribed) {
        // Already subscribed - return success without re-sending welcome email
        return jsonResponse(200, {
          success: true,
          code: 'already_subscribed',
          message: `You're already subscribed! Check your inbox for updates.`,
        });
      }

      throw new Error(createResult.error.message);
    }

    // Send welcome email (only for new subscribers)
    const welcomeEmail = getWelcomeEmail(frequency, preference);
    const fromEmail = import.meta.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const sendResult = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html,
      text: welcomeEmail.text,
    });

    if (sendResult.error) {
      throw new Error(sendResult.error.message);
    }

    return jsonResponse(200, {
      success: true,
      code: 'subscribed',
      message: `You're in! Check your inbox for a welcome note.`,
    });
  } catch (error: unknown) {
    console.error('Subscribe error:', error);

    return jsonResponse(500, {
      success: false,
      code: 'subscribe_failed',
      message: 'Failed to subscribe. Please try again.',
    });
  }
};
