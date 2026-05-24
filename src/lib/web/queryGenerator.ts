import { getAnthropicClient } from '../ai/client';
import { parseClaudeJson } from '../ai/parse';

const SYSTEM_PROMPT = `You are a VC research analyst at Proofpoint Capital. Proofpoint invests exclusively in Vertical AI — startups using AI to dominate a single industry vertical (healthcare, life sciences, financial services), not horizontal/general-purpose AI tools.

Given an investment thesis, you produce 3-5 highly specific web search queries that will surface concrete, named startups matching that thesis.

CRITICAL RULES:
- Output ONLY a JSON array of strings. No preamble, no markdown fences, no trailing prose.
- Each query is 5-12 words. Use natural search-engine language (no boolean operators, no quotes).
- Every query must contain words that bias toward STARTUPS and toward the SPECIFIC VERTICAL — never write generic queries like "AI workflow startup" or "best AI tools".
- Include at least one query that names the SECTOR explicitly (e.g. "healthcare", "biotech", "fintech", "insurtech", "legaltech").
- Include at least one query that names a CONCRETE WORKFLOW or USE CASE the thesis is about (e.g. "claims denial", "clinical documentation", "underwriting", "drug discovery", "KYC", "prior authorization").
- Include at least one query mentioning STAGE words: "early stage", "seed", "Series A", or "YC startup" — to filter out enterprise vendors and listicles about big companies.
- Vary the angle across queries: one focused on the product/workflow, one on funding/stage, one on competitive landscape ("alternatives to X" or "vs Y").
- NEVER use these words: "VC", "venture capital", "investor", "fund", "ecosystem". They return investor news, not companies.
- NEVER write meta-questions like "what are the best..." — that returns articles, not company sites.

EXAMPLES

Input thesis: "Find early-stage Vertical AI companies in healthcare that own a high-friction administrative workflow."
Output: [
  "early stage healthcare AI startup revenue cycle automation",
  "seed Series A AI prior authorization startup",
  "healthcare administrative workflow AI company YC",
  "AI medical billing automation startup 2025",
  "clinical documentation AI scribe startup seed"
]

Input thesis: "Find Vertical AI in financial services for SMB underwriting and fraud."
Output: [
  "early stage AI SMB underwriting fintech startup",
  "AI fraud detection fintech Series A",
  "alternative credit scoring AI startup seed",
  "AI loan origination platform fintech YC",
  "machine learning fraud prevention startup 2025"
]

Input thesis: "Vertical AI for clinical trial operations in biotech."
Output: [
  "AI clinical trial operations startup biotech",
  "early stage clinical trial automation Series A",
  "AI patient recruitment clinical trials startup",
  "biotech AI trial site selection startup seed",
  "clinical trial AI platform YC 2025"
]`;

export async function generateSearchQueries(
  thesis: string,
  sector?: string,
  workflow?: string
): Promise<string[]> {
  const client = getAnthropicClient();

  const sectorHint = sector && sector !== 'Any' ? `\n\nUser-selected sector filter: ${sector} (every query MUST mention this sector or a sector-specific term).` : '';
  const workflowHint = workflow && workflow !== 'Any' ? `\nUser-selected workflow filter: ${workflow} (at least 2 queries should mention this workflow or a synonym).` : '';

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Thesis:\n${thesis}${sectorHint}${workflowHint}` }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const parsed = parseClaudeJson<unknown>(content.text);
  if (!Array.isArray(parsed)) {
    throw new Error('Query generator did not return an array');
  }
  const queries = parsed.filter((q): q is string => typeof q === 'string' && q.length > 0);
  if (queries.length === 0) {
    throw new Error('Query generator returned no usable queries');
  }
  return queries.slice(0, 5);
}
