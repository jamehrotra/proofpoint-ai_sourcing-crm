import { getAnthropicClient } from './client';

const SYSTEM_PROMPT = `You convert a VC diligence question into a concise actionable task description for a reviewer's to-do list.

Rules:
- Output ONLY the task text. No preamble. No quotes. No trailing period.
- Start with an action verb: Investigate, Validate, Confirm, Ask, Verify, Check, Quantify, Map, Source, Pressure-test, etc.
- Keep it under 25 words.
- Preserve the specific concrete entities (company names, metrics, payers, etc.) — those are what make the task useful.
- Do not editorialize. Do not add new ideas. Just rephrase what was asked into something a reviewer can do.

Examples:

Input: "What is the net revenue retention rate and what are the primary reasons for churn or downgrade — specifically, are health systems replacing this with in-house LLM deployments?"
Output: Investigate NRR and reasons for churn — confirm whether health systems are replacing this with in-house LLM deployments

Input: "Does the company have proprietary clinical data flywheel or is the AI a thin wrapper over Foundation Model APIs?"
Output: Validate whether the clinical data flywheel is proprietary or whether the AI is a thin Foundation Model wrapper

Input: "Who is the actual economic buyer at the health system — the CMIO, CFO, or CIO?"
Output: Confirm the economic buyer persona — CMIO, CFO, or CIO`;

export async function rewriteDiligenceAsAction(question: string): Promise<string> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 120,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: question }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Trim trailing period if Claude adds one despite instructions.
  return content.text.trim().replace(/\.$/, '');
}
