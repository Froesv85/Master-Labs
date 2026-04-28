import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

type ExtractRequestBody = {
  input?: string;
  source?: 'manual' | 'webhook';
  imageB64?: string; // Base64 representation of the image
};

function parseProjectId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeInput(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function createWebhookId() {
  return `webhook_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function anonymizeSensitiveData(text: string) {
  let redactions = 0;
  const detectedTypes = new Set<string>();

  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})-?\d{4}/g;
  const cpfRegex = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

  const replaceAndCount = (content: string, regex: RegExp, token: string, type: string) =>
    content.replace(regex, () => {
      redactions += 1;
      detectedTypes.add(type);
      return token;
    });

  let sanitized = text;
  sanitized = replaceAndCount(sanitized, emailRegex, '[EMAIL_REDACTED]', 'EMAIL');
  sanitized = replaceAndCount(sanitized, phoneRegex, '[PHONE_REDACTED]', 'PHONE');
  sanitized = replaceAndCount(sanitized, cpfRegex, '[CPF_REDACTED]', 'CPF');

  return { sanitized, redactions, piiTypes: [...detectedTypes] };
}

function extractKeywords(text: string) {
  const stopWords = new Set([
    'de',
    'da',
    'do',
    'das',
    'dos',
    'e',
    'em',
    'na',
    'no',
    'para',
    'com',
    'uma',
    'um',
    'que',
    'por',
    'as',
    'os',
    'ao',
    'a',
    'o',
  ]);

  const terms = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !stopWords.has(token));

  const frequency = new Map<string, number>();
  for (const token of terms) {
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([token]) => token);
}

function createEmbeddingId(projectId: number) {
  const now = Date.now().toString(36);
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  return `emb_${projectId}_${now}_${random}`;
}

function formatUnknownError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseProjectId(id);

  if (!projectId) {
    return NextResponse.json({ error: 'Invalid project id.' }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as ExtractRequestBody | null;
  const source = body?.source ?? 'manual';

  if (source !== 'manual' && source !== 'webhook') {
    return NextResponse.json(
      { error: 'Invalid source. Use one of: manual, webhook.' },
      { status: 400 }
    );
  }

  const input = normalizeInput(body?.input);
  if (input.length < 20) {
    return NextResponse.json(
      { error: 'Input must contain at least 20 characters.' },
      { status: 400 }
    );
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true, 
        title: true, 
        description: true,
        creator: { select: { language: true } }
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const language = project.creator.language || 'pt-BR';
    const webhookId = createWebhookId();
    const { sanitized, redactions, piiTypes } = anonymizeSensitiveData(input);
    const keywords = extractKeywords(sanitized);
    const embeddingId = createEmbeddingId(projectId);

    // Create extraction log in DB with 'queued' status
    const extractionLog = await prisma.projectExtractionLog.create({
      data: {
        projectId,
        status: 'queued',
        source,
        webhookId,
        piiRedactions: redactions,
        piiTypes: piiTypes.length > 0 ? JSON.stringify(piiTypes) : null,
        keywords: JSON.stringify(keywords),
        embeddingId,
        language,
      },
      select: {
        id: true,
        projectId: true,
        status: true,
        webhookId: true,
        piiRedactions: true,
        keywords: true,
        language: true,
        createdAt: true,
      },
    });

    // Update project with new content and embedding
    await prisma.project.update({
      where: { id: projectId },
      data: { content: sanitized, embeddingId },
    });

    // Trigger n8n webhook and mark failures explicitly to avoid orphan queued logs.
    const n8nWebhookUrl = process.env.N8N_EXTRACTION_WEBHOOK_URL?.trim();
    const callbackBaseUrl = process.env.API_URL?.trim() || req.nextUrl.origin;

    try {
      if (!n8nWebhookUrl) {
        throw new Error('N8N_EXTRACTION_WEBHOOK_URL is not configured.');
      }

      console.log(`Triggering n8n webhook at ${n8nWebhookUrl} (Language: ${language})`);
      const n8nRes = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookId,
          projectId,
          projectTitle: project.title,
          language,
          input: sanitized,
          imageB64: body?.imageB64 || null,
          keywords,
          piiRedactions: redactions,
          embeddingId,
          callbackUrl: `${callbackBaseUrl}/api/projects/${projectId}/extract/callback`,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const responseText = await n8nRes.text();
      if (!n8nRes.ok) {
        throw new Error(`n8n webhook returned ${n8nRes.status}: ${responseText}`);
      }

      console.log(`n8n webhook response: ${n8nRes.status} - ${responseText}`);
    } catch (error) {
      const message = formatUnknownError(error);
      await prisma.projectExtractionLog.update({
        where: { id: extractionLog.id },
        data: {
          status: 'failed',
          error: `Failed to trigger n8n webhook: ${message}`,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          data: {
            logId: extractionLog.id,
            projectId,
            webhookId,
            embeddingId,
            status: 'failed',
            source,
            piiRedactions: redactions,
            keywords,
          },
          error: `Failed to trigger n8n webhook: ${message}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        data: {
          logId: extractionLog.id,
          projectId,
          webhookId,
          embeddingId,
          status: 'queued',
          source,
          piiRedactions: redactions,
          keywords: keywords,
          message: 'Extracao iniciada no pipeline n8n.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/projects/[id]/extract failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const projectId = parseProjectId(id);

  if (!projectId) {
    return NextResponse.json({ error: 'Invalid project id.' }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const logs = await prisma.projectExtractionLog.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        status: true,
        webhookId: true,
        source: true,
        piiRedactions: true,
        keywords: true,
        embeddingId: true,
        latencyMs: true,
        n8nExecutionId: true,
        output: true,
        error: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const parsedLogs = logs.map((log) => ({
      ...log,
      keywords: log.keywords ? JSON.parse(log.keywords) : [],
      output: log.output ? JSON.parse(log.output) : null,
    }));

    return NextResponse.json({
      data: parsedLogs,
    });
  } catch (error) {
    console.error('GET /api/projects/[id]/extract failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}