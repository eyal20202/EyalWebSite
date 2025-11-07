import type { APIRoute } from 'astro';
import { getGitHubRepos } from '@lib/github';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get('username') || 'eyal20202';

    // Always try to get repos (will use fallback if API fails or no token)
    const repos = await getGitHubRepos(username);

    // Always return repos (even if fallback) with success status
    return new Response(JSON.stringify(repos), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200', // 24 hours
      },
    });
  } catch (error) {
    console.error('GitHub repos API error:', error);
    // Return fallback data even on error - no token needed!
    const { FALLBACK_REPOS } = await import('@lib/github');
    return new Response(JSON.stringify(FALLBACK_REPOS), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

