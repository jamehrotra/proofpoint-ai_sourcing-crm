import { getAnthropicClient } from './client';

const SYSTEM_PROMPT = `You write the one-line "what this company does" tagline that appears on a VC firm's company dossier.

Rules:
- Output ONLY the description sentence. No preamble. No quotes. No trailing period.
- 1-2 sentences. Under 35 words total.
- Start with the company name followed by a present-tense verb (e.g. "Abridge captures...", "Sardine fights...").
- Be specific about WHAT the product does and WHO uses it. Avoid generic VC language like "platform" or "solution".
- If the input text is empty or unintelligible, return exactly: "No clean description available."`;

/**
 * Take noisy page text (Tavily raw_content, Jina markdown, or pasted blob)
 * and produce a clean 1-2 sentence company description for the dossier.
 */
export async function summarizeCompanyDescription(
  companyName: string,
  rawText: string
): Promise<string> {
  const client = getAnthropicClient();
  // Cap the input so we don't waste tokens on huge pages.
  const capped = rawText.slice(0, 4000);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 120,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Company name: ${companyName}\n\nRaw page text:\n${capped}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }
  return content.text.trim().replace(/\.$/, '');
}
