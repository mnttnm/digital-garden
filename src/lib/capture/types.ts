/**
 * Content Capture System Types
 *
 * Defines the schema for captures from various clients (Raycast, iOS Shortcut, Slack)
 * and the refined output after AI processing.
 */

export type CaptureSource = 'raycast' | 'shortcut' | 'slack' | 'api';
export type CaptureType = 'url' | 'text' | 'image' | 'mixed';
export type CaptureStatus = 'pending' | 'approved' | 'published' | 'rejected';
export type InferredCollection = 'til' | 'notes';
export type InferredNoteType = 'link' | 'thought' | 'essay' | 'snippet';

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

  // Status
  status: CaptureStatus;

  // Inferred content classification
  inferredCollection: InferredCollection;
  inferredNoteType?: InferredNoteType;

  // AI refinement (populated on-demand)
  refined?: RefinedCapture;

  // Publishing preference (set when approved)
  publishUseRefined?: boolean;
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
  text?: string;
  comment?: string;
  tags?: string[];
  inferredCollection?: InferredCollection;
  inferredNoteType?: InferredNoteType;
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
 * Result of transforming a capture to MDX
 */
export interface TransformResult {
  collection: InferredCollection;
  filename: string;
  frontmatter: TilFrontmatter | NoteFrontmatter;
  body: string;
  fullContent: string;
}
