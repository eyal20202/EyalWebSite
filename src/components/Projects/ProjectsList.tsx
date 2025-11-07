import { useState, useEffect, useMemo } from 'react';
import type { GitHubRepo } from '@lib/github';
import ProjectCard from './ProjectCard';

interface ProjectsListProps {
  username?: string;
}

export default function ProjectsList({ username = 'YOUR_GITHUB_USERNAME' }: ProjectsListProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stars' | 'updated'>('updated');

  useEffect(() => {
    async function fetchRepos() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/github-repos?username=${username}`);
        
        const data: GitHubRepo[] = await response.json();
        
        // Check if we got valid data (even if it's fallback)
        if (Array.isArray(data) && data.length > 0) {
          setRepos(data);
          setError(null);
        } else {
          // If no repos, show fallback message but don't treat as error
          setRepos([]);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching repos:', err);
        // Don't show error - use fallback data instead
        setError(null);
        // Try to get fallback repos
        const { FALLBACK_REPOS } = await import('@lib/github');
        setRepos(FALLBACK_REPOS);
      } finally {
        setLoading(false);
      }
    }

    if (username && username !== 'YOUR_GITHUB_USERNAME') {
      fetchRepos();
    } else {
      // Use fallback data if no username
      const loadFallback = async () => {
        try {
          const { FALLBACK_REPOS } = await import('@lib/github');
          setRepos(FALLBACK_REPOS);
        } catch (err) {
          console.error('Error loading fallback repos:', err);
        } finally {
          setLoading(false);
        }
      };
      loadFallback();
    }
  }, [username]);

  const languages = useMemo(
    () => Array.from(new Set(repos.map((repo) => repo.language).filter(Boolean))) as string[],
    [repos]
  );

  const filteredAndSortedRepos = repos
    .filter((repo) => {
      if (filter === 'all') return true;
      return repo.language === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'stars') {
        return b.stargazers_count - a.stargazers_count;
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const skeletonState = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="card animate-pulse space-y-4">
          <div className="h-3 w-28 bg-white/10 rounded-full"></div>
          <div className="h-6 w-3/4 bg-white/10 rounded-full"></div>
          <div className="h-6 w-full bg-white/10 rounded-full"></div>
          <div className="flex gap-2">
            <span className="h-6 w-16 bg-white/10 rounded-full"></span>
            <span className="h-6 w-12 bg-white/10 rounded-full"></span>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return skeletonState;
  }

  if (error) {
    return (
      <div className="glass-panel p-10 text-center text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="glass-panel p-10 text-center text-sm text-gray-300">
        לא נמצאו פרויקטים להצגה.
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-10 glass-panel border border-white/10 p-6 rounded-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35rem] text-primary-200">Repos</p>
            <h3 className="text-lg font-semibold text-white mt-1">סינון פרויקטים לפי טכנולוגיה</h3>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setSortBy('updated')}
              className={`px-3 py-2 rounded-full border border-white/10 transition-colors ${
                sortBy === 'updated' ? 'bg-primary-500/30 text-primary-100' : 'text-gray-300 hover:text-primary-100'
              }`}
            >
              עדכונים אחרונים
            </button>
            <button
              onClick={() => setSortBy('stars')}
              className={`px-3 py-2 rounded-full border border-white/10 transition-colors ${
                sortBy === 'stars' ? 'bg-brand-500/30 text-primary-100' : 'text-gray-300 hover:text-primary-100'
              }`}
            >
              פופולריות
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm border border-white/10 transition-colors ${
              filter === 'all' ? 'bg-white/10 text-primary-100' : 'text-gray-400 hover:text-primary-100'
            }`}
          >
            הכל
          </button>
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setFilter(lang ?? 'all')}
              className={`px-4 py-2 rounded-full text-sm border border-white/10 transition-colors ${
                filter === lang ? 'bg-primary-500/20 text-primary-100' : 'text-gray-400 hover:text-primary-100'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedRepos.map((repo) => (
          <ProjectCard key={repo.id} repo={repo} />
        ))}
      </div>

      {filteredAndSortedRepos.length === 0 && (
        <div className="glass-panel p-10 text-center text-sm text-gray-300">
          לא נמצאו פרויקטים עם השפה שנבחרה.
        </div>
      )}
    </div>
  );
}

