import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Repository } from '../types';

export class S3StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor(repo: Repository) {
    this.client = new S3Client({
      endpoint: repo.endpoint,
      region: repo.region || 'us-east-1',
      credentials: {
        accessKeyId: repo.accessKeyId || '',
        secretAccessKey: repo.secretAccessKey || '',
      },
    });
    this.bucket = repo.bucket || '';
  }

  async get(key: string): Promise<string | null> {
    try {
      const response = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }));
      const bodyContents = await response.Body?.transformToString();
      return bodyContents || null;
    } catch {
      return null;
    }
  }

  async set(key: string, data: string): Promise<void> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: 'application/json',
      CacheControl: 'no-cache',
    }));
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async list(prefix: string): Promise<string[]> {
    const response = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    }));
    return response.Contents?.map(obj => obj.Key || '') || [];
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.send(new ListObjectsV2Command({
        Bucket: this.bucket,
        MaxKeys: 1,
      }));
      return true;
    } catch {
      return false;
    }
  }
}
