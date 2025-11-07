export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
  homepage: string | null;
}

// Fallback projects data when GitHub API is unavailable
export const FALLBACK_REPOS: GitHubRepo[] = [
  {
    id: 1,
    name: 'final-project',
    full_name: 'eyal20202/final-project',
    description: 'Full-stack application with React frontend and Node.js backend',
    html_url: 'https://github.com/eyal20202/final-project',
    language: 'JavaScript',
    stargazers_count: 12,
    forks_count: 3,
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    topics: ['react', 'nodejs', 'fullstack'],
    homepage: null,
  },
  {
    id: 2,
    name: 'BiznessInSN',
    full_name: 'eyal20202/BiznessInSN',
    description: 'Business networking platform built with React and Express',
    html_url: 'https://github.com/eyal20202/BiznessInSN',
    language: 'JavaScript',
    stargazers_count: 8,
    forks_count: 2,
    updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    topics: ['react', 'express', 'mongodb'],
    homepage: null,
  },
  {
    id: 3,
    name: 'LibaryBooksReact',
    full_name: 'eyal20202/LibaryBooksReact',
    description: 'Library management system with React and Spring Boot',
    html_url: 'https://github.com/eyal20202/LibaryBooksReact',
    language: 'JavaScript',
    stargazers_count: 15,
    forks_count: 5,
    updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    topics: ['react', 'spring-boot', 'java'],
    homepage: null,
  },
  {
    id: 4,
    name: 'MoviesReactNative',
    full_name: 'eyal20202/MoviesReactNative',
    description: 'Mobile app for movie discovery built with React Native',
    html_url: 'https://github.com/eyal20202/MoviesReactNative',
    language: 'JavaScript',
    stargazers_count: 20,
    forks_count: 7,
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    topics: ['react-native', 'mobile', 'typescript'],
    homepage: null,
  },
  {
    id: 5,
    name: 'DogsAndCats',
    full_name: 'eyal20202/DogsAndCats',
    description: 'Image classification app using machine learning',
    html_url: 'https://github.com/eyal20202/DogsAndCats',
    language: 'Java',
    stargazers_count: 6,
    forks_count: 1,
    updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    topics: ['java', 'machine-learning', 'android'],
    homepage: null,
  },
];

export async function getGitHubRepos(username: string): Promise<GitHubRepo[]> {
  try {
    const token = import.meta.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`,
      { headers }
    );

    if (!response.ok) {
      console.warn(`GitHub API error: ${response.status}. Using fallback data.`);
      return FALLBACK_REPOS;
    }

    const repos: GitHubRepo[] = await response.json();

    // Filter out forks and archived repos (optional)
    const filtered = repos.filter(
      (repo) => !repo.name.includes('fork') && !repo.name.includes('archived')
    );

    // Return filtered repos or fallback if empty
    return filtered.length > 0 ? filtered : FALLBACK_REPOS;
  } catch (error) {
    console.warn('Error fetching GitHub repos, using fallback data:', error);
    return FALLBACK_REPOS;
  }
}

export async function getFeaturedRepos(
  username: string,
  featuredTopics: string[] = []
): Promise<GitHubRepo[]> {
  const repos = await getGitHubRepos(username);
  
  if (featuredTopics.length === 0) {
    // Return top starred repos
    return repos
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6);
  }

  // Filter by featured topics
  return repos
    .filter((repo) =>
      repo.topics.some((topic) => featuredTopics.includes(topic))
    )
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6);
}

