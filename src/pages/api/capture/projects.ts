/**
 * Projects List Endpoint
 *
 * GET /api/capture/projects
 *
 * Returns list of projects for capture clients (Raycast, etc.)
 * No authentication required - project list is public info.
 */

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const projects = await getCollection('projects', ({ data }) => !data.draft);

    const projectList = projects.map((project) => ({
      slug: project.slug,
      title: project.data.title,
    }));

    // Sort alphabetically by title
    projectList.sort((a, b) => a.title.localeCompare(b.title));

    return new Response(
      JSON.stringify({ projects: projectList }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch projects', projects: [] }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
