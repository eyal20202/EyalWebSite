import type { GitHubRepo } from '@lib/github';

interface ProjectCardProps {
  repo: GitHubRepo;
}

export default function ProjectCard({ repo }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'long',
    }).format(new Date(dateString));
  };

  return (
    <div className="card hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-white">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-300 transition-colors"
          >
            {repo.name}
          </a>
        </h3>
        {repo.language && (
          <span className="px-3 py-1 bg-primary-500/20 border border-primary-500/30 rounded-full text-xs text-primary-200">
            {repo.language}
          </span>
        )}
      </div>

      {repo.description && (
        <p className="text-gray-300 mb-4 line-clamp-3 leading-relaxed">
          {repo.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm mb-4">
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-gray-300">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {repo.stargazers_count}
          </span>
          <span className="flex items-center gap-1 text-gray-300">
            <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
            </svg>
            {repo.forks_count}
          </span>
        </div>
        <time className="text-gray-400">{formatDate(repo.updated_at)}</time>
      </div>

      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {repo.topics.slice(0, 5).map((topic) => (
            <span
              key={topic}
              className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-primary-200"
            >
              #{topic}
            </span>
          ))}
        </div>
      )}

      {repo.homepage && (
        <a
          href={repo.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-primary-300 hover:text-primary-200 transition-colors text-sm font-medium"
        >
          צפה בפרויקט
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </div>
  );
}

