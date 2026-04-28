jest.mock('@/lib/s3-service', () => ({
  uploadFile: jest.fn(),
}));

import { uploadFile } from '@/lib/s3-service';
import { validateMediaType, decodeBase64Media, uploadPostMedia } from '@/lib/community-media';

afterEach(() => jest.clearAllMocks());

describe('validateMediaType', () => {
  it('aceita image/jpeg e retorna extensão jpg', () => {
    expect(validateMediaType('image/jpeg')).toBe('jpg');
  });

  it('aceita image/png, image/gif, image/webp', () => {
    expect(validateMediaType('image/png')).toBe('png');
    expect(validateMediaType('image/gif')).toBe('gif');
    expect(validateMediaType('image/webp')).toBe('webp');
  });

  it('lança erro para application/pdf', () => {
    expect(() => validateMediaType('application/pdf')).toThrow(/Unsupported/);
  });

  it('lança erro para tipo vazio', () => {
    expect(() => validateMediaType('')).toThrow(/Unsupported/);
  });
});

describe('decodeBase64Media', () => {
  const validBase64 = Buffer.from('hello world').toString('base64');

  it('retorna Buffer para base64 válido', () => {
    const buf = decodeBase64Media(validBase64, 'image/jpeg');
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.byteLength).toBeGreaterThan(0);
  });

  it('lança erro para tipo não suportado', () => {
    expect(() => decodeBase64Media(validBase64, 'application/pdf')).toThrow(/Unsupported/);
  });

  it('lança erro quando base64 decodifica para buffer vazio', () => {
    expect(() => decodeBase64Media('', 'image/jpeg')).toThrow(/empty/i);
  });

  it('lança erro quando arquivo excede 5 MB', () => {
    const bigBase64 = Buffer.alloc(6 * 1024 * 1024).toString('base64');
    expect(() => decodeBase64Media(bigBase64, 'image/png')).toThrow(/too large/i);
  });
});

describe('uploadPostMedia', () => {
  const fakeBase64 = Buffer.from('fake image data').toString('base64');
  const fakeUrl = 'http://localhost:9000/maker-assets/communities/1/posts/img.png';

  it('chama uploadFile com key correta e retorna url', async () => {
    (uploadFile as jest.Mock).mockResolvedValue(fakeUrl);

    const result = await uploadPostMedia(fakeBase64, 'image/png', 1);

    expect(uploadFile).toHaveBeenCalledTimes(1);
    const [, key, contentType] = (uploadFile as jest.Mock).mock.calls[0];
    expect(key).toMatch(/^communities\/1\/posts\/.+\.png$/);
    expect(contentType).toBe('image/png');
    expect(result.url).toBe(fakeUrl);
    expect(result.contentType).toBe('image/png');
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it('lança erro para tipo não suportado sem chamar uploadFile', async () => {
    await expect(uploadPostMedia(fakeBase64, 'video/mp4', 1)).rejects.toThrow(/Unsupported/);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it('propaga erro do S3 quando upload falha', async () => {
    (uploadFile as jest.Mock).mockRejectedValue(new Error('S3 connection refused'));
    await expect(uploadPostMedia(fakeBase64, 'image/jpeg', 1)).rejects.toThrow(
      'S3 connection refused'
    );
  });
});
