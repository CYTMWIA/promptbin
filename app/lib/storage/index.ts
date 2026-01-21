import { Repository } from '../types';
import { LocalStorageAdapter } from './local';
import { S3StorageAdapter } from './s3';

export interface Storage {
  get(key: string): Promise<string | null>;
  set(key: string, data: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

export function createStorage(repo: Repository): Storage {
  if (repo.type === 'local') {
    return new LocalStorageAdapter();
  }
  return new S3StorageAdapter(repo);
}
