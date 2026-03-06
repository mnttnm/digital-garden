/**
 * Content Capture System Types
 *
 * Defines the schema for captures from various clients (Raycast, iOS Shortcut, Slack)
 * and the refined output after AI processing.
 */

export type CaptureSource = 'raycast' | 'shortcut' | 'slack' | 'api';
export type CaptureStatus = 'pending' | 'approved' | 'published' | 'rejected';

// Content classification
export type DiscoveryKind = 'learning' | 'resource';
export type ActivityType = 'update' | 'milestone' | 'fix' | 'learning' | 'discovery' | 'experiment';

export interface CaptureImage {
  src: string;
  alt?: string;
  caption?: string;
  data?: string; // base64 for upload
}

export interface CaptureVideo {
  src: string;
  poster?: string;
  caption?: string;
  data?: string; // base64 for upload
}

/**
 * Raw capture as received from capture clients
 */
export interface Capture {
  id: string;
  createdAt: string;
  source: CaptureSource;
  status: CaptureStatus;

  // Content
  title?: string;
  url?: string;
  note?: string; // User's commentary (renamed from "text")

  // Classification
  kind: DiscoveryKind;
  projectSlug?: string; // If set, this is a project update
  activityType?: ActivityType; // Only for project updates

  // Media (arrays for consistency)
  images?: CaptureImage[];
  videos?: CaptureVideo[];
  code?: string;
  codeLanguage?: string;

  // Metadata
  tags?: string[];
  prompts?: string[]; // AI prompts used

  // AI refinement
  refined?: RefinedCapture;
  publishUseRefined?: boolean;

  // After publishing
  publishedSlug?: string;
}

/**
 * AI-refined version of a capture
 */
export interface RefinedCapture {
  title: string; // User's title (refined)
  linkTitle?: string; // Extracted page title from URL
  body: string;
  suggestedTags: string[];
  suggestedKind: DiscoveryKind;
  refinedAt: string;
  promptUsed: string; // Track the refinement prompt
}

/**
 * Input payload from capture clients
 */
export interface CaptureIngestPayload {
  url?: string;
  note?: string; // Renamed from "text"
  source: CaptureSource;
  tags?: string[];
  project?: string;
  activityType?: ActivityType; // Can set during capture

  // Media
  images?: Array<{
    data: string; // base64
    alt?: string;
    caption?: string;
  }>;
  videos?: Array<{
    data: string; // base64
    poster?: string;
    caption?: string;
  }>;
  code?: string;
  codeLanguage?: string;
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
  title?: string;
  note?: string;
  tags?: string[];
  url?: string;
  images?: CaptureImage[];
  videos?: CaptureVideo[];
  code?: string;
  codeLanguage?: string;
  kind?: DiscoveryKind;
  activityType?: ActivityType;
  publishUseRefined?: boolean;
}

/**
 * MDX frontmatter for discoveries collection
 */
export interface DiscoveryFrontmatter {
  title: string;
  date: string;
  kind: DiscoveryKind;
  tags: string[];
  url?: string;
  linkTitle?: string;
  images: Array<{ src: string; alt?: string; caption?: string }>;
  videos: Array<{ src: string; poster?: string; caption?: string }>;
  code?: string;
  codeLanguage?: string;
  prompts: string[];
  draft: boolean;
}

/**
 * Activity entry for a project (matches projects schema)
 */
export interface ProjectActivityEntry {
  date: string;
  title: string;
  summary: string;
  tags: string[];
  activityType: ActivityType;
  images: Array<{ src: string; alt?: string; caption?: string }>;
  videos: Array<{ src: string; poster?: string; caption?: string }>;
  code?: string;
  codeLanguage?: string;
  url?: string;
  actionLabel?: string;
  actionUrl?: string;
  prompts: string[];
}

/**
 * Result of transforming a capture to MDX (for discoveries)
 */
export interface TransformResult {
  collection: 'discoveries';
  filename: string;
  frontmatter: DiscoveryFrontmatter;
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
