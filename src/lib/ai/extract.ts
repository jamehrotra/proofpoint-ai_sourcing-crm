import { z } from 'zod';
import { getAnthropicClient } from './client';
import { EXTRACT_SYSTEM_PROMPT } from './prompts';
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

export async function extractProfile(rawText: string): Promise<AIProfileInput> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: EXTRACT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: rawText }],
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

  const result = AIProfileSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Claude returned malformed profile data: ${result.error.message}`);
  }

  return result.data;
}
