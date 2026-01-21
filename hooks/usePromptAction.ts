'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface PromptActionResult {
  loading: boolean;
  error: string | null;
  execute: () => Promise<boolean>;
}

export function usePromptAction(
  action: () => Promise<void>,
  successMessage: string,
  errorMessage?: string
): PromptActionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    setLoading(true);
    setError(null);
    try {
      await action();
      toast.success(successMessage);
      return true;
    } catch {
      const msg = errorMessage || 'Operation failed';
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, execute };
}
