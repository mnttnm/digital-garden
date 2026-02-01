import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

// Welcome email template
function getWelcomeEmail(frequency: string) {
  const frequencyText = frequency === 'daily' ? 'daily' : 'weekly';

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
    and finding interesting. Think of it as a curated peek into my notes — the good stuff
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
    text: `Hey there! 👋

Thanks for subscribing — I'm genuinely glad you're here.

I'll be sending you a ${frequencyText} digest of what I've been learning, building, and finding interesting. Think of it as a curated peek into my notes — the good stuff without the noise.

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
    const { email, frequency } = data;

    // Validate input
    if (!email || !frequency) {
      return new Response(
        JSON.stringify({ error: 'Email and frequency are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate frequency
    if (!['daily', 'weekly'].includes(frequency)) {
      return new Response(
        JSON.stringify({ error: 'Frequency must be daily or weekly' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add to Resend Audience
    const audienceId = import.meta.env.RESEND_AUDIENCE_ID;

    if (!audienceId) {
      console.error('RESEND_AUDIENCE_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Newsletter not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add contact to audience
    await resend.contacts.create({
      email,
      audienceId,
      firstName: '',
      lastName: '',
      unsubscribed: false,
    });

    // Send welcome email
    const welcomeEmail = getWelcomeEmail(frequency);
    const fromEmail = import.meta.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html,
      text: welcomeEmail.text,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `You're in! Check your inbox for a welcome note.`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Subscribe error:', error);

    // Handle duplicate email
    if (error?.message?.includes('already exists')) {
      return new Response(
        JSON.stringify({ error: 'This email is already subscribed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to subscribe. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
