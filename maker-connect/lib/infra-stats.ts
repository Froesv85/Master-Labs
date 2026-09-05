import IORedis from 'ioredis';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export type RedisStats =
  | { configured: false }
  | { configured: true; usedMemoryMb: number; keys: number }
  | { configured: true; error: string };

export type MinioStats =
  | { configured: false }
  | { configured: true; bucket: string; objects: number; sizeMb: number }
  | { configured: true; error: string };

export type PineconeStats =
  | { configured: false }
  | { configured: true; index: string; vectors: number; dimension: number | null }
  | { configured: true; error: string };

export async function getRedisStats(): Promise<RedisStats> {
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  const client = new IORedis(url, {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  });

  try {
    await client.connect();
    const [info, keys] = await Promise.all([client.info('memory'), client.dbsize()]);
    const match = info.match(/used_memory:(\d+)/);
    const usedMemoryMb = match ? Math.round((Number(match[1]) / 1024 / 1024) * 100) / 100 : 0;
    return { configured: true, usedMemoryMb, keys };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao consultar o Redis',
    };
  } finally {
    client.disconnect();
  }
}

export async function getMinioStats(): Promise<MinioStats> {
  const endpoint = process.env.S3_INTERNAL_ENDPOINT || process.env.S3_ENDPOINT;
  if (!endpoint) return { configured: false };

  const bucket = process.env.S3_BUCKET_NAME || 'maker-assets';
  const client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
    },
  });

  try {
    let objects = 0;
    let totalBytes = 0;
    let continuationToken: string | undefined;

    do {
      const page = await client.send(
        new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken })
      );
      objects += page.KeyCount ?? page.Contents?.length ?? 0;
      totalBytes += (page.Contents ?? []).reduce((sum, obj) => sum + (obj.Size ?? 0), 0);
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);

    return { configured: true, bucket, objects, sizeMb: Math.round((totalBytes / 1024 / 1024) * 100) / 100 };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao consultar o MinIO',
    };
  }
}

export async function getPineconeStats(): Promise<PineconeStats> {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) return { configured: false };

  const indexName = process.env.PINECONE_INDEX ?? 'maker-knowledge';

  try {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const client = new Pinecone({ apiKey });
    const stats = await client.index(indexName).describeIndexStats();

    return {
      configured: true,
      index: indexName,
      vectors: stats.totalRecordCount ?? 0,
      dimension: stats.dimension ?? null,
    };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao consultar o Pinecone',
    };
  }
}
