import OpenAI from 'openai';
import type { AIProviderPort, AIProviderInput, AIProviderOutput } from '../../application/ports/index.js';

const PROMPT_TEMPLATE = `You are a financial analysis AI assistant. Based on the market analysis data provided, generate an investment insight and recommendation.

IMPORTANT: You must respond ONLY with valid JSON in the exact format specified below. Do not include any other text, markdown, or explanation outside the JSON.

Market Analysis Data:
- Asset: {{assetSymbol}}
- As of: {{asOf}}
- Resolution: {{resolution}}
- Trend: {{trend}}
- Signal Strength: {{signalStrength}}/100
- KPIs: {{kpis}}
- Rationale: {{rationale}}

Required JSON Response Format:
{
  "recommendation": {
    "action": "BUY" | "HOLD" | "SELL",
    "confidenceScore": <number between 0 and 1>,
    "horizon": "SHORT" | "MID" | "LONG",
    "riskLevel": "LOW" | "MEDIUM" | "HIGH"
  },
  "insight": {
    "summary": "<brief 1-2 sentence summary>",
    "reasoning": "<detailed reasoning for the recommendation>",
    "assumptions": ["<assumption 1>", "<assumption 2>", ...],
    "caveats": ["<caveat 1>", "<caveat 2>", ...]
  },
  "model": {
    "name": "gpt-4o-mini",
    "version": "2024-07-18"
  }
}

Respond with ONLY the JSON object, no other text.`;

/**
 * Sanitizes user-provided input to prevent prompt injection attacks.
 * - Removes control tokens and template delimiters: { } < > and triple backticks
 * - Caps length at 2000 characters to prevent prompt stuffing
 */
export function sanitize(input: string): string {
  const MAX_LENGTH = 2000;

  // Remove curly braces, angle brackets, and triple backticks
  let sanitized = input
    .replace(/[{}]/g, '')
    .replace(/[<>]/g, '')
    .replace(/```/g, '');

  // Cap length
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }

  return sanitized;
}

export class OpenAIProvider implements AIProviderPort {
  private client: OpenAI;
  private promptVersion: string;

  constructor(promptVersion: string = '1.0') {
    const apiKey = process.env['OPENAI_API_KEY'];
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({ apiKey });
    this.promptVersion = promptVersion;
  }

  async generateInvestmentInsight(input: AIProviderInput): Promise<AIProviderOutput> {
    const prompt = this.buildPrompt(input);

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a financial analysis AI. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error(`OpenAI response is not valid JSON: ${content.substring(0, 200)}`);
    }

    return parsed as AIProviderOutput;
  }

  private buildPrompt(input: AIProviderInput): string {
    return PROMPT_TEMPLATE
      .replace('{{assetSymbol}}', sanitize(input.assetSymbol))
      .replace('{{asOf}}', sanitize(input.asOf))
      .replace('{{resolution}}', sanitize(input.resolution))
      .replace('{{trend}}', sanitize(input.trend))
      .replace('{{signalStrength}}', sanitize(String(input.signalStrength)))
      .replace('{{kpis}}', sanitize(JSON.stringify(input.kpis)))
      .replace('{{rationale}}', sanitize(input.rationale));
  }

  getPromptVersion(): string {
    return this.promptVersion;
  }
}
