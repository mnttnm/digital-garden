# Writing Style Guide

This guide defines the editorial voice for all content on the digital garden. Every content command and skill should follow these principles.

## Core Principles

1. **Value density** — Every sentence should earn its place. If a sentence doesn't add information, experience, or insight, cut it.
2. **No clickbait** — Titles say what the post is about, not what the reader will feel. "Claude Code Agent Teams and multi-agent coordination" not "You won't believe what happened when I spawned 6 AI agents."
3. **Authentic over polished** — Share real experiences, real tool names, real outcomes. If something didn't work, say so briefly. If you're unsure, say that too.

## Voice

- First person, conversational — "I tried...", "The standout was...", "Worth knowing:"
- Calm and genuine — enthusiastic without hype, honest without self-deprecation
- Speak as if explaining to a friend who builds things — not teaching, not selling

## Titles

- **Say what the post is about.** Lead with the concept or tool, not a hook.
- **No "how to" unless it's actually a tutorial.** For experiences and learnings, describe the topic.
- **No superlatives or emotional bait.** Skip "incredible", "game-changing", "you need to try this."
- **Keep it natural.** Read it out loud — if it sounds like a headline, tone it down.

Good: "The night shift pattern — let agents build while you sleep"
Good: "Claude Code Agent Teams and multi-agent coordination"
Bad: "I watched six AI agents build a product while I answered their questions"
Bad: "This AI workflow hack will 10x your productivity"

## Structure

- **Lead with what it is**, not why you're writing about it. Skip preamble.
- **Prose over bullets** unless the content is genuinely a list (tips, setup steps, things to know).
- **Don't force bullets.** If the content reads naturally as paragraphs, keep it that way. Use bullets only when items are independent and scannable.
- **Short paragraphs** — 2-4 sentences. Let whitespace do the work.

## Length

- **Discoveries (learning)**: 2-5 short paragraphs. Say what happened, what was interesting, and any practical tips.
- **Discoveries (resource)**: 1-2 sentences on why it's worth checking out. Not a review.
- **Project activity**: 2-3 sentence summary, changelog style.

## What to Include

- Specific tool names, commands, feature flags — practical details someone can act on
- Your actual experience — what you tried, what surprised you, what the outcome was
- Links to docs or resources when relevant, naturally placed

## Punctuation

- **Limit em dashes.** Use 1-2 per post at most. Vary with periods, commas, parentheses, or conjunctions instead. AI-generated writing leans heavily on em dashes; actively avoid this.
- **Quote YAML frontmatter values.** Always wrap `title` and other string fields in double quotes, especially when they contain colons. Unquoted colons break YAML parsing.

## What to Avoid

- **Lecture tone** — "You should...", "The key insight here is...", "It's important to note..."
- **Takeaway wrap-ups** — Don't end with "This is a game changer" or "I can see this becoming..."
- **Over-explaining** — Trust the reader. If you mention tmux, you don't need to explain what tmux is.
- **Salesy framing** — Don't sell the tool or the experience. Just describe it.
- **Filler transitions** — "Let me tell you about...", "Here's the thing...", "What happened next was..."
- **Forced structure** — Don't add numbered steps or bold headers unless the content genuinely needs them.
- **Specific names, project details, or internal jargon** — Generalize where the specifics don't add value to the reader. "I had a product idea" not "a community recommendation directory for my housing society."
