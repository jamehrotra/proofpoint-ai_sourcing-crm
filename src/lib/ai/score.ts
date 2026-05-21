import { z } from 'zod';
import { getAnthropicClient } from './client';
import { SCORE_SYSTEM_PROMPT } from './prompts';
import type { ThesisFitInput } from '../types';

const ThesisFitSchema = z.object({
  thesisFitScore: z.number().int().min(0).max(100),
  recommendation: z.enum(['Priority', 'Watch', 'Pass']),
  rationale: z.string().min(1),
  keyRisks: z.array(z.string()).min(1),
  diligenceQuestions: z.array(z.string()).min(1),
  nextStep: z.string().min(1),
});

export type ProfileLike = {
  problem: string;
  customer: string;
  aiUseCase: string;
  dataMoatPotential: string;
  businessModel?: string;
  fundingStage?: string;
  competitiveLandscape?: string;
  risks: string[] | string;
};

export async function scoreThesisFit(profile: ProfileLike, thesisPrompt: string): Promise<ThesisFitInput> {
  const client = getAnthropicClient();

  const profileText = `
Company Profile:
- Problem: ${profile.problem}
- Customer: ${profile.customer}
- AI Use Case: ${profile.aiUseCase}
- Data Moat Potential: ${profile.dataMoatPotential}
- Business Model: ${profile.businessModel ?? ''}
- Funding Stage: ${profile.fundingStage ?? 'Unknown'}
- Competitive Landscape: ${profile.competitiveLandscape ?? ''}
- Risks: ${Array.isArray(profile.risks) ? profile.risks.join('; ') : profile.risks}
`.trim();

  const userMessage = `--- COMPANY PROFILE ---
${profileText}

--- ANALYST THESIS PROMPT ---
${thesisPrompt}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: SCORE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content.text);
  } catch {
    throw new Error(`Claude returned non-JSON output: ${content.text.slice(0, 200)}`);
  }

  const result = ThesisFitSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Claude returned malformed thesis-fit data: ${result.error.message}`);
  }

  return result.data;
}
