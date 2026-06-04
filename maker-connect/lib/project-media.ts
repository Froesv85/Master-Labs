import { uploadFile } from './s3-service';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const ALLOWED_3D_EXTENSIONS: Record<string, string> = {
  stl: 'model/stl',
  gcode: 'text/x-gcode',
  '3mf': 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
  obj: 'model/obj',
  amf: 'application/xml',
  step: 'application/step',
  stp: 'application/step',
  f3d: 'application/octet-stream',
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;   // 8 MB
const MAX_FILE_BYTES  = 200 * 1024 * 1024; // 200 MB

export type ImageUploadResult = { url: string; sizeBytes: number };
export type FileUploadResult  = { url: string; fileName: string; fileType: string; fileSizeKb: number };

export function validateProjectImageType(contentType: string): string {
  const ext = ALLOWED_IMAGE_TYPES[contentType];
  if (!ext) throw new Error(`Tipo não suportado: ${contentType}. Use jpeg, png, gif ou webp.`);
  return ext;
}

export function getSupportedExtensions(): string[] {
  return Object.keys(ALLOWED_3D_EXTENSIONS);
}

export function validateProjectFileExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_3D_EXTENSIONS[ext]) {
    throw new Error(
      `Extensão não suportada: .${ext}. Use: ${getSupportedExtensions().join(', ')}.`
    );
  }
  return ext;
}

export async function uploadProjectImage(
  base64: string,
  contentType: string,
  projectId: number
): Promise<ImageUploadResult> {
  const ext = validateProjectImageType(contentType);
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.byteLength === 0) throw new Error('Imagem vazia.');
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error('Imagem maior que 8 MB.');

  const key = `projects/${projectId}/images/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const url = await uploadFile(buffer, key, contentType);
  return { url, sizeBytes: buffer.byteLength };
}

export async function uploadProject3DFile(
  base64: string,
  fileName: string,
  projectId: number
): Promise<FileUploadResult> {
  const ext = validateProjectFileExtension(fileName);
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.byteLength === 0) throw new Error('Arquivo vazio.');
  if (buffer.byteLength > MAX_FILE_BYTES) throw new Error('Arquivo maior que 200 MB.');

  const slug = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `projects/${projectId}/files/${Date.now()}-${slug}`;
  const contentType = ALLOWED_3D_EXTENSIONS[ext] ?? 'application/octet-stream';
  const url = await uploadFile(buffer, key, contentType);

  return {
    url,
    fileName,
    fileType: ext,
    fileSizeKb: Math.ceil(buffer.byteLength / 1024),
  };
}
