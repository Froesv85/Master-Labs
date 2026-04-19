export const EXTRACTION_SCHEMA_VERSION = 'mc_extract_v2';

export type RequirementPriority = 'high' | 'medium' | 'low';

export type TechnicalRequirement = {
  id: string;
  name: string;
  detail: string;
  priority: RequirementPriority;
};

export type SuggestedBomItem = {
  item: string;
  quantity: string;
  notes: string;
};

export type ExtractionOutputV2 = {
  schemaVersion: typeof EXTRACTION_SCHEMA_VERSION;
  technicalRequirements: TechnicalRequirement[];
  suggestedBOM: SuggestedBomItem[];
  suggestedCode: string;
  confidenceScore: number;
};

const MAX_LIST_SIZE = 6;

function normalizeText(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
}

function normalizePriority(value: unknown): RequirementPriority {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }
  return 'medium';
}

function normalizeConfidenceScore(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  const normalized = parsed <= 1 ? parsed * 100 : parsed;
  return Math.max(0, Math.min(100, Math.round(normalized * 100) / 100));
}

export function normalizeExtractionOutput(raw: unknown): ExtractionOutputV2 {
  const output = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

  const technicalRequirementsRaw = Array.isArray(output.technicalRequirements)
    ? output.technicalRequirements
    : [];

  const technicalRequirements = technicalRequirementsRaw
    .slice(0, MAX_LIST_SIZE)
    .map((entry, index): TechnicalRequirement => {
      if (typeof entry === 'string') {
        return {
          id: `TR-${index + 1}`,
          name: entry.trim().slice(0, 80) || `Requirement ${index + 1}`,
          detail: entry.trim() || 'Requirement detail not provided.',
          priority: 'medium',
        };
      }

      const item = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {};
      const name = normalizeText(item.name || item.title || item.requirement, `Requirement ${index + 1}`).slice(0, 80);
      const detail = normalizeText(item.detail || item.description || item.notes, name);

      return {
        id: normalizeText(item.id, `TR-${index + 1}`),
        name,
        detail,
        priority: normalizePriority(item.priority),
      };
    });

  const suggestedBomRaw = Array.isArray(output.suggestedBOM) ? output.suggestedBOM : [];
  const suggestedBOM = suggestedBomRaw
    .slice(0, MAX_LIST_SIZE)
    .map((entry): SuggestedBomItem => {
      const item = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>) : {};
      return {
        item: normalizeText(item.item || item.component || item.name, 'Unknown component'),
        quantity: normalizeText(item.quantity, '1'),
        notes: normalizeText(item.notes || item.detail || item.description),
      };
    });

  return {
    schemaVersion: EXTRACTION_SCHEMA_VERSION,
    technicalRequirements,
    suggestedBOM,
    suggestedCode: normalizeText(output.suggestedCode),
    confidenceScore: normalizeConfidenceScore(output.confidenceScore),
  };
}
