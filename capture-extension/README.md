# Digital Garden Capture (Raycast)

Raycast extension for sending URLs, text, and images to the Digital Garden capture queue.

## What It Does

- `Capture Content` (UI): review/edit content before sending.
- `Quick Capture` (no UI): send clipboard text/URL immediately.

Both commands call:

- `POST {captureApiUrl}/api/capture/ingest`

## Requirements

- Raycast installed
- Digital Garden backend deployed and reachable
- `CAPTURE_API_KEY` configured in the backend

## Setup

1. In this folder, install dependencies:
   ```bash
   npm install
   ```
2. Start extension dev mode:
   ```bash
   npm run dev
   ```
3. In Raycast preferences for this extension, set:
   - `API URL`: e.g. `https://your-site.vercel.app`
   - `API Key`: value of backend `CAPTURE_API_KEY`

## Request Payload

The extension sends JSON like:

```json
{
  "source": "raycast",
  "url": "https://example.com",
  "note": "your commentary or learning",
  "tags": ["ai", "productivity"],
  "project": "optional-project-slug",
  "activityType": "update",
  "images": [{ "data": "base64...", "alt": "description" }]
}
```

At least one of `url`, `note`, or `images` must be present.

**Fields:**

- `note`: Your commentary (renamed from `text`)
- `project`: Links to a project, turns this into a project activity
- `activityType`: For project updates: `update`, `milestone`, `fix`, `learning`, `discovery`, `experiment`
- Content is classified as `kind: 'learning' | 'resource'` (inferred from URL presence)

## Recommended Hotkeys

- `Capture Content`: `Cmd + Shift + C`
- `Quick Capture`: `Cmd + Ctrl + C`

## Troubleshooting

- `401 Unauthorized`: API key mismatch or missing `Authorization` header.
- `Failed to capture`: verify `API URL` points to deployed backend and `/api/capture/ingest` is reachable.
- Image not captured from clipboard: try selecting a file with the `Image File` field.

## Related Docs

- Root project guide: [`../README.md`](../README.md)
- System architecture: [`../docs/architecture.md`](../docs/architecture.md)
- Capture backend reference: [`../docs/capture-system-plan.md`](../docs/capture-system-plan.md)
