#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateNewsletterBundle } from '../src/lib/newsletter/generate.mjs';

function parseArgs(argv) {
  const parsed = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    parsed[key] = value ?? 'true';
  }
  return parsed;
}

function validateType(value) {
  if (value === 'daily' || value === 'weekly') return value;
  throw new Error(`Invalid --type value: ${value}. Use daily or weekly.`);
}

const args = parseArgs(process.argv.slice(2));
const type = validateType(args.type || 'daily');
const dateInput = args.date;

const siteUrl = process.env.SITE_URL || '';
const bundle = generateNewsletterBundle({ type, dateInput, siteUrl });

const cwd = fileURLToPath(new URL('..', import.meta.url));
const outputDir = path.join(cwd, '.tmp', 'newsletter-preview');
fs.mkdirSync(outputDir, { recursive: true });

const baseName = `${bundle.type}-${bundle.window.dateLabel}`;
const outputs = [
  { name: `${baseName}.all.html`, content: bundle.variants.all.html },
  { name: `${baseName}.all.txt`, content: bundle.variants.all.text },
  { name: `${baseName}.projects.html`, content: bundle.variants.projects.html },
  { name: `${baseName}.projects.txt`, content: bundle.variants.projects.text },
  { name: `${baseName}.summary.json`, content: JSON.stringify(bundle, null, 2) },
];

for (const output of outputs) {
  fs.writeFileSync(path.join(outputDir, output.name), output.content, 'utf8');
}

console.log(`Preview generated: ${outputDir}`);
console.log(`Subject: ${bundle.subject}`);
console.log(`Window: ${bundle.window.dateLabel} (UTC)`);
console.log(`All variant items: ${bundle.variants.all.count}`);
console.log(`Projects variant items: ${bundle.variants.projects.count}`);
console.log('Files:');
for (const output of outputs) {
  console.log(`- ${path.join(outputDir, output.name)}`);
}
