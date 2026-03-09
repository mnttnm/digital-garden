# Digital Garden Capture (macOS) — CaptureApp

A native SwiftUI macOS app for capturing URLs, text, notes, tags, project updates, code snippets, and media into the Digital Garden capture queue.

Goal: **feature parity with (and eventually better than) the Raycast extension** in `capture-extension/`.

## What you get today

- Full capture form (content, note, tags, project + activity type, code snippet + language)
- Media attachments: add images + videos via file picker
- Clipboard auto-fill (text/URL, or image on clipboard)
- Fetches project list from the backend (falls back to a local list if unavailable)
- Global hotkey: `Cmd + Shift + C` brings the app to the front
- Settings UI (`Cmd + ,`) with API key stored in **macOS Keychain**

## Requirements

- macOS 13+
- Xcode 15+
- Homebrew (for `xcodegen`)
- A deployed Digital Garden backend with:
  - `POST /api/capture/ingest`
  - `GET /api/capture/projects`
  - `CAPTURE_API_KEY` configured on the backend

## Quick start (recommended)

This repo uses **XcodeGen** so you don’t have to manually create an Xcode project.

```bash
cd CaptureApp
./setup.sh
```

Then:

1. Open `CaptureApp/CaptureApp.xcodeproj`
2. Select the `CaptureApp` scheme
3. Build + run (`Cmd + R`)
4. Open Settings (`Cmd + ,`) and set:
   - **API URL**: e.g. `https://your-site.vercel.app`
   - **API Key**: your backend `CAPTURE_API_KEY`

## Usage

- Launch from Spotlight/Dock (the global hotkey works while the app is running)
- Global hotkey: `Cmd + Shift + C` brings the app to the front
- Submit: `Cmd + Return`
- Cancel: `Esc`

Tip: you can close the capture window — the app stays running in the menu bar so the hotkeys remain available.

### Clipboard behavior

On launch, the app attempts to auto-fill from the clipboard:

- Text / URL → fills the **Content** field
- Image → adds it as a media item

## Raycast parity checklist

This is the current “parity map” against `capture-extension/`.

Implemented in the macOS app:

- UI capture form (equivalent to Raycast `Capture Content`)
- Clipboard text/URL auto-fill
- Clipboard image auto-fill (best-effort)
- Attach image/video files from disk
- Tags, project selection, activity type
- Code snippet + language
- Fetch projects from `/api/capture/projects` (fallback list if not reachable)
- API key stored in Keychain (Raycast stores preferences)

Implemented in the macOS app (delight upgrades):

- Menu bar app stays running (invocable without keeping a window open)
- “Quick Capture” (no UI): `Cmd + Ctrl + C` sends clipboard immediately (toggle in Settings)
- Drag & drop media onto the window to attach
- Remembers last selected project/activity type/code language

Still to do (to be “better than Raycast”):

- Better clipboard-image extraction across apps (Raycast uses an `osascript` fallback for some placeholder cases)
- UX polish:
  - Inline validation + better error states
  - Better media previews (e.g. video thumbnails)
  - Drag from clipboard / paste media directly
- Optional: Launch at Login

If you want, we can turn this section into a concrete roadmap (with milestones) once we decide what “better than Raycast” means for you (menubar app? quick capture? screenshot capture?).

## API compatibility

The macOS app posts the same capture payload shape as the Raycast extension.

Example:

```json
{
  "source": "api",
  "url": "https://example.com",
  "note": "My thoughts",
  "tags": ["ai", "productivity"],
  "project": "project-slug",
  "activityType": "update",
  "code": "const x = 1;",
  "codeLanguage": "typescript",
  "images": [{ "data": "data:image/png;base64,..." }],
  "videos": [{ "data": "data:video/mp4;base64,..." }]
}
```

Notes:

- At least one of: `url`, `note`, `images`, `videos` must be present.
- `source` is currently set to `"api"` in the macOS app code.

## Project structure

```
CaptureApp/
  CaptureApp/
    CaptureApp.swift        # App entry point + global hotkey
    ContentView.swift       # Main capture form UI
    CaptureViewModel.swift  # Form state + payload building + submit
    CaptureAPI.swift        # /projects fetch + /ingest submit
    ClipboardManager.swift  # Clipboard reading
    Models.swift            # API + local models
    SettingsManager.swift   # UserDefaults + Keychain
    SettingsView.swift      # Settings UI
    Info.plist
    CaptureApp.entitlements
    Assets.xcassets/
  project.yml               # XcodeGen project definition
  setup.sh                  # Generates .xcodeproj via xcodegen
```

## Permissions (global hotkey)

The app uses a global key event monitor to detect `Cmd + Shift + C`.

If the hotkey doesn’t work:

1. Open **System Settings** → **Privacy & Security**
2. Check **Accessibility** and **Input Monitoring**
3. Enable `CaptureApp` if prompted
4. Quit + relaunch the app

## Troubleshooting

### “Not configured” / can’t submit

Open Settings (`Cmd + ,`) and set API URL + API key.

### 401 Unauthorized

Your API key doesn’t match the backend’s `CAPTURE_API_KEY`.

### Projects don’t load

The app will fall back to a small hardcoded list if `GET /api/capture/projects` fails.

## Build a distributable app

In Xcode:

1. Product → Archive
2. Distribute App → Copy App (for local use)
3. Copy the resulting `.app` to `/Applications`
