import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { getClientIp, checkRateLimit, incrementRateLimit } from '../../lib/newsletter/rate-limit';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Frequency = 'daily' | 'weekly';
type Preference = 'all' | 'projects' | 'insights';

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
  if (normalized === 'all' || normalized === 'projects' || normalized === 'insights') return normalized;
  return null;
}

// Welcome email template
function getWelcomeEmail(frequency: Frequency, preference: Preference) {
  const frequencyText = frequency === 'daily' ? 'daily' : 'weekly';

  const preferenceConfig = {
    all: {
      text: 'everything: learnings, curated links, and project updates',
      bullets: [
        'Essays on AI, product building, and working smarter',
        'Links to things that made me think',
        'Code snippets and technical learnings',
        'Updates on projects I\'m shipping',
      ],
    },
    projects: {
      text: 'project launches, milestones, and updates',
      bullets: [
        'New projects and launches',
        'Behind-the-scenes build logs',
        'Tools and techniques I discovered along the way',
        'Milestone updates and lessons learned',
      ],
    },
    insights: {
      text: 'learnings, discoveries, and curated links',
      bullets: [
        'Essays on AI, product building, and working smarter',
        'Links to things that made me think',
        'Code snippets and technical learnings',
        'Quick notes and discoveries',
      ],
    },
  };

  const config = preferenceConfig[preference];

  return {
    subject: "Welcome to my corner of the internet",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 40px 20px;">

  <p style="font-size: 17px; margin-bottom: 24px;">
    Hey there!
  </p>

  <p style="font-size: 17px; margin-bottom: 24px;">
    Thanks for subscribing — I'm genuinely glad you're here.
  </p>

  <p style="font-size: 17px; margin-bottom: 24px;">
    Fair warning: this site is more of a living notebook than a polished publication.
    There's no fixed schedule — just whatever I'm exploring at the moment.
    I'll be sending you a <strong>${frequencyText} digest</strong> focused on <strong>${config.text}</strong>.
  </p>

  <p style="font-size: 17px; margin-bottom: 24px;">
    Here's what you can expect:
  </p>

  <ul style="font-size: 17px; margin-bottom: 24px; padding-left: 24px;">
    ${config.bullets.map(b => `<li style="margin-bottom: 8px;">${b}</li>`).join('\n    ')}
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

Fair warning: this site is more of a living notebook than a polished publication. There's no fixed schedule — just whatever I'm exploring at the moment. I'll be sending you a ${frequencyText} digest focused on ${config.text}.

Here's what you can expect:
${config.bullets.map(b => `- ${b}`).join('\n')}

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

    // Honeypot check - bots fill hidden fields, humans don't
    const honeypot = data?.website;
    if (honeypot) {
      // Silently accept to fool bots, but don't actually subscribe
      return jsonResponse(200, {
        success: true,
        code: 'subscribed',
        message: `You're in! Check your inbox for a welcome note.`,
      });
    }

    // Rate limit check
    const clientIp = getClientIp(request);
    const rateCheck = await checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return jsonResponse(429, {
        success: false,
        code: 'rate_limited',
        message: 'Too many subscription attempts. Please try again later.',
      });
    }

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

    // Track rate limit after successful subscription
    await incrementRateLimit(clientIp);

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
