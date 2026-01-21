'use client';

import { useState, useEffect, useMemo } from 'react';
import { Pencil, Copy, Check } from 'lucide-react';
import { getPromptContent, updatePrompt } from '../lib/prompt-storage';
import { extractVariables, replaceTemplateVariablesWithDefaults } from '../lib/prompt-template';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PromptForm from './PromptForm';
import { PromptVariable } from '../lib/types';

interface PromptViewProps {
  repoId: string;
  path: string;
  onUpdate: () => void;
}

export default function PromptView({ repoId, path, onUpdate }: PromptViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState<Awaited<ReturnType<typeof getPromptContent>> | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  useEffect(() => {
    getPromptContent(repoId, path).then(setPrompt);
  }, [repoId, path]);

  const variables = useMemo(() => {
    if (!prompt?.template) return [];
    return extractVariables(prompt.template);
  }, [prompt?.template]);

  useEffect(() => {
    if (variables.length > 0) {
      setVariableValues(Object.fromEntries(variables.map(v => [v, ''])));
    } else {
      setVariableValues({});
    }
  }, [variables]);

  const previewContent = useMemo(() => {
    if (!prompt?.template) return '';
    return replaceTemplateVariablesWithDefaults(prompt.template, variableValues, prompt.variables);
  }, [prompt?.template, variableValues, prompt?.variables]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (title: string, template: string, variables: Record<string, PromptVariable>) => {
    setSaving(true);
    try {
      await updatePrompt(repoId, path, title, template, variables);
      toast.success('Prompt saved');
      setIsEditing(false);
      const newPrompt = await getPromptContent(repoId, path);
      setPrompt(newPrompt);
      onUpdate();
    } catch {
      toast.error('Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  if (!prompt) {
    return (
      <div className="text-muted-foreground">Loading...</div>
    );
  }

  return (
    <div>
      {isEditing ? (
        <PromptForm
          initialTitle={prompt.title}
          initialTemplate={prompt.template}
          initialVariables={prompt.variables}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          loading={saving}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight">{prompt.title}</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Template</label>
            <div className="p-4 border border-input bg-background rounded-md mt-1">
              <pre className="whitespace-pre-wrap font-mono text-sm">{prompt.template}</pre>
            </div>
          </div>

          {variables.length > 0 && (
            <div>
              <label className="text-sm font-medium">Variables</label>
              <div className="grid gap-4 p-4 border border-input rounded-md mt-1">
                {variables.map((varName) => (
                  <div key={varName} className="grid grid-cols-3 items-start gap-4">
                    <span className="text-sm font-medium mt-2">{varName}</span>
                      <textarea
                        value={variableValues[varName] || ''}
                        onChange={(e) => setVariableValues(prev => ({ ...prev, [varName]: e.target.value }))}
                        placeholder={prompt.variables?.[varName]?.default}
                        className="col-span-2 min-h-[1.5rem] resize-y p-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground/70"
                        rows={1}
                      />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Preview</label>
            <div className="p-4 border border-input bg-background rounded-md mt-1 relative group">
              <pre className="whitespace-pre-wrap font-mono text-sm">{previewContent}</pre>
              <Button variant="outline" size="sm" onClick={handleCopy} className="absolute top-2 right-2 transition-all pointer-events-none group-hover:pointer-events-auto bg-background opacity-0 group-hover:opacity-100">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="ml-1">{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
