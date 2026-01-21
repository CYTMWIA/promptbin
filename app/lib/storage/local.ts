export class LocalStorageAdapter {
  get(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return Promise.resolve(null);
    return Promise.resolve(localStorage.getItem(key));
  }

  set(key: string, data: string): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    localStorage.setItem(key, data);
    return Promise.resolve();
  }

  delete(key: string): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    localStorage.removeItem(key);
    return Promise.resolve();
  }

  list(prefix: string): Promise<string[]> {
    if (typeof window === 'undefined') return Promise.resolve([]);
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return Promise.resolve(keys);
  }
}
