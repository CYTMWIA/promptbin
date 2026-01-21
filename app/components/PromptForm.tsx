'use client';

import { useState, useMemo } from 'react';
import { extractVariables } from '../lib/prompt-template';
import { PromptVariable } from '../lib/types';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PromptFormProps {
  initialTitle?: string;
  initialTemplate?: string;
  initialVariables?: Record<string, PromptVariable>;
  onSave: (
    title: string,
    template: string,
    variables: Record<string, PromptVariable>
  ) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function PromptForm({
  initialTitle = '',
  initialTemplate = '',
  initialVariables = {},
  onSave,
  onCancel,
  loading = false,
}: PromptFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [template, setTemplate] = useState(initialTemplate);
  const [variableDefaults, setVariableDefaults] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const [key, val] of Object.entries(initialVariables)) {
      if (val.default) {
        defaults[key] = val.default;
      }
    }
    return defaults;
  });

  const currentVars = useMemo(() => extractVariables(template), [template]);

  const handleSave = async () => {
    if (!title.trim()) return;
    const variables: Record<string, PromptVariable> = {};
    for (const name of currentVars) {
      const defaultValue = variableDefaults[name];
      variables[name] = defaultValue ? { default: defaultValue } : {};
    }
    await onSave(title, template, variables);
  };

  return (
    <div className="space-y-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Prompt title"
        className="text-3xl font-semibold tracking-tight bg-transparent border-none focus:outline-none w-full"
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Template</label>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={15}
          className="w-full p-4 border border-input bg-background rounded-md resize-none font-mono text-sm"
          placeholder="Enter your prompt template with {{variables}}..."
        />
      </div>

      {currentVars.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Variable Defaults</label>
          <div className="grid gap-4 p-4 border border-input rounded-md">
            {currentVars.map((name) => (
              <div key={name} className="grid grid-cols-3 items-start gap-4">
                <span className="text-sm font-medium mt-2">{name}</span>
                <textarea
                  value={variableDefaults[name] ?? ''}
                  onChange={(e) =>
                    setVariableDefaults({
                      ...variableDefaults,
                      [name]: e.target.value,
                    })
                  }
                  placeholder="Default value (optional)"
                  className="col-span-2 min-h-[1.5rem] resize-y p-2 border border-input bg-background rounded-md text-sm"
                  rows={1}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4">
        <Button onClick={handleSave} disabled={!title.trim() || loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
