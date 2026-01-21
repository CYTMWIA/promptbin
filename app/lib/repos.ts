import { Repository } from './types';

export type { Repository };

const REPOS_KEY = 'promptbin-repos';
const DEFAULT_REPO_KEY = 'promptbin-default-repo';

export function getRepos(): Repository[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(REPOS_KEY);
  if (!saved) {
    const defaultLocal: Repository = {
      id: 'local',
      name: 'local',
      type: 'local',
    };
    localStorage.setItem(REPOS_KEY, JSON.stringify([defaultLocal]));
    localStorage.setItem(DEFAULT_REPO_KEY, 'local');
    return [defaultLocal];
  }
  return JSON.parse(saved);
}

export function saveRepos(repos: Repository[]) {
  localStorage.setItem(REPOS_KEY, JSON.stringify(repos));
}

export function getDefaultRepoId(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const defaultId = localStorage.getItem(DEFAULT_REPO_KEY) || undefined;

  if (defaultId) {
    const repos = getRepos();
    const exists = repos.some(r => r.id === defaultId);
    if (exists) {
      return defaultId;
    }
    localStorage.removeItem(DEFAULT_REPO_KEY);
  }

  const repos = getRepos();
  if (repos.length > 0) {
    const newDefault = repos[0].id;
    localStorage.setItem(DEFAULT_REPO_KEY, newDefault);
    return newDefault;
  }

  return undefined;
}

export function setDefaultRepoId(id: string): void {
  localStorage.setItem(DEFAULT_REPO_KEY, id);
}

export function getDefaultRepo(): Repository | undefined {
  const defaultId = getDefaultRepoId();
  if (!defaultId) return undefined;
  return getRepos().find(r => r.id === defaultId);
}

export function addRepo(repo: Repository): void {
  const repos = getRepos();
  repos.push(repo);
  saveRepos(repos);
  setDefaultRepoId(repo.id);
}

export function deleteRepo(id: string): void {
  const repos = getRepos().filter(r => r.id !== id);
  saveRepos(repos);
}

export function setDefaultRepo(id: string): void {
  setDefaultRepoId(id);
}
