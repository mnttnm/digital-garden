# Digital Garden Capture - Raycast Extension

A Raycast extension for quickly capturing content to your digital garden.

## Features

- **Capture Content**: Open form with auto-filled clipboard, add comments and tags
- **Quick Capture**: One-keystroke capture of clipboard content (no UI)

## Installation

### Local Development

1. Clone this repository
2. Run `npm install`
3. Run `npm run dev` to start development mode
4. The extension will appear in Raycast

### Publishing to Raycast Store

```bash
npm run publish
```

## Configuration

After installing, configure the extension in Raycast preferences:

1. **API URL**: Your site URL (e.g., `https://yoursite.vercel.app`)
2. **API Key**: Your `CAPTURE_API_KEY` from environment variables

## Usage

### Capture Content (Cmd+Space → "capture")

1. Copy a URL or text to clipboard
2. Open Raycast and type "capture"
3. Content is auto-filled from clipboard
4. Optionally add a comment and tags
5. Press Enter to capture

### Quick Capture (Set custom hotkey)

1. Copy content to clipboard
2. Press your assigned hotkey
3. Content is captured immediately
4. HUD notification confirms capture

## Keyboard Shortcuts

Assign custom hotkeys in Raycast preferences for instant access.

Recommended:
- **Capture Content**: `Cmd + Shift + C`
- **Quick Capture**: `Cmd + Ctrl + C`
