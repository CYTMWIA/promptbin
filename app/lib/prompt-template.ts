import { PromptVariable } from './types';

export function extractVariables(template: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const vars = new Set<string>();
  let match;
  while ((match = regex.exec(template)) !== null) {
    vars.add(match[1].trim());
  }
  return Array.from(vars);
}

export function replaceTemplateVariables(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, name) => {
    const key = name.trim();
    return values[key] ?? '';
  });
}

export function replaceTemplateVariablesWithDefaults(
  template: string,
  values: Record<string, string>,
  variables?: Record<string, PromptVariable>
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, name) => {
    const key = name.trim();
    return values[key] || variables?.[key]?.default || '';
  });
}
