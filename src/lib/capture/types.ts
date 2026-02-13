/**
 * Content Capture System Types
 *
 * Defines the schema for captures from various clients (Raycast, iOS Shortcut, Slack)
 * and the refined output after AI processing.
 */

export type CaptureSource = 'raycast' | 'shortcut' | 'slack' | 'api';
export type CaptureType = 'url' | 'text' | 'image' | 'mixed';
export type CaptureStatus = 'pending' | 'approved' | 'published' | 'rejected';
export type InferredCollection = 'til' | 'notes' | 'project-update';
export type InferredNoteType = 'link' | 'thought' | 'essay' | 'snippet';

/**
 * Activity type for project updates (matches projects schema)
 */
export type ProjectActivityType = 'update' | 'learning' | 'discovery' | 'milestone' | 'experiment' | 'fix';

/**
 * Activity entry for a project (matches projects schema)
 */
export interface ProjectActivityEntry {
  date: string;
  title: string;
  summary: string;
  tags: string[];
  type: ProjectActivityType;
  highlights?: string[];
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
  actionLabel?: string;
  actionUrl?: string;
  code?: string;
  codeLanguage?: string;
  links?: Array<{ label: string; url: string }>;
}

/**
 * Raw capture as received from capture clients
 */
export interface Capture {
  id: string;
  createdAt: string;
  source: CaptureSource;
  type: CaptureType;

  // Content fields
  url?: string;
  text?: string;
  comment?: string;
  images?: CaptureImage[];
  tags?: string[];

  // Project association (for project updates)
  project?: string;

  // Status
  status: CaptureStatus;

  // Inferred content classification
  inferredCollection: InferredCollection;
  inferredNoteType?: InferredNoteType;

  // AI refinement (populated on-demand)
  refined?: RefinedCapture;

  // Publishing preference (set when approved)
  publishUseRefined?: boolean;

  // Published content info (set after publishing)
  publishedSlug?: string;
  publishedCollection?: InferredCollection;
}

export interface CaptureImage {
  url: string;
  data?: string; // base64 for initial upload
}

/**
 * AI-refined version of a capture
 */
export interface RefinedCapture {
  title: string;
  body: string;
  takeaway?: string;
  suggestedTags: string[];
  suggestedType: InferredCollection;
  suggestedNoteType?: InferredNoteType;
  refinedAt: string;
}

/**
 * Input payload from capture clients
 */
export interface CaptureIngestPayload {
  url?: string;
  text?: string;
  comment?: string;
  imageBase64?: string;
  source: CaptureSource;
  tags?: string[];
  project?: string; // Project slug for project updates
}

/**
 * Response from ingest endpoint
 */
export interface CaptureIngestResponse {
  id: string;
  status: CaptureStatus;
}

/**
 * Parameters for updating a capture
 */
export interface CaptureUpdatePayload {
  text?: string;
  comment?: string;
  tags?: string[];
  inferredCollection?: InferredCollection;
  inferredNoteType?: InferredNoteType;
  publishUseRefined?: boolean;
}

/**
 * MDX frontmatter for different content types
 */
export interface TilFrontmatter {
  title: string;
  date: string;
  tags: string[];
  draft: boolean;
}

export interface NoteFrontmatter {
  title: string;
  date: string;
  tags: string[];
  type: InferredNoteType;
  link?: string;
  linkTitle?: string;
  takeaway?: string;
  featured: boolean;
  draft: boolean;
}

/**
 * Result of transforming a capture to MDX (for notes/TIL)
 */
export interface TransformResult {
  collection: 'til' | 'notes';
  filename: string;
  frontmatter: TilFrontmatter | NoteFrontmatter;
  body: string;
  fullContent: string;
}

/**
 * Result of transforming a capture to project activity
 */
export interface ProjectActivityTransformResult {
  collection: 'project-update';
  projectSlug: string;
  activity: ProjectActivityEntry;
  imageData?: string; // Base64 image data if present
}
