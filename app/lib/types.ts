export interface Repository {
  id: string;
  name: string;
  type: 'local' | 's3';
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  region?: string;
  encryptionPassword?: string;
}

export interface Prompt {
  title: string;
  template: string;
  variables?: Record<string, PromptVariable>;
  createdAt: number; // unix timestamp in ms
  updatedAt: number; // unix timestamp in ms
}

export interface PromptVariable {
  default?: string;
}

export interface PromptIndexItem {
  title: string;
  path: string;
}

export interface PromptIndex {
  prompts: PromptIndexItem[];
}
