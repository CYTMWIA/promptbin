import { Prompt, PromptIndex, PromptIndexItem, PromptVariable, Repository } from './types';
import { getDefaultRepo, getRepos } from './repos';
import { encrypt, decrypt } from './crypto';
import { createStorage, Storage } from './storage';

const INDEX_KEY = (repoId: string) => `repo:${repoId}:index`;
const PROMPT_KEY = (repoId: string, path: string) => `repo:${repoId}:prompts:${path}`;

export type { PromptIndexItem, Prompt };

async function getPromptIndex(storage: Storage, repoId: string): Promise<PromptIndex> {
  const saved = await storage.get(INDEX_KEY(repoId));
  if (!saved) return { prompts: [] };

  const repo = getRepos().find(r => r.id === repoId);
  try {
    const data = repo?.type === 's3' && repo.encryptionPassword
      ? await decrypt(saved, repo.encryptionPassword)
      : saved;
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to decrypt index:', e);
    return { prompts: [] };
  }
}

async function savePromptIndex(storage: Storage, repoId: string, index: PromptIndex, password?: string): Promise<void> {
  const data = password
    ? await encrypt(JSON.stringify(index), password)
    : JSON.stringify(index);
  await storage.set(INDEX_KEY(repoId), data);
}

export async function getPrompt(repoId: string, path: string): Promise<Prompt | null> {
  const repo = getRepos().find(r => r.id === repoId);
  if (!repo) return null;

  const storage = createStorage(repo);
  const saved = await storage.get(PROMPT_KEY(repoId, path));
  if (!saved) return null;

  try {
    const decrypted = await decrypt(saved, repo.encryptionPassword);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

export async function savePrompt(
  repoId: string,
  title: string,
  template: string,
  variables?: Record<string, PromptVariable>
): Promise<string> {
  const repo = getRepos().find(r => r.id === repoId);
  if (!repo) throw new Error('Repository not found');

  const storage = createStorage(repo);
  const now = Date.now();
  const path = `${now}.json`;

  const extractedVars = extractVariables(template);
  const promptVariables: Record<string, PromptVariable> = {};

  for (const name of extractedVars) {
    if (variables?.[name]) {
      promptVariables[name] = variables[name];
    } else {
      promptVariables[name] = {};
    }
  }

  const prompt: Prompt = {
    title,
    template,
    variables: promptVariables,
    createdAt: now,
    updatedAt: now,
  };

  const encrypted = await encrypt(JSON.stringify(prompt), repo.encryptionPassword);
  await storage.set(PROMPT_KEY(repoId, path), encrypted);

  const newIndexItem = { title, path };
  const existingIndex = await getPromptIndex(storage, repoId);
  const newIndex = {
    prompts: [...existingIndex.prompts, newIndexItem]
  };
  await savePromptIndex(storage, repoId, newIndex, repo.encryptionPassword);

  return path;
}

export async function deletePrompt(repoId: string, path: string): Promise<void> {
  const repo = getRepos().find(r => r.id === repoId);
  if (!repo) return;

  const storage = createStorage(repo);

  const index = await getPromptIndex(storage, repoId);
  index.prompts = index.prompts.filter(item => item.path !== path);
  await savePromptIndex(storage, repoId, index, repo.encryptionPassword);

  await storage.delete(PROMPT_KEY(repoId, path));
}

export async function getPromptsForDefaultRepo(): Promise<PromptIndexItem[]> {
  const repo = getDefaultRepo();
  if (!repo) return [];

  const storage = createStorage(repo);
  const index = await getPromptIndex(storage, repo.id);
  return index.prompts;
}

export async function getPromptContent(repoId: string, path: string): Promise<Prompt | null> {
  return getPrompt(repoId, path);
}

export async function updatePrompt(
  repoId: string,
  path: string,
  title: string,
  template: string,
  variables?: Record<string, PromptVariable>
): Promise<void> {
  const repo = getRepos().find(r => r.id === repoId);
  if (!repo) return;

  const storage = createStorage(repo);
  const prompt = await getPrompt(repoId, path);
  if (!prompt) return;

  const extractedVars = extractVariables(template);
  const promptVariables: Record<string, PromptVariable> = {};

  for (const name of extractedVars) {
    if (variables?.[name]) {
      promptVariables[name] = variables[name];
    } else if (prompt.variables?.[name]) {
      promptVariables[name] = prompt.variables[name];
    } else {
      promptVariables[name] = {};
    }
  }

  const updated: Prompt = {
    ...prompt,
    title,
    template,
    variables: promptVariables,
    updatedAt: Date.now(),
  };

  const encrypted = await encrypt(JSON.stringify(updated), repo.encryptionPassword);
  await storage.set(PROMPT_KEY(repoId, path), encrypted);

  const index = await getPromptIndex(storage, repoId);
  const item = index.prompts.find(i => i.path === path);
  if (item) {
    item.title = title;
    await savePromptIndex(storage, repoId, index, repo.encryptionPassword);
  }
}

import { extractVariables } from './prompt-template';
import { S3StorageAdapter } from './storage/s3';

export async function testS3Connection(repo: Repository): Promise<boolean> {
  if (repo.type !== 's3') return false;
  const storage = new S3StorageAdapter(repo);
  return storage.testConnection();
}
