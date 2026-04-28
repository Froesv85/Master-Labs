export type PiiType = 'EMAIL' | 'PHONE' | 'CPF';

export type AnonymizeResult = {
  sanitized: string;
  redactions: number;
  piiTypes: PiiType[];
};

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})-?\d{4}/g;
const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

export function anonymizePii(text: string): AnonymizeResult {
  let redactions = 0;
  const detectedTypes = new Set<PiiType>();

  const replaceAndCount = (content: string, regex: RegExp, token: string, type: PiiType) =>
    content.replace(regex, () => {
      redactions += 1;
      detectedTypes.add(type);
      return token;
    });

  let sanitized = text;
  sanitized = replaceAndCount(sanitized, EMAIL_REGEX, '[EMAIL_REDACTED]', 'EMAIL');
  sanitized = replaceAndCount(sanitized, PHONE_REGEX, '[PHONE_REDACTED]', 'PHONE');
  sanitized = replaceAndCount(sanitized, CPF_REGEX, '[CPF_REDACTED]', 'CPF');

  return { sanitized, redactions, piiTypes: [...detectedTypes] };
}
