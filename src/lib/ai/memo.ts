import { getAnthropicClient } from './client';
import { MEMO_SYSTEM_PROMPT } from './prompts';
import type { Company, AIProfile, ThesisFitAnalysis } from '../types';

export async function generateMemo(
  company: Company,
  profile: AIProfile,
  fit: ThesisFitAnalysis
): Promise<string> {
  const client = getAnthropicClient();

  const userMessage = `Generate an internal sourcing memo for this company.

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

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: MEMO_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return content.text;
}
