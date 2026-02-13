import {
  Clipboard,
  getPreferenceValues,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";

interface Preferences {
  captureApiUrl: string;
  captureApiKey: string;
}

export default async function QuickCaptureCommand() {
  const preferences = getPreferenceValues<Preferences>();

  try {
    // Read clipboard
    const content = await Clipboard.readText();

    if (!content?.trim()) {
      await showHUD("Nothing to capture - clipboard is empty");
      return;
    }

    const trimmedContent = content.trim();

    // Detect if content is a URL
    let url: string | undefined;
    let text: string | undefined;

    try {
      new URL(trimmedContent);
      url = trimmedContent;
    } catch {
      text = trimmedContent;
    }

    // Send to capture API
    const response = await fetch(`${preferences.captureApiUrl}/api/capture/ingest`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${preferences.captureApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        text,
        source: "raycast",
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      throw new Error(data.error || "Failed to capture");
    }

    await showHUD("Captured! Review at /admin/review");
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Capture Failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
