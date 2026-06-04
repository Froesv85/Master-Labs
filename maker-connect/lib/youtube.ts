const ALLOWED_HOSTS = ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'];
const VIDEO_ID_RE = /^[\w-]{11}$/;

function isValidVideoId(id: string): boolean {
  return VIDEO_ID_RE.test(id);
}

export function extractYoutubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }

  if (!ALLOWED_HOSTS.includes(u.hostname)) return null;

  if (u.hostname === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0];
    return isValidVideoId(id) ? id : null;
  }

  if (u.pathname === '/watch') {
    const id = u.searchParams.get('v');
    return id && isValidVideoId(id) ? id : null;
  }

  const match = u.pathname.match(/^\/(shorts|embed)\/([^/?]+)/);
  if (match) {
    const id = match[2];
    return isValidVideoId(id) ? id : null;
  }

  return null;
}

export function isValidYoutubeUrl(url: string): boolean {
  return extractYoutubeId(url) !== null;
}

export function getYoutubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function getYoutubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
