import { getAnthropicClient } from '../ai/client';
import { parseClaudeJson } from '../ai/parse';

const SYSTEM_PROMPT = `You are reading a "Top X startups" article and extracting the company names mentioned, with a short blurb for each.

Rules:
- Output ONLY a JSON array of objects. No preamble, no markdown fences.
- Each object: { "name": string, "blurb": string }
- "name" is the company name only (no "Inc.", "Co.", no parenthetical taglines).
- "blurb" is 1 sentence describing what the company does, drawn from the article.
- Max 10 companies. Skip anything that's clearly not a company (a person, a fund, a category).
- If the article doesn't actually contain a list of companies, return an empty array.`;

export interface ExtractedCompany {
  name: string;
  blurb: string;
}

export async function extractCompaniesFromArticle(articleText: string): Promise<ExtractedCompany[]> {
  const client = getAnthropicClient();
  const capped = articleText.slice(0, 15000); // listicles can be long

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: capped }],
  });

  const content = message.content[0];
  if (content.type !== 'text') return [];

  let parsed: unknown;
  try {
    parsed = parseClaudeJson(content.text);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((entry): entry is ExtractedCompany =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as Record<string, unknown>).name === 'string' &&
      typeof (entry as Record<string, unknown>).blurb === 'string'
    )
    .slice(0, 10);
}
