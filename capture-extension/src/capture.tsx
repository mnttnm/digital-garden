import {
  Action,
  ActionPanel,
  Clipboard,
  Form,
  getPreferenceValues,
  showToast,
  Toast,
  popToRoot,
  environment,
} from "@raycast/api";
import { useState, useEffect } from "react";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface Preferences {
  captureApiUrl: string;
  captureApiKey: string;
}

interface FormValues {
  content: string;
  comment: string;
  tags: string;
  project: string;
}

// Known projects - add new projects here as they're created
const PROJECTS = [
  { value: "", title: "None (not a project update)" },
  { value: "digital-garden", title: "learning.log (Digital Garden)" },
  { value: "business-co-pilot-claude-code", title: "Business Co-Pilot" },
];

// Image file extensions we support
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function fileToBase64(filePath: string): string | null {
  try {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    const mimeType = ext === "jpg" ? "jpeg" : ext;
    return `data:image/${mimeType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

// Try to extract image from clipboard using macOS osascript
function getClipboardImageAsBase64(): string | null {
  try {
    // Create temp file path
    const tempPath = path.join(environment.supportPath, `clipboard-${Date.now()}.png`);

    // Use osascript to save clipboard image to temp file
    const script = `
      set theFile to POSIX file "${tempPath}"
      try
        set imgData to the clipboard as «class PNGf»
        set fileRef to open for access theFile with write permission
        write imgData to fileRef
        close access fileRef
        return "success"
      on error
        return "no image"
      end try
    `;

    const result = execSync(`osascript -e '${script}'`, { encoding: "utf-8" }).trim();

    if (result === "success" && fs.existsSync(tempPath)) {
      const base64 = fileToBase64(tempPath);
      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch {}
      return base64;
    }
    return null;
  } catch {
    return null;
  }
}

// Check if text looks like a clipboard image placeholder
function looksLikeImagePlaceholder(text: string): boolean {
  return /^Image\s*\(\d+x\d+\)$/i.test(text.trim());
}

export default function CaptureCommand() {
  const [content, setContent] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-fill from clipboard (text or image)
  useEffect(() => {
    async function loadClipboard() {
      try {
        const clipboardContent = await Clipboard.read();

        // Check for image file first
        if (clipboardContent.file && isImageFile(clipboardContent.file)) {
          const base64 = fileToBase64(clipboardContent.file);
          if (base64) {
            setImageBase64(base64);
            setImageName(path.basename(clipboardContent.file));
            setContent("");
            return;
          }
        }

        // Check if text looks like image placeholder (e.g., "Image (766x695)")
        if (clipboardContent.text && looksLikeImagePlaceholder(clipboardContent.text)) {
          // Try to extract actual image data from clipboard
          const base64 = getClipboardImageAsBase64();
          if (base64) {
            setImageBase64(base64);
            setImageName("Clipboard image");
            setContent("");
            return;
          }
        }

        // Fall back to text
        if (clipboardContent.text) {
          setContent(clipboardContent.text);
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

    // Validate - need either text content or image
    if (!values.content?.trim() && !imageBase64) {
      showToast({
        style: Toast.Style.Failure,
        title: "Content Required",
        message: "Please enter some content or copy an image",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Detect if content is a URL
      let url: string | undefined;
      let text: string | undefined;

      const trimmedContent = values.content?.trim() || "";
      if (trimmedContent) {
        try {
          new URL(trimmedContent);
          url = trimmedContent;
        } catch {
          text = trimmedContent;
        }
      }

      // Parse tags
      const tags = values.tags
        ? values.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
        : undefined;

      // Build request body
      const body: Record<string, unknown> = {
        source: "raycast",
        comment: values.comment || undefined,
        tags,
        project: values.project || undefined,
      };

      if (url) body.url = url;
      if (text) body.text = text;
      if (imageBase64) body.imageBase64 = imageBase64;

      // Send to capture API
      const response = await fetch(`${preferences.captureApiUrl}/api/capture/ingest`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${preferences.captureApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to capture");
      }

      showToast({
        style: Toast.Style.Success,
        title: "Captured!",
        message: imageBase64 ? "Image captured" : "Review at /admin/review",
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

  function clearImage() {
    setImageBase64(null);
    setImageName(null);
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Capture" onSubmit={handleSubmit} />
          {imageBase64 && (
            <Action title="Clear Image" onAction={clearImage} shortcut={{ modifiers: ["cmd"], key: "d" }} />
          )}
        </ActionPanel>
      }
    >
      {imageBase64 ? (
        <Form.Description
          title="Image"
          text={`📷 ${imageName || "Clipboard image"} (Cmd+D to clear)`}
        />
      ) : (
        <>
          <Form.TextArea
            id="content"
            title="Content"
            placeholder="URL or text to capture"
            value={content}
            onChange={setContent}
            info="Paste a URL or enter text. Or select an image file below."
          />
          <Form.FilePicker
            id="imageFile"
            title="Image File"
            allowMultipleSelection={false}
            canChooseDirectories={false}
            canChooseFiles={true}
            onChange={(files) => {
              if (files.length > 0 && isImageFile(files[0])) {
                const base64 = fileToBase64(files[0]);
                if (base64) {
                  setImageBase64(base64);
                  setImageName(path.basename(files[0]));
                }
              }
            }}
          />
        </>
      )}
      <Form.TextArea
        id="comment"
        title="Comment"
        placeholder="Optional: Add your thoughts..."
        info="Your commentary about this content"
      />
      <Form.Dropdown
        id="project"
        title="Project"
        info="Select a project if this is a project update"
      >
        {PROJECTS.map((p) => (
          <Form.Dropdown.Item key={p.value} value={p.value} title={p.title} />
        ))}
      </Form.Dropdown>
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="ai, productivity, web-dev"
        info="Comma-separated tags (optional)"
      />
    </Form>
  );
}
