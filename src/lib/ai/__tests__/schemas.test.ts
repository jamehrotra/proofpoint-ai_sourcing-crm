import { describe, it, expect } from 'vitest';
import { z } from 'zod';

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

const ThesisFitSchema = z.object({
  thesisFitScore: z.number().int().min(0).max(100),
  recommendation: z.enum(['Priority', 'Watch', 'Pass']),
  rationale: z.string().min(1),
  keyRisks: z.array(z.string()).min(1),
  diligenceQuestions: z.array(z.string()).min(1),
  nextStep: z.string().min(1),
});

describe('AIProfileSchema', () => {
  it('accepts a valid profile', () => {
    const valid = {
      companyName: 'ClaimPilot AI',
      sector: 'Healthcare',
      workflowCategory: 'Revenue Cycle Management',
      customer: 'Provider billing teams',
      problem: 'Manual denial management',
      aiUseCase: 'Agentic claims automation',
      dataMoatPotential: 'High',
      stageEstimate: 'Seed',
      risks: ['EHR integration complexity'],
    };
    expect(AIProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a profile missing required fields', () => {
    const invalid = { companyName: 'Test', sector: 'Healthcare' };
    expect(AIProfileSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects a profile with empty risks array', () => {
    const invalid = {
      companyName: 'Test',
      sector: 'Healthcare',
      workflowCategory: 'Rev Cycle',
      customer: 'Hospitals',
      problem: 'Some problem',
      aiUseCase: 'Some AI',
      dataMoatPotential: 'Medium',
      stageEstimate: 'Seed',
      risks: [],
    };
    expect(AIProfileSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('ThesisFitSchema', () => {
  it('accepts a valid thesis fit result', () => {
    const valid = {
      thesisFitScore: 86,
      recommendation: 'Priority',
      rationale: 'Strong alignment with Vertical AI thesis.',
      keyRisks: ['EHR integration dependency'],
      diligenceQuestions: ['Does usage generate proprietary data?'],
      nextStep: 'Schedule founder intro call.',
    };
    expect(ThesisFitSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a score above 100', () => {
    const invalid = {
      thesisFitScore: 150,
      recommendation: 'Priority',
      rationale: 'Great.',
      keyRisks: ['Risk 1'],
      diligenceQuestions: ['Q1'],
      nextStep: 'Do something.',
    };
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects an invalid recommendation value', () => {
    const invalid = {
      thesisFitScore: 70,
      recommendation: 'Maybe',
      rationale: 'Some rationale.',
      keyRisks: ['Risk 1'],
      diligenceQuestions: ['Q1'],
      nextStep: 'Do something.',
    };
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects empty diligenceQuestions array', () => {
    const invalid = {
      thesisFitScore: 70,
      recommendation: 'Watch',
      rationale: 'Some rationale.',
      keyRisks: ['Risk 1'],
      diligenceQuestions: [],
      nextStep: 'Do something.',
    };
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });
});
