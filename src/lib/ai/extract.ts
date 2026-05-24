import { z } from 'zod';
import { getAnthropicClient } from './client';
import { EXTRACT_SYSTEM_PROMPT } from './prompts';
import { parseClaudeJson } from './parse';
import type { AIProfileInput } from '../types';

const AIProfileSchema = z.object({
  companyName: z.string().min(1),
  sector: z.string().min(1),
  workflowCategory: z.string().min(1),
  customer: z.string().min(1),
  problem: z.string().min(1),
  aiUseCase: z.string().min(1),
  dataMoatPotential: z.string().min(1),
  stageEstimate: z.string().min(1),
  businessModel: z.string().optional().default(''),
  fundingStage: z.string().optional().default('Unknown'),
  competitiveLandscape: z.string().optional().default(''),
  risks: z.array(z.string()).min(1),
});

export type ExtractSourceKind = 'company-site' | 'news-article' | 'pasted-text' | 'pdf';

const SOURCE_HINTS: Record<ExtractSourceKind, string> = {
  'company-site':
    'The text below is from a company\'s own website. Extract the company being described.',
  'news-article':
    'The text below is from a NEWS ARTICLE about a startup. Find the SPECIFIC startup being discussed (look for names that appear with funding amounts, founders, or product descriptions). If the article covers multiple companies, pick the one with the most detail. DO NOT use the article title or section header as the companyName.',
  'pasted-text':
    'The text below was pasted by a user. Extract whatever company is described.',
  'pdf':
    'The text below was extracted from a PDF (likely a pitch deck or one-pager). Extract the company being described.',
};

export async function extractProfile(
  rawText: string,
  sourceKind: ExtractSourceKind = 'pasted-text'
): Promise<AIProfileInput> {
  const client = getAnthropicClient();

  const hint = SOURCE_HINTS[sourceKind];
  const userMessage = `${hint}\n\n--- SOURCE TEXT ---\n${rawText}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: EXTRACT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let parsed: unknown;
  try {
    parsed = parseClaudeJson(content.text);
  } catch {
    throw new Error(`Claude returned non-JSON output: ${content.text.slice(0, 200)}`);
  }

  const result = AIProfileSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Claude returned malformed profile data: ${result.error.message}`);
  }

  // Reject obvious garbage company names (article headlines, generic phrases).
  const name = result.data.companyName.trim();
  if (isGenericCompanyName(name)) {
    throw new Error(`Extractor returned a non-company name: "${name}". The source likely lacked a clear single-company subject.`);
  }

  return result.data;
}

/**
 * Heuristic guard against obvious extractor failures where Claude returns
 * the article headline or a generic descriptor instead of a real company name.
 *
 * Intentionally conservative — we only reject names that are CLEARLY not
 * company names. False negatives (letting through a bad name) cost less than
 * false positives (rejecting a real company).
 */
function isGenericCompanyName(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (lower.length < 2) return true;

  // Exact-match generic phrases (article titles disguised as company names).
  const exactBad = new Set([
    'unknown',
    'unnamed',
    'n/a',
    'na',
    'tbd',
    'startup',
    'company',
    'fintech',
    'healthcare ai',
    'ai startup',
    'fintech startup',
    'startup funding',
  ]);
  if (exactBad.has(lower)) return true;

  // Strong "this is a headline / listicle" signals.
  const headlinePatterns = [
    /^top \d+/,
    /^best \d+/,
    /^\d+ (top|best|leading)/,
    /\b(roundup|market map|watch list|watchlist)\b/,
    /^(introducing|meet|here are|the rise of)\b/,
    /\b(top|best|leading) \d* ?(ai|startups?|companies)\b/,
  ];
  if (headlinePatterns.some((re) => re.test(lower))) return true;

  // Very long string (>10 words) is almost certainly an article headline.
  if (name.split(/\s+/).length > 10) return true;

  return false;
}
