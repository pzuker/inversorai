import type { AIProviderOutput } from '../ports/index.js';

export const OUTPUT_SCHEMA_VERSION = '1.0';

const VALID_ACTIONS = ['BUY', 'HOLD', 'SELL'] as const;
const VALID_HORIZONS = ['SHORT', 'MID', 'LONG'] as const;
const VALID_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;

type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function validateInvestmentInsightOutput(
  obj: unknown
): ValidationResult<AIProviderOutput> {
  if (!obj || typeof obj !== 'object') {
    return { ok: false, error: 'Output must be an object' };
  }

  const data = obj as Record<string, unknown>;

  // Validate recommendation
  if (!data['recommendation'] || typeof data['recommendation'] !== 'object') {
    return { ok: false, error: 'Missing or invalid recommendation' };
  }

  const rec = data['recommendation'] as Record<string, unknown>;

  if (!VALID_ACTIONS.includes(rec['action'] as typeof VALID_ACTIONS[number])) {
    return { ok: false, error: `Invalid action: ${rec['action']}. Must be BUY, HOLD, or SELL` };
  }

  if (typeof rec['confidenceScore'] !== 'number' || rec['confidenceScore'] < 0 || rec['confidenceScore'] > 1) {
    return { ok: false, error: 'confidenceScore must be a number between 0 and 1' };
  }

  if (!VALID_HORIZONS.includes(rec['horizon'] as typeof VALID_HORIZONS[number])) {
    return { ok: false, error: `Invalid horizon: ${rec['horizon']}. Must be SHORT, MID, or LONG` };
  }

  if (!VALID_RISK_LEVELS.includes(rec['riskLevel'] as typeof VALID_RISK_LEVELS[number])) {
    return { ok: false, error: `Invalid riskLevel: ${rec['riskLevel']}. Must be LOW, MEDIUM, or HIGH` };
  }

  // Validate insight
  if (!data['insight'] || typeof data['insight'] !== 'object') {
    return { ok: false, error: 'Missing or invalid insight' };
  }

  const insight = data['insight'] as Record<string, unknown>;

  if (typeof insight['summary'] !== 'string' || insight['summary'].trim() === '') {
    return { ok: false, error: 'summary must be a non-empty string' };
  }

  if (typeof insight['reasoning'] !== 'string' || insight['reasoning'].trim() === '') {
    return { ok: false, error: 'reasoning must be a non-empty string' };
  }

  if (!Array.isArray(insight['assumptions'])) {
    return { ok: false, error: 'assumptions must be an array' };
  }

  if (!Array.isArray(insight['caveats'])) {
    return { ok: false, error: 'caveats must be an array' };
  }

  // Validate model
  if (!data['model'] || typeof data['model'] !== 'object') {
    return { ok: false, error: 'Missing or invalid model' };
  }

  const model = data['model'] as Record<string, unknown>;

  if (typeof model['name'] !== 'string' || model['name'].trim() === '') {
    return { ok: false, error: 'model.name must be a non-empty string' };
  }

  if (typeof model['version'] !== 'string' || model['version'].trim() === '') {
    return { ok: false, error: 'model.version must be a non-empty string' };
  }

  return {
    ok: true,
    value: {
      recommendation: {
        action: rec['action'] as 'BUY' | 'HOLD' | 'SELL',
        confidenceScore: rec['confidenceScore'] as number,
        horizon: rec['horizon'] as 'SHORT' | 'MID' | 'LONG',
        riskLevel: rec['riskLevel'] as 'LOW' | 'MEDIUM' | 'HIGH',
      },
      insight: {
        summary: insight['summary'] as string,
        reasoning: insight['reasoning'] as string,
        assumptions: insight['assumptions'] as string[],
        caveats: insight['caveats'] as string[],
      },
      model: {
        name: model['name'] as string,
        version: model['version'] as string,
      },
    },
  };
}
