import {
  Action,
  ActionPanel,
  Clipboard,
  Form,
  getPreferenceValues,
  showToast,
  Toast,
  popToRoot,
} from "@raycast/api";
import { useState, useEffect } from "react";

interface Preferences {
  captureApiUrl: string;
  captureApiKey: string;
}

interface FormValues {
  content: string;
  comment: string;
  tags: string;
}

export default function CaptureCommand() {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Auto-fill from clipboard
  useEffect(() => {
    async function loadClipboard() {
      try {
        const text = await Clipboard.readText();
        if (text) {
          setContent(text);
        }
      } catch {
        // Clipboard might be empty or inaccessible
      } finally {
        setIsLoading(false);
      }
    }
    loadClipboard();
  }, []);

  async function handleSubmit(values: FormValues) {
    const preferences = getPreferenceValues<Preferences>();

    // Validate
    if (!values.content.trim()) {
      showToast({
        style: Toast.Style.Failure,
        title: "Content Required",
        message: "Please enter some content to capture",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Detect if content is a URL
      let url: string | undefined;
      let text: string | undefined;

      const trimmedContent = values.content.trim();
      try {
        new URL(trimmedContent);
        url = trimmedContent;
      } catch {
        text = trimmedContent;
      }

      // Parse tags
      const tags = values.tags
        ? values.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
        : undefined;

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
          comment: values.comment || undefined,
          tags,
          source: "raycast",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to capture");
      }

      showToast({
        style: Toast.Style.Success,
        title: "Captured!",
        message: "Review at /admin/review",
      });

      popToRoot();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Capture Failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Capture" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="content"
        title="Content"
        placeholder="URL or text to capture"
        value={content}
        onChange={setContent}
        info="Paste a URL or enter text. Clipboard content is auto-filled."
      />
      <Form.TextArea
        id="comment"
        title="Comment"
        placeholder="Optional: Add your thoughts..."
        info="Your commentary about this content"
      />
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="ai, productivity, web-dev"
        info="Comma-separated tags (optional)"
      />
    </Form>
  );
}
