# iOS Shortcut Setup for Digital Garden Capture

Capture content from your iPhone using the native Share Sheet.

## Quick Setup (5 minutes)

### Step 1: Create the Shortcut

1. Open the **Shortcuts** app on your iPhone
2. Tap **+** to create a new shortcut
3. Tap the shortcut name and rename it to **"Capture"**

### Step 2: Configure Share Sheet

1. Tap the **ⓘ** info button at the top
2. Enable **"Show in Share Sheet"**
3. Under "Share Sheet Types", select:
   - URLs
   - Text
   - Images (optional)
4. Tap **Done**

### Step 3: Add the Actions

Add these actions in order:

#### Action 1: Receive Input
- Action: **"Receive [URLs, Text, Images] from Share Sheet"**
- This is added automatically when you enable Share Sheet

#### Action 2: Set Variable for Input
- Add action: **"Set Variable"**
- Variable Name: `CapturedContent`
- Input: **Shortcut Input**

#### Action 3: Optional Comment Prompt
- Add action: **"Ask for Input"**
- Question: `Add a note? (optional)`
- Input Type: **Text**
- Default Answer: (leave empty)
- Add action: **"Set Variable"**
- Variable Name: `Comment`
- Input: **Provided Input**

#### Action 4: Build JSON Payload
- Add action: **"Text"**
- Enter this JSON (tap variable buttons to insert):
```json
{
  "text": "[CapturedContent]",
  "comment": "[Comment]",
  "source": "shortcut"
}
```

Replace `[CapturedContent]` and `[Comment]` with the actual variables by:
1. Tap where you want the variable
2. Tap "Select Variable"
3. Choose the variable

#### Action 5: Send to API
- Add action: **"Get Contents of URL"**
- URL: `https://yoursite.vercel.app/api/capture/ingest`
- Method: **POST**
- Headers:
  - `Authorization`: `Bearer YOUR_CAPTURE_API_KEY`
  - `Content-Type`: `application/json`
- Request Body: **File**
- File: Select the **Text** output from Action 4

#### Action 6: Show Notification
- Add action: **"Show Notification"**
- Title: `Captured!`
- Body: `Review at /admin/review`

### Step 4: Test It

1. Open Safari and navigate to any webpage
2. Tap the **Share** button
3. Scroll down and tap **"Capture"**
4. Optionally add a note
5. Should see "Captured!" notification

## Advanced: URL-Only Shortcut

For a simpler version that only captures URLs:

```
Receive [URLs] from Share Sheet
↓
Get Contents of URL
  URL: https://yoursite.vercel.app/api/capture/ingest
  Method: POST
  Headers:
    Authorization: Bearer YOUR_KEY
    Content-Type: application/json
  Body: {"url": "[Shortcut Input]", "source": "shortcut"}
↓
Show Notification "Captured!"
```

## Troubleshooting

### "Couldn't communicate with helper application"
- Check your API URL is correct
- Ensure HTTPS is used
- Verify your API key is correct

### Shortcut not appearing in Share Sheet
- Go to Settings → Shortcuts
- Ensure "Allow Running Scripts" is enabled
- Force quit and reopen the app you're sharing from

### Authorization errors
- Double-check your CAPTURE_API_KEY
- Make sure there are no extra spaces in the header

## Environment Variables Needed

In your Vercel project settings, ensure these are configured:

```
CAPTURE_API_KEY=your-secret-key-here
```

## Tips

1. **Add to Home Screen**: Long-press the shortcut → Add to Home Screen for quick access
2. **Siri**: Say "Hey Siri, Capture" while content is copied
3. **Back Tap**: iPhone Settings → Accessibility → Touch → Back Tap → Assign Capture
