#!/usr/bin/env node
import { Resend } from 'resend';
import { generateNewsletterBundle } from '../src/lib/newsletter/generate.mjs';
import { buildUnsubscribeUrl } from '../src/lib/newsletter/unsubscribe.js';

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    parsed[key] = value ?? 'true';
  }
  return parsed;
}

function getPropertyValue(properties, key) {
  if (!properties || typeof properties !== 'object') return undefined;
  const raw = properties[key];
  if (!raw || typeof raw !== 'object') return undefined;
  if ('value' in raw) return raw.value;
  return undefined;
}

function normalizeFrequency(value) {
  return value === 'daily' ? 'daily' : 'weekly';
}

function normalizePreference(value) {
  if (value === 'projects') return 'projects';
  if (value === 'insights') return 'insights';
  return 'all';
}

async function listAllContacts(resend, audienceId) {
  const contacts = [];
  let after;

  while (true) {
    const response = await resend.contacts.list({ audienceId, limit: 100, ...(after ? { after } : {}) });
    if (response.error) {
      throw new Error(`Failed to list contacts: ${response.error.message}`);
    }

    const batch = response.data?.data || [];
    contacts.push(...batch);

    if (!response.data?.has_more || batch.length === 0) {
      break;
    }

    after = batch[batch.length - 1]?.id;
    if (!after) break;
  }

  return contacts;
}

async function getContactPreferences(resend, audienceId, contact) {
  const response = await resend.contacts.get({ audienceId, id: contact.id });
  if (response.error) {
    return {
      email: contact.email,
      unsubscribed: Boolean(contact.unsubscribed),
      frequency: 'weekly',
      preference: 'all',
    };
  }

  const properties = response.data?.properties;
  return {
    email: contact.email,
    unsubscribed: Boolean(contact.unsubscribed),
    frequency: normalizeFrequency(getPropertyValue(properties, 'frequency')),
    preference: normalizePreference(getPropertyValue(properties, 'preference')),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const type = args.type === 'weekly' ? 'weekly' : 'daily';
  const dateInput = args.date;
  const confirm = args.confirm === 'true';

  if (!confirm) {
    console.error('Aborted: --confirm=true is required for sending.');
    process.exit(1);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.SITE_URL || '';
  const unsubscribeSecret = process.env.UNSUBSCRIBE_SECRET;

  if (!apiKey || !audienceId) {
    console.error('Missing required env vars: RESEND_API_KEY and RESEND_AUDIENCE_ID');
    process.exit(1);
  }

  if (!unsubscribeSecret) {
    console.error('Missing required env var: UNSUBSCRIBE_SECRET (for unsubscribe links)');
    process.exit(1);
  }

  if (!siteUrl) {
    console.error('Missing required env var: SITE_URL (for unsubscribe links)');
    process.exit(1);
  }

  const resend = new Resend(apiKey);
  const bundle = generateNewsletterBundle({ type, dateInput, siteUrl });

  const contacts = await listAllContacts(resend, audienceId);
  const recipients = [];

  for (const contact of contacts) {
    const resolved = await getContactPreferences(resend, audienceId, contact);
    if (resolved.unsubscribed) continue;
    if (resolved.frequency !== type) continue;
    recipients.push(resolved);
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    // Select variant based on preference
    const variant = recipient.preference === 'projects'
      ? bundle.variants.projects
      : recipient.preference === 'insights'
      ? bundle.variants.insights
      : bundle.variants.all;

    // Generate per-recipient unsubscribe URL
    const unsubscribeUrl = buildUnsubscribeUrl(recipient.email, siteUrl, unsubscribeSecret);

    // Inject unsubscribe URL into HTML and text
    const html = variant.html.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);
    const text = variant.text + `\n\n---\nUnsubscribe: ${unsubscribeUrl}`;

    const response = await resend.emails.send({
      from: fromEmail,
      to: recipient.email,
      subject: bundle.subject,
      html,
      text,
    });

    if (response.error) {
      failed += 1;
      console.error(`Failed: ${recipient.email} -> ${response.error.message}`);
      continue;
    }

    sent += 1;
  }

  console.log(`Newsletter send complete.`);
  console.log(`Type: ${bundle.type}`);
  console.log(`Subject: ${bundle.subject}`);
  console.log(`Audience contacts scanned: ${contacts.length}`);
  console.log(`Recipients eligible: ${recipients.length}`);
  console.log(`Sent: ${sent}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
