import {
  extractYoutubeId,
  isValidYoutubeUrl,
  getYoutubeEmbedUrl,
  getYoutubeThumbnailUrl,
} from '@/lib/youtube';

const VALID_ID = 'dQw4w9WgXcQ';

describe('extractYoutubeId', () => {
  it('extrai ID de youtube.com/watch?v=', () => {
    expect(extractYoutubeId(`https://www.youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID);
    expect(extractYoutubeId(`https://youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID);
    expect(extractYoutubeId(`https://m.youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID);
  });

  it('extrai ID de youtu.be/', () => {
    expect(extractYoutubeId(`https://youtu.be/${VALID_ID}`)).toBe(VALID_ID);
  });

  it('extrai ID de /shorts/', () => {
    expect(extractYoutubeId(`https://www.youtube.com/shorts/${VALID_ID}`)).toBe(VALID_ID);
  });

  it('extrai ID de /embed/', () => {
    expect(extractYoutubeId(`https://www.youtube.com/embed/${VALID_ID}`)).toBe(VALID_ID);
  });

  it('ignora query params extras (t=, list=)', () => {
    expect(extractYoutubeId(`https://www.youtube.com/watch?v=${VALID_ID}&t=30s&list=PL123`)).toBe(VALID_ID);
  });

  it('retorna null para domínio não permitido', () => {
    expect(extractYoutubeId('https://vimeo.com/123456789')).toBeNull();
    expect(extractYoutubeId('https://dailymotion.com/video/x123')).toBeNull();
    expect(extractYoutubeId('https://evil.youtube.com/watch?v=abc')).toBeNull();
  });

  it('retorna null para URL malformada', () => {
    expect(extractYoutubeId('not-a-url')).toBeNull();
    expect(extractYoutubeId('')).toBeNull();
  });

  it('retorna null quando video ID tem formato inválido', () => {
    expect(extractYoutubeId('https://youtu.be/short')).toBeNull();
    expect(extractYoutubeId('https://www.youtube.com/watch?v=toolongid123456')).toBeNull();
    expect(extractYoutubeId('https://www.youtube.com/watch?v=')).toBeNull();
  });

  it('retorna null para youtube.com sem caminho reconhecido', () => {
    expect(extractYoutubeId('https://www.youtube.com/')).toBeNull();
    expect(extractYoutubeId('https://www.youtube.com/channel/UC123')).toBeNull();
  });
});

describe('isValidYoutubeUrl', () => {
  it('retorna true para URLs válidas', () => {
    expect(isValidYoutubeUrl(`https://www.youtube.com/watch?v=${VALID_ID}`)).toBe(true);
    expect(isValidYoutubeUrl(`https://youtu.be/${VALID_ID}`)).toBe(true);
    expect(isValidYoutubeUrl(`https://www.youtube.com/shorts/${VALID_ID}`)).toBe(true);
  });

  it('retorna false para URLs inválidas', () => {
    expect(isValidYoutubeUrl('https://vimeo.com/123')).toBe(false);
    expect(isValidYoutubeUrl('')).toBe(false);
    expect(isValidYoutubeUrl('https://www.youtube.com/')).toBe(false);
  });
});

describe('getYoutubeEmbedUrl', () => {
  it('retorna URL de embed correta', () => {
    expect(getYoutubeEmbedUrl(VALID_ID)).toBe(`https://www.youtube.com/embed/${VALID_ID}`);
  });
});

describe('getYoutubeThumbnailUrl', () => {
  it('retorna URL de thumbnail hqdefault', () => {
    expect(getYoutubeThumbnailUrl(VALID_ID)).toBe(
      `https://img.youtube.com/vi/${VALID_ID}/hqdefault.jpg`
    );
  });
});
