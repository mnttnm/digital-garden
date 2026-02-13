/**
 * GitHub Publishing
 *
 * Commits approved captures to the repository using GitHub API.
 * Triggers automatic Vercel deployment on push.
 */

import type { Capture } from './types';
import { transformCapture, getContentPath } from './transform';

interface GitHubConfig {
  token: string;
  repo: string;
  branch?: string;
}

interface CreateFileResponse {
  content: {
    sha: string;
    path: string;
    html_url: string;
  };
  commit: {
    sha: string;
    message: string;
  };
}

/**
 * Get GitHub configuration from environment
 */
function getGitHubConfig(): GitHubConfig {
  const token = import.meta.env.GITHUB_TOKEN;
  const repo = import.meta.env.GITHUB_REPO;

  if (!token || !repo) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO environment variables');
  }

  return {
    token,
    repo,
    branch: 'main',
  };
}

/**
 * Check if GitHub publishing is configured
 */
export function isGitHubConfigured(): boolean {
  return Boolean(import.meta.env.GITHUB_TOKEN && import.meta.env.GITHUB_REPO);
}

/**
 * Create or update a file in the repository
 */
async function createFile(
  config: GitHubConfig,
  path: string,
  content: string,
  message: string
): Promise<CreateFileResponse> {
  const url = `https://api.github.com/repos/${config.repo}/contents/${path}`;

  // Check if file already exists (for update)
  let existingSha: string | undefined;
  try {
    const checkResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      existingSha = existing.sha;
    }
  } catch {
    // File doesn't exist, that's fine
  }

  // Create/update the file
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch: config.branch || 'main',
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Publish an approved capture to the repository
 *
 * @param capture The capture to publish
 * @param useRefined Whether to use AI-refined content
 * @returns The commit SHA and file URL
 */
export async function publishCapture(
  capture: Capture,
  useRefined = true
): Promise<{ sha: string; url: string; path: string }> {
  const config = getGitHubConfig();

  // Transform capture to MDX
  const result = transformCapture(capture, useRefined);
  const path = getContentPath(result);

  // Generate commit message
  const collection = result.collection === 'til' ? 'TIL' : 'note';
  const title = result.frontmatter.title;
  const message = `content: add ${collection} "${title}"`;

  // Commit to GitHub
  const response = await createFile(config, path, result.fullContent, message);

  return {
    sha: response.commit.sha,
    url: response.content.html_url,
    path: response.content.path,
  };
}

/**
 * Preview what would be published without actually committing
 */
export function previewPublish(capture: Capture, useRefined = true): {
  path: string;
  content: string;
  message: string;
} {
  const result = transformCapture(capture, useRefined);
  const path = getContentPath(result);
  const collection = result.collection === 'til' ? 'TIL' : 'note';
  const title = result.frontmatter.title;
  const message = `content: add ${collection} "${title}"`;

  return {
    path,
    content: result.fullContent,
    message,
  };
}

/**
 * Batch publish multiple captures in a single commit
 * This triggers only ONE Vercel deployment regardless of item count
 */
export async function batchPublishCaptures(
  captures: Capture[],
  useRefined = true
): Promise<{ sha: string; filesAdded: number; ids: string[] }> {
  if (captures.length === 0) {
    throw new Error('No captures to publish');
  }

  const config = getGitHubConfig();
  const branch = config.branch || 'main';

  // Transform all captures to file entries
  const files = captures.map((capture) => {
    const result = transformCapture(capture, useRefined);
    const path = getContentPath(result);
    return {
      id: capture.id,
      path,
      content: result.fullContent,
      title: result.frontmatter.title,
    };
  });

  // Get the current commit SHA for the branch
  const refResponse = await fetch(
    `https://api.github.com/repos/${config.repo}/git/ref/heads/${branch}`,
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!refResponse.ok) {
    throw new Error(`Failed to get branch ref: ${refResponse.status}`);
  }

  const refData = await refResponse.json();
  const currentCommitSha = refData.object.sha;

  // Get the current commit's tree
  const commitResponse = await fetch(
    `https://api.github.com/repos/${config.repo}/git/commits/${currentCommitSha}`,
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!commitResponse.ok) {
    throw new Error(`Failed to get commit: ${commitResponse.status}`);
  }

  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // Create blobs for each file
  const treeEntries = await Promise.all(
    files.map(async (file) => {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${config.repo}/git/blobs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8',
          }),
        }
      );

      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob for ${file.path}`);
      }

      const blobData = await blobResponse.json();
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobData.sha,
      };
    })
  );

  // Create a new tree with the new files
  const treeResponse = await fetch(
    `https://api.github.com/repos/${config.repo}/git/trees`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeEntries,
      }),
    }
  );

  if (!treeResponse.ok) {
    throw new Error(`Failed to create tree: ${treeResponse.status}`);
  }

  const treeData = await treeResponse.json();

  // Create commit message
  const itemCount = files.length;
  const titles = files.slice(0, 3).map((f) => f.title);
  const message =
    itemCount === 1
      ? `content: add "${titles[0]}"`
      : `content: add ${itemCount} items\n\n${titles.map((t) => `- ${t}`).join('\n')}${itemCount > 3 ? `\n- ... and ${itemCount - 3} more` : ''}`;

  // Create the commit
  const newCommitResponse = await fetch(
    `https://api.github.com/repos/${config.repo}/git/commits`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [currentCommitSha],
      }),
    }
  );

  if (!newCommitResponse.ok) {
    throw new Error(`Failed to create commit: ${newCommitResponse.status}`);
  }

  const newCommitData = await newCommitResponse.json();

  // Update the branch reference
  const updateRefResponse = await fetch(
    `https://api.github.com/repos/${config.repo}/git/refs/heads/${branch}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: newCommitData.sha,
      }),
    }
  );

  if (!updateRefResponse.ok) {
    throw new Error(`Failed to update ref: ${updateRefResponse.status}`);
  }

  return {
    sha: newCommitData.sha,
    filesAdded: files.length,
    ids: files.map((f) => f.id),
  };
}
