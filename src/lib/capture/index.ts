/**
 * Content Capture System
 *
 * A modular system for capturing content from multiple clients
 * (Raycast, iOS Shortcut, Slack) and publishing to the digital garden.
 */

// Types
export type {
  Capture,
  CaptureSource,
  CaptureType,
  CaptureStatus,
  CaptureImage,
  CaptureIngestPayload,
  CaptureIngestResponse,
  CaptureUpdatePayload,
  RefinedCapture,
  InferredCollection,
  InferredNoteType,
  TransformResult,
  TilFrontmatter,
  NoteFrontmatter,
} from './types';

// Store operations
export {
  createCapture,
  getCapture,
  listCaptures,
  updateCapture,
  updateCaptureStatus,
  storeRefinement,
  deleteCapture,
  getCaptureCount,
  getApprovedCaptures,
  markAsPublished,
} from './store';

// AI refinement
export {
  refineCapture,
  generateFallbackTitle,
} from './refine';

// Transform to MDX
export {
  transformCapture,
  getContentPath,
} from './transform';

// GitHub publishing
export {
  publishCapture,
  previewPublish,
  batchPublishCaptures,
  isGitHubConfigured,
} from './publish';

// AI providers
export {
  getAIModel,
  isAIConfigured,
} from './providers';
