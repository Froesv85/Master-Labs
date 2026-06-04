import { uploadFile } from './s3-service';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export type MediaUploadResult = {
  url: string;
  contentType: string;
  sizeBytes: number;
};

export function validateMediaType(contentType: string): string {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    throw new Error(
      `Unsupported media type: ${contentType}. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}`
    );
  }
  return ext;
}

export function decodeBase64Media(base64: string, contentType: string): Buffer {
  const ext = validateMediaType(contentType);
  void ext;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.byteLength === 0) {
    throw new Error('Media data is empty.');
  }
  if (buffer.byteLength > MAX_SIZE_BYTES) {
    throw new Error(
      `File too large: ${buffer.byteLength} bytes. Maximum allowed: ${MAX_SIZE_BYTES} bytes (5 MB).`
    );
  }
  return buffer;
}

export async function uploadPostMedia(
  base64: string,
  contentType: string,
  communityId: number
): Promise<MediaUploadResult> {
  const ext = validateMediaType(contentType);
  const buffer = decodeBase64Media(base64, contentType);

  const key = `communities/${communityId}/posts/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const url = await uploadFile(buffer, key, contentType);

  return { url, contentType, sizeBytes: buffer.byteLength };
}
