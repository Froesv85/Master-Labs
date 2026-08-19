import type {
  FeedCategory,
  FeedSort,
  ProjectsFeedResponse,
  ShareProjectResponse,
  VoteProjectResponse,
} from './types';

type FetchProjectsFeedParams = {
  page: number;
  pageSize: number;
  sort: FeedSort;
  category?: FeedCategory | null;
  q?: string;
  signal?: AbortSignal;
};

async function readErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function fetchProjectsFeed({
  page,
  pageSize,
  sort,
  category,
  q,
  signal,
}: FetchProjectsFeedParams): Promise<ProjectsFeedResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort,
  });

  if (category) {
    params.set('category', category);
  }

  if (q?.trim()) {
    params.set('q', q.trim());
  }

  const response = await fetch(`/api/projects?${params.toString()}`, {
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Falha ao carregar feed.');
    throw new Error(message);
  }

  return (await response.json()) as ProjectsFeedResponse;
}

export async function forkProject(projectId: number): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}/fork`, {
    method: 'POST',
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Falha ao criar fork.');
    throw new Error(message);
  }
}

export async function shareProject(projectId: number): Promise<ShareProjectResponse> {
  const response = await fetch(`/api/projects/${projectId}/share`, {
    method: 'POST',
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Falha ao compartilhar projeto.');
    throw new Error(message);
  }

  return (await response.json()) as ShareProjectResponse;
}

export async function voteProject(projectId: number): Promise<VoteProjectResponse> {
  const response = await fetch(`/api/projects/${projectId}/vote`, {
    method: 'POST',
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, 'Falha ao votar no projeto.');
    throw new Error(message);
  }

  return (await response.json()) as VoteProjectResponse;
}
