import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

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
    // Note: You'll need to create an audience in Resend and get the ID
    const audienceId = import.meta.env.RESEND_AUDIENCE_ID;

    if (!audienceId) {
      console.error('RESEND_AUDIENCE_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Newsletter not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await resend.contacts.create({
      email,
      audienceId,
      firstName: '',
      lastName: '',
      unsubscribed: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Subscribed to ${frequency} digest!`
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
