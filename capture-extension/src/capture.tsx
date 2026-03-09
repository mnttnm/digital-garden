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
  note: string;
  tags: string;
  project: string;
  customProject: string;
  activityType: string;
  code: string;
  codeLanguage: string;
}

interface ProjectItem {
  slug: string;
  title: string;
}

// Fallback projects if API is unavailable
const FALLBACK_PROJECTS: ProjectItem[] = [
  { slug: "digital-garden", title: "learning.log" },
  { slug: "business-co-pilot-system", title: "Business Co-Pilot System" },
  { slug: "shopify-furniture-store", title: "Shopify Furniture Store" },
];

const CUSTOM_PROJECT_VALUE = "__custom__";

// Activity types for project updates
const ACTIVITY_TYPES = [
  { value: "", title: "Default (update)" },
  { value: "update", title: "Update" },
  { value: "milestone", title: "Milestone" },
  { value: "fix", title: "Fix" },
  { value: "learning", title: "Learning" },
  { value: "discovery", title: "Discovery" },
  { value: "experiment", title: "Experiment" },
];

// Common code languages
const CODE_LANGUAGES = [
  { value: "", title: "None" },
  { value: "typescript", title: "TypeScript" },
  { value: "javascript", title: "JavaScript" },
  { value: "python", title: "Python" },
  { value: "ruby", title: "Ruby" },
  { value: "go", title: "Go" },
  { value: "rust", title: "Rust" },
  { value: "bash", title: "Bash" },
  { value: "css", title: "CSS" },
  { value: "html", title: "HTML" },
  { value: "json", title: "JSON" },
  { value: "yaml", title: "YAML" },
  { value: "markdown", title: "Markdown" },
  { value: "sql", title: "SQL" },
  { value: "swift", title: "Swift" },
];

// Media file extensions
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"];

function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function isVideoFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return VIDEO_EXTENSIONS.includes(ext);
}

function fileToBase64(filePath: string, type: "image" | "video"): string | null {
  try {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().replace(".", "");
    const mimeType = type === "image"
      ? (ext === "jpg" ? "jpeg" : ext)
      : ext;
    const mimePrefix = type === "image" ? "image" : "video";
    return `data:${mimePrefix}/${mimeType};base64,${buffer.toString("base64")}`;
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
      const base64 = fileToBase64(tempPath, "image");
      // Clean up temp file
      try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
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

interface MediaItem {
  data: string;
  name: string;
  type: "image" | "video";
}

export default function CaptureCommand() {
  const preferences = getPreferenceValues<Preferences>();

  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState<ProjectItem[]>(FALLBACK_PROJECTS);

  // Fetch projects from API
  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch(`${preferences.captureApiUrl}/api/capture/projects`);
        if (response.ok) {
          const data = (await response.json()) as { projects: ProjectItem[] };
          if (data.projects && data.projects.length > 0) {
            setProjects(data.projects);
          }
        }
      } catch {
        // Use fallback projects
      }
    }
    fetchProjects();
  }, [preferences.captureApiUrl]);

  // Auto-fill from clipboard (text or image)
  useEffect(() => {
    async function loadClipboard() {
      try {
        const clipboardContent = await Clipboard.read();

        // Check for image file first
        if (clipboardContent.file && isImageFile(clipboardContent.file)) {
          const base64 = fileToBase64(clipboardContent.file, "image");
          if (base64) {
            setMediaItems([{
              data: base64,
              name: path.basename(clipboardContent.file),
              type: "image",
            }]);
            setContent("");
            return;
          }
        }

        // Check if text looks like image placeholder (e.g., "Image (766x695)")
        if (clipboardContent.text && looksLikeImagePlaceholder(clipboardContent.text)) {
          // Try to extract actual image data from clipboard
          const base64 = getClipboardImageAsBase64();
          if (base64) {
            setMediaItems([{
              data: base64,
              name: "Clipboard image",
              type: "image",
            }]);
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
    // Validate - need either text content or media
    if (!values.content?.trim() && !values.note?.trim() && mediaItems.length === 0) {
      showToast({
        style: Toast.Style.Failure,
        title: "Content Required",
        message: "Please enter some content, a note, or add media",
      });
      return;
    }

    // Validate custom project if selected
    if (values.project === CUSTOM_PROJECT_VALUE && !values.customProject?.trim()) {
      showToast({
        style: Toast.Style.Failure,
        title: "Project Slug Required",
        message: "Please enter a project slug or select a different project",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Detect if content is a URL
      let url: string | undefined;
      let noteContent: string | undefined;

      const trimmedContent = values.content?.trim() || "";
      if (trimmedContent) {
        try {
          new URL(trimmedContent);
          url = trimmedContent;
        } catch {
          // Not a URL, treat as note content
          noteContent = trimmedContent;
        }
      }

      // Combine note field with any non-URL content
      const fullNote = [noteContent, values.note?.trim()]
        .filter(Boolean)
        .join("\n\n") || undefined;

      // Parse tags
      const tags = values.tags
        ? values.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
        : undefined;

      // Build images and videos arrays
      const images = mediaItems
        .filter((m) => m.type === "image")
        .map((m) => ({ data: m.data }));

      const videos = mediaItems
        .filter((m) => m.type === "video")
        .map((m) => ({ data: m.data }));

      // Determine project slug
      const projectSlug = values.project === CUSTOM_PROJECT_VALUE
        ? values.customProject?.trim()
        : values.project || undefined;

      // Build request body matching CaptureIngestPayload
      const body: Record<string, unknown> = {
        source: "raycast",
        note: fullNote,
        tags,
        project: projectSlug,
        activityType: values.activityType || undefined,
      };

      if (url) body.url = url;
      if (images.length > 0) body.images = images;
      if (videos.length > 0) body.videos = videos;
      if (values.code?.trim()) body.code = values.code.trim();
      if (values.codeLanguage) body.codeLanguage = values.codeLanguage;

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
        message: mediaItems.length > 0
          ? `${mediaItems.length} media file(s) captured`
          : "Review at /admin/review",
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

  function handleFilesSelected(files: string[]) {
    const newMedia: MediaItem[] = [];

    for (const file of files) {
      if (isImageFile(file)) {
        const base64 = fileToBase64(file, "image");
        if (base64) {
          newMedia.push({
            data: base64,
            name: path.basename(file),
            type: "image",
          });
        }
      } else if (isVideoFile(file)) {
        const base64 = fileToBase64(file, "video");
        if (base64) {
          newMedia.push({
            data: base64,
            name: path.basename(file),
            type: "video",
          });
        }
      }
    }

    if (newMedia.length > 0) {
      setMediaItems((prev) => [...prev, ...newMedia]);
    }
  }

  function clearMedia() {
    setMediaItems([]);
  }

  const mediaDescription = mediaItems.length > 0
    ? mediaItems.map((m) => `${m.type === "image" ? "📷" : "🎬"} ${m.name}`).join(", ")
    : null;

  const isProjectSelected = selectedProject && selectedProject !== "";
  const isCustomProject = selectedProject === CUSTOM_PROJECT_VALUE;

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Capture" onSubmit={handleSubmit} />
          {mediaItems.length > 0 && (
            <Action
              title="Clear All Media"
              onAction={clearMedia}
              shortcut={{ modifiers: ["cmd"], key: "d" }}
            />
          )}
        </ActionPanel>
      }
    >
      {mediaDescription && (
        <Form.Description
          title="Media"
          text={`${mediaDescription} (Cmd+D to clear)`}
        />
      )}

      <Form.TextArea
        id="content"
        title="Content"
        placeholder="URL or text to capture"
        value={content}
        onChange={setContent}
        info="Paste a URL or enter text. URLs are auto-detected."
      />

      <Form.FilePicker
        id="mediaFiles"
        title="Add Media"
        allowMultipleSelection={true}
        canChooseDirectories={false}
        canChooseFiles={true}
        onChange={handleFilesSelected}
      />

      <Form.TextArea
        id="note"
        title="Note"
        placeholder="Your thoughts about this..."
        info="Commentary that will be included with the capture"
      />

      <Form.Separator />

      <Form.Dropdown
        id="project"
        title="Project"
        info="Select if this is a project update"
        value={selectedProject}
        onChange={setSelectedProject}
      >
        <Form.Dropdown.Item value="" title="None (not a project update)" />
        {projects.map((p) => (
          <Form.Dropdown.Item key={p.slug} value={p.slug} title={p.title} />
        ))}
        <Form.Dropdown.Item value={CUSTOM_PROJECT_VALUE} title="Custom (enter slug)..." />
      </Form.Dropdown>

      {isCustomProject && (
        <Form.TextField
          id="customProject"
          title="Project Slug"
          placeholder="my-project-slug"
          info="Enter the project slug (folder name in src/content/projects/)"
        />
      )}

      {isProjectSelected && (
        <Form.Dropdown
          id="activityType"
          title="Activity Type"
          info="Type of project activity"
        >
          {ACTIVITY_TYPES.map((t) => (
            <Form.Dropdown.Item key={t.value} value={t.value} title={t.title} />
          ))}
        </Form.Dropdown>
      )}

      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="ai, productivity, web-dev"
        info="Comma-separated tags"
      />

      <Form.Separator />

      <Form.TextArea
        id="code"
        title="Code Snippet"
        placeholder="Paste code here..."
        info="Optional code to include"
      />

      <Form.Dropdown
        id="codeLanguage"
        title="Code Language"
      >
        {CODE_LANGUAGES.map((l) => (
          <Form.Dropdown.Item key={l.value} value={l.value} title={l.title} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
