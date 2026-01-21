'use client';

import { useState } from 'react';
import { savePrompt } from '../lib/prompt-storage';
import { getDefaultRepo } from '../lib/repos';
import { toast } from 'sonner';
import PromptForm from './PromptForm';

interface CreatePromptViewProps {
  onSuccess: (path: string) => void;
}

export default function CreatePromptView({ onSuccess }: CreatePromptViewProps) {
  const [saving, setSaving] = useState(false);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Create Prompt</h1>
      <PromptForm
        onSave={async (title, template, variables) => {
          setSaving(true);
          const repo = getDefaultRepo();
          if (repo) {
            try {
              const path = await savePrompt(repo.id, title, template, variables);
              toast.success('Prompt created');
              onSuccess(path);
            } catch {
              toast.error('Failed to create prompt');
            } finally {
              setSaving(false);
            }
          }
        }}
        onCancel={() => onSuccess('')}
        loading={saving}
      />
    </div>
  );
}
