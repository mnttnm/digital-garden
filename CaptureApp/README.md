# Digital Garden Capture - Native macOS App

A native SwiftUI macOS app for capturing content to your digital garden, replicating the full functionality of the Raycast extension.

## Features

- **Full Capture Form**: Content, notes, tags, project selection, code snippets
- **Clipboard Integration**: Auto-fills from clipboard (text, URLs, images)
- **Media Support**: Add/upload images and videos via file picker
- **Project Updates**: Select projects and activity types
- **Code Snippets**: Include code with syntax highlighting language selection
- **Global Keyboard Shortcut**: `Cmd+Shift+C` from anywhere
- **Secure Settings**: API key stored in macOS Keychain

## Setup Instructions

### Step 1: Create Xcode Project

1. Open **Xcode**
2. File → New → Project
3. Select **macOS** → **App**
4. Configure:
   - Product Name: `CaptureApp`
   - Team: Your team (or Personal Team)
   - Organization Identifier: `com.digitalgarden`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Uncheck "Include Tests"
5. Choose save location (e.g., your Downloads folder temporarily)

### Step 2: Replace Project Files

1. In Finder, navigate to the newly created Xcode project
2. Delete the auto-generated Swift files in the `CaptureApp` folder
3. Copy all `.swift` files from this `CaptureApp/CaptureApp/` folder into the Xcode project's `CaptureApp` folder
4. Copy the `Assets.xcassets` folder (replace existing)
5. Copy `Info.plist` and `CaptureApp.entitlements`

### Step 3: Configure Xcode Project

1. Select the project in the navigator
2. Select the `CaptureApp` target
3. **General** tab:
   - Deployment Target: macOS 13.0 or later
4. **Signing & Capabilities** tab:
   - Ensure signing is configured
   - Add capability: **Keychain Sharing** (for storing API key)
5. **Build Settings**:
   - Search for "Info.plist" and set Custom Info.plist path if needed

### Step 4: Add Files to Project

In Xcode:
1. Right-click on the CaptureApp folder in the navigator
2. Select "Add Files to CaptureApp"
3. Select all the Swift files and assets you copied
4. Ensure "Copy items if needed" is checked
5. Click Add

### Step 5: Build and Run

1. Press `Cmd+R` to build and run
2. The app will open with the capture form
3. Go to **CaptureApp → Settings** (or `Cmd+,`) to configure:
   - API URL: Your site URL (e.g., `https://yoursite.vercel.app`)
   - API Key: Your `CAPTURE_API_KEY`

### Step 6: Enable Global Keyboard Shortcut

For the `Cmd+Shift+C` global shortcut to work:

1. Open **System Settings**
2. Go to **Privacy & Security** → **Accessibility**
3. Click the lock to make changes
4. Add `CaptureApp` to the list and enable it

## Usage

### Opening the App

- **From Dock/Spotlight**: Launch like any app
- **Global Shortcut**: Press `Cmd+Shift+C` from anywhere (requires Accessibility permission)

### Capturing Content

1. **Content**: Paste a URL or type text
   - URLs are auto-detected and captured as resources
   - Plain text becomes a learning entry
2. **Add Media**: Click "Add Images or Videos" to select files
3. **Note**: Add your thoughts or commentary
4. **Project**: Select if this is a project update
   - Choose activity type (update, milestone, fix, etc.)
5. **Tags**: Add comma-separated tags
6. **Code**: Optionally include a code snippet with language
7. **Submit**: Press `Cmd+Return` or click "Capture"

### Clipboard Auto-Fill

When you open the app, it automatically:
- Detects text/URLs in clipboard and fills the Content field
- Detects images in clipboard and adds them to Media

## Project Structure

```
CaptureApp/
├── CaptureApp.swift        # App entry point, global hotkey
├── ContentView.swift       # Main capture form UI
├── CaptureViewModel.swift  # Business logic
├── CaptureAPI.swift        # API client
├── ClipboardManager.swift  # Clipboard reading
├── Models.swift            # Data models
├── SettingsManager.swift   # Settings persistence
├── SettingsView.swift      # Settings UI
├── Info.plist
├── CaptureApp.entitlements
└── Assets.xcassets/
```

## API Compatibility

This app sends the same payload format as the Raycast extension:

```json
{
  "source": "shortcut",
  "url": "https://...",
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

## Troubleshooting

### "Capture Failed: Not configured"
- Open Settings (`Cmd+,`) and enter your API URL and key

### Global shortcut not working
- Grant Accessibility permission in System Settings
- Restart the app after granting permission

### Images not loading from clipboard
- Make sure the image is actually in the clipboard (try pasting in Preview first)
- Some apps use proprietary clipboard formats that may not be supported

### Build errors in Xcode
- Ensure you're using Xcode 15+ with macOS Sonoma SDK
- Check that all Swift files are added to the target (Target Membership checkbox)

## Creating a Distributable App

1. In Xcode, select **Product** → **Archive**
2. Once archived, click **Distribute App**
3. Choose **Copy App** for local use, or sign for distribution
4. The `.app` bundle can be copied to `/Applications`

## Alternative: Quick Apple Shortcut

For just quick capture (clipboard → API), you can also use a macOS Shortcut:

1. Open **Shortcuts** app
2. Create new shortcut
3. Add actions:
   - Get Clipboard
   - Get Contents of URL (POST to your API)
   - Show Notification
4. Assign a keyboard shortcut in Shortcuts settings

The native app provides the full form experience that the Shortcut cannot.
