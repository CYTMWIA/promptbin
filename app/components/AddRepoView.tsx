'use client';

import { useState } from 'react';
import { Repository, addRepo } from '../lib/repos';
import { testS3Connection } from '../lib/prompt-storage';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AddRepoViewProps {
  onSuccess: () => void;
}

export default function AddRepoView({ onSuccess }: AddRepoViewProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'local' | 's3'>('local');
  const [bucket, setBucket] = useState('');
  const [region, setRegion] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [id, setId] = useState('');
  const [key, setKey] = useState('');
  const [password, setPassword] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleSubmit = () => {
    if (!name.trim()) return;

    const newRepo: Repository = {
      id: crypto.randomUUID(),
      name,
      type,
      ...(type === 's3' && {
        bucket,
        region: region || undefined,
        endpoint,
        accessKeyId: id,
        secretAccessKey: key,
        encryptionPassword: password || undefined,
      }),
    };

    try {
      addRepo(newRepo);
      toast.success('Repository added');
      onSuccess();
    } catch {
      toast.error('Failed to add repository');
    }
  };

  const handleTest = async () => {
    const testRepo: Repository = {
      id: '',
      name: 'test',
      type: 's3',
      bucket,
      region: region || undefined,
      endpoint,
      accessKeyId: id,
      secretAccessKey: key,
    };

    setTesting(true);
    setTestResult(null);

    try {
      const success = await testS3Connection(testRepo);
      setTestResult(success ? 'success' : 'error');
      if (success) {
        toast.success('Connected successfully');
      } else {
        toast.error('Connection failed');
      }
    } catch {
      setTestResult('error');
      toast.error('Connection failed');
    }

    setTesting(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Add Repository</h1>

      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-repo"
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'local' | 's3')}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
          >
            <option value="local">Local Storage</option>
            <option value="s3">S3</option>
          </select>
        </div>

        {type === 's3' && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bucket</label>
              <input
                type="text"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                placeholder="my-bucket"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Region (optional)</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="us-east-1"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">S3 Endpoint</label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://s3.amazonaws.com"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">S3 ID</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">S3 Key</label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Secret access key"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Encryption Password (optional)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for plaintext"
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              />
              <p className="text-xs text-muted-foreground">Data will be encrypted with this password before uploading to S3</p>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing || !bucket || !endpoint || !id || !key}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              {testResult === 'success' && <span className="text-green-500 text-sm">Connected!</span>}
              {testResult === 'error' && <span className="text-red-500 text-sm">Failed - check credentials</span>}
            </div>
          </>
        )}

        <div className="flex gap-4 pt-4">
          <Button onClick={handleSubmit} disabled={!name.trim() || (type === 's3' && !bucket)}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
