/**
 * Strip markdown code fences and surrounding prose from a Claude response,
 * then JSON.parse. Claude sometimes wraps JSON in ```json ... ``` despite
 * being instructed not to — this is the canonical workaround.
 */
export function parseClaudeJson<T = unknown>(rawText: string): T {
  let text = rawText.trim();

  // Strip ```json ... ``` or ``` ... ``` fences.
  const fenceMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  } else {
    // Sometimes Claude opens with prose before a JSON object — find first { and last }.
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace > 0 && lastBrace > firstBrace) {
      text = text.slice(firstBrace, lastBrace + 1);
    }
  }

  return JSON.parse(text) as T;
}
