import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

// SigV4 signs requests against the exact path they're sent to. S3_ENDPOINT is
// the public URL (e.g. https://SEU_DOMINIO.com/storage) used to build browser
// -facing links, but when Nginx proxies /storage/ to MinIO it strips that
// prefix, so a signed request built against S3_ENDPOINT reaches MinIO with a
// path the signature no longer matches (403 SignatureDoesNotMatch). The SDK
// itself must talk to MinIO directly, hence a separate internal endpoint.
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_INTERNAL_ENDPOINT || process.env.S3_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
  },
});

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string = 'application/pdf'
): Promise<string> {
  const bucket = process.env.S3_BUCKET_NAME || 'maker-assets';

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket ${bucket} nao existe. Criando automaticamente...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
      
      // Setup anonymous read policy
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucket}/*`]
          }
        ]
      };
      await s3Client.send(new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify(policy)
      }));
    } else {
      throw error;
    }
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Public URL for the browser. MinIO serves objects path-style from the same
  // endpoint used for the SDK, but providers like Cloudflare R2 use a separate
  // public domain (their S3 API endpoint isn't publicly readable), so
  // S3_PUBLIC_URL_BASE lets that be configured independently when needed.
  const publicBase = process.env.S3_PUBLIC_URL_BASE;
  if (publicBase) {
    return `${publicBase}/${filename}`;
  }

  const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
  return `${endpoint}/${bucket}/${filename}`;
}
