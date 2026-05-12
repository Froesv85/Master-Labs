import { uploadFile } from './s3-service';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
};

const MAX_AVATAR_BYTES  = 2 * 1024 * 1024; // 2 MB
const MAX_COVER_BYTES   = 5 * 1024 * 1024; // 5 MB

export type AvatarUploadResult = { url: string };

function decodeAndValidate(base64: string, contentType: string, maxBytes: number): Buffer {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) throw new Error(`Tipo não suportado: ${contentType}. Use jpeg, png ou webp.`);
  const buf = Buffer.from(base64, 'base64');
  if (buf.byteLength === 0) throw new Error('Dados de imagem vazios.');
  if (buf.byteLength > maxBytes) {
    throw new Error(`Arquivo muito grande: ${(buf.byteLength / 1024 / 1024).toFixed(1)} MB. Máximo: ${maxBytes / 1024 / 1024} MB.`);
  }
  return buf;
}

export async function uploadAvatar(
  base64: string,
  contentType: string,
  path: string
): Promise<AvatarUploadResult> {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) throw new Error(`Tipo não suportado: ${contentType}. Use jpeg, png ou webp.`);
  const buf = decodeAndValidate(base64, contentType, MAX_AVATAR_BYTES);
  const key = `${path}/avatar-${Date.now()}.${ext}`;
  const url = await uploadFile(buf, key, contentType);
  return { url };
}

export async function uploadCover(
  base64: string,
  contentType: string,
  path: string
): Promise<AvatarUploadResult> {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) throw new Error(`Tipo não suportado: ${contentType}. Use jpeg, png ou webp.`);
  const buf = decodeAndValidate(base64, contentType, MAX_COVER_BYTES);
  const key = `${path}/cover-${Date.now()}.${ext}`;
  const url = await uploadFile(buf, key, contentType);
  return { url };
}
