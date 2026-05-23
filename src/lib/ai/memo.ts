import { getAnthropicClient } from './client';
import { MEMO_SYSTEM_PROMPT } from './prompts';
import type { Company, AIProfile, ThesisFitAnalysis } from '../types';

function buildUserMessage(
  company: Company,
  profile: AIProfile,
  fit: ThesisFitAnalysis
): string {
  return `Generate an internal sourcing memo for this company.

Company: ${company.name}
Sector: ${company.sector}
Workflow: ${company.workflowCategory}
Stage: ${company.stage}
Geography: ${company.geography}
Description: ${company.description}

Profile:
- Problem: ${profile.problem}
- Customer: ${profile.customer}
- AI Use Case: ${profile.aiUseCase}
- Data Moat Potential: ${profile.dataMoatPotential}
- Business Model: ${profile.businessModel}
- Competitive Landscape: ${profile.competitiveLandscape}
- Risks: ${profile.risks.join('; ')}

Thesis Fit Analysis:
- Score: ${fit.fitScore}/100
- Recommendation: ${fit.recommendation}
- Rationale: ${fit.rationale}
- Key Risks: ${fit.keyRisks.join('; ')}
- Diligence Questions: ${fit.diligenceQuestions.join('; ')}
- Suggested Next Step: ${fit.nextStep}`;
}

/**
 * Non-streaming memo. Still used by tests and as a fallback path.
 */
export async function generateMemo(
  company: Company,
  profile: AIProfile,
  fit: ThesisFitAnalysis
): Promise<string> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: MEMO_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(company, profile, fit) }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return content.text;
}

/**
 * Streaming variant. Yields plain text chunks as they arrive from Claude.
 * The caller is responsible for concatenating them into the final memo and
 * persisting the result.
 */
export async function* streamMemo(
  company: Company,
  profile: AIProfile,
  fit: ThesisFitAnalysis
): AsyncGenerator<string, void, unknown> {
  const client = getAnthropicClient();

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: MEMO_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(company, profile, fit) }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
