import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Schema definitions (mirrors what the AI layer uses)

const DimensionItemSchema = z.object({
  verdict: z.enum(['Strong', 'Moderate', 'Weak']),
  note: z.string().min(1),
});

const ThesisDimensionsSchema = z.object({
  sectorFit: DimensionItemSchema,
  workflowOwnership: DimensionItemSchema,
  dataMoat: DimensionItemSchema,
  stageAlignment: DimensionItemSchema,
  aiNative: DimensionItemSchema,
});

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
  dimensions: ThesisDimensionsSchema,
  keyRisks: z.array(z.string()).min(1),
  diligenceQuestions: z.array(z.string()).min(1),
  nextStep: z.string().min(1),
});

// enforceRecommendation logic (mirrors score.ts)
function enforceRecommendation(data: z.infer<typeof ThesisFitSchema>): z.infer<typeof ThesisFitSchema> {
  const dims = Object.values(data.dimensions);
  const strongCount = dims.filter((d) => d.verdict === 'Strong').length;
  const weakCount = dims.filter((d) => d.verdict === 'Weak').length;

  const hasSectorStrong = data.dimensions.sectorFit.verdict === 'Strong';
  const hasWorkflowOrMoatStrong =
    data.dimensions.workflowOwnership.verdict === 'Strong' ||
    data.dimensions.dataMoat.verdict === 'Strong';

  let recommendation = data.recommendation;
  let score = data.thesisFitScore;

  if (recommendation === 'Priority' && !(strongCount >= 3 && hasSectorStrong && hasWorkflowOrMoatStrong)) {
    recommendation = 'Watch';
    score = Math.min(score, 84);
  }

  if (strongCount === 0) {
    recommendation = 'Pass';
    score = Math.min(score, 59);
  }

  if (weakCount >= 3 && recommendation === 'Watch') {
    recommendation = 'Pass';
    score = Math.min(score, 59);
  }

  return { ...data, recommendation, thesisFitScore: score };
}

// Helpers
function makeDim(verdict: 'Strong' | 'Moderate' | 'Weak') {
  return { verdict, note: `Evidence note for ${verdict}` };
}

function makeFit(
  overrides: Partial<z.infer<typeof ThesisFitSchema>> = {}
): z.infer<typeof ThesisFitSchema> {
  return {
    thesisFitScore: 80,
    recommendation: 'Watch',
    rationale: 'Solid fit with one gap.',
    dimensions: {
      sectorFit: makeDim('Strong'),
      workflowOwnership: makeDim('Strong'),
      dataMoat: makeDim('Strong'),
      stageAlignment: makeDim('Moderate'),
      aiNative: makeDim('Moderate'),
    },
    keyRisks: ['Integration complexity', 'Competitive market'],
    diligenceQuestions: ['Does the product own the workflow end-to-end?'],
    nextStep: 'Schedule founder intro call.',
    ...overrides,
  };
}

// ─── AIProfileSchema ───────────────────────────────────────────────────────

describe('AIProfileSchema', () => {
  it('accepts a fully valid profile', () => {
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

  it('accepts a profile with all optional fields supplied', () => {
    const valid = {
      companyName: 'ClaimPilot AI',
      sector: 'Healthcare',
      workflowCategory: 'Revenue Cycle',
      customer: 'Hospitals',
      problem: 'Manual billing errors',
      aiUseCase: 'LLM claims review',
      dataMoatPotential: 'High',
      stageEstimate: 'Series A',
      businessModel: 'Per-claim SaaS',
      fundingStage: 'Series A',
      competitiveLandscape: 'Competes with Change Healthcare',
      risks: ['EHR integration', 'Payer rate pressure'],
    };
    expect(AIProfileSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a profile missing required fields', () => {
    const invalid = { companyName: 'Test', sector: 'Healthcare' };
    expect(AIProfileSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects a profile with an empty risks array', () => {
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

  it('rejects a profile with an empty companyName', () => {
    const invalid = {
      companyName: '',
      sector: 'Healthcare',
      workflowCategory: 'Rev Cycle',
      customer: 'Hospitals',
      problem: 'Problem',
      aiUseCase: 'AI thing',
      dataMoatPotential: 'High',
      stageEstimate: 'Seed',
      risks: ['Risk one'],
    };
    expect(AIProfileSchema.safeParse(invalid).success).toBe(false);
  });

  it('defaults optional fields when omitted', () => {
    const input = {
      companyName: 'ClaimPilot AI',
      sector: 'Healthcare',
      workflowCategory: 'Revenue Cycle',
      customer: 'Billing teams',
      problem: 'Manual denials',
      aiUseCase: 'Agentic automation',
      dataMoatPotential: 'High',
      stageEstimate: 'Seed',
      risks: ['One risk'],
    };
    const result = AIProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.businessModel).toBe('');
      expect(result.data.fundingStage).toBe('Unknown');
      expect(result.data.competitiveLandscape).toBe('');
    }
  });
});

// ─── ThesisFitSchema ───────────────────────────────────────────────────────

describe('ThesisFitSchema', () => {
  it('accepts a valid Priority result with all 5 dimensions', () => {
    const valid = makeFit({ recommendation: 'Priority', thesisFitScore: 90 });
    expect(ThesisFitSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a Watch result', () => {
    const valid = makeFit({ recommendation: 'Watch', thesisFitScore: 72 });
    expect(ThesisFitSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a Pass result with score 0', () => {
    const valid = makeFit({ recommendation: 'Pass', thesisFitScore: 0 });
    expect(ThesisFitSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a score above 100', () => {
    const invalid = makeFit({ thesisFitScore: 101 });
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects a score below 0', () => {
    const invalid = makeFit({ thesisFitScore: -1 });
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects a non-integer score', () => {
    const invalid = makeFit({ thesisFitScore: 72.5 });
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects an invalid recommendation value', () => {
    const invalid = { ...makeFit(), recommendation: 'Maybe' as never };
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects empty diligenceQuestions array', () => {
    const invalid = makeFit({ diligenceQuestions: [] });
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects empty keyRisks array', () => {
    const invalid = makeFit({ keyRisks: [] });
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects a dimension verdict outside the allowed enum', () => {
    const invalid = {
      ...makeFit(),
      dimensions: {
        ...makeFit().dimensions,
        sectorFit: { verdict: 'High' as never, note: 'Good sector' },
      },
    };
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects a dimension with an empty note', () => {
    const invalid = {
      ...makeFit(),
      dimensions: {
        ...makeFit().dimensions,
        sectorFit: { verdict: 'Strong' as const, note: '' },
      },
    };
    expect(ThesisFitSchema.safeParse(invalid).success).toBe(false);
  });
});

// ─── enforceRecommendation ─────────────────────────────────────────────────

describe('enforceRecommendation', () => {
  it('keeps Priority when conditions are met (3+ Strong, sectorFit Strong, workflowOwnership Strong)', () => {
    const input = makeFit({ recommendation: 'Priority', thesisFitScore: 90 });
    const result = enforceRecommendation(input);
    expect(result.recommendation).toBe('Priority');
    expect(result.thesisFitScore).toBe(90);
  });

  it('downgrades Priority → Watch when fewer than 3 Strong dims', () => {
    const input = makeFit({
      recommendation: 'Priority',
      thesisFitScore: 90,
      dimensions: {
        sectorFit: makeDim('Strong'),
        workflowOwnership: makeDim('Strong'),
        dataMoat: makeDim('Moderate'),
        stageAlignment: makeDim('Moderate'),
        aiNative: makeDim('Moderate'),
      },
    });
    const result = enforceRecommendation(input);
    expect(result.recommendation).toBe('Watch');
    expect(result.thesisFitScore).toBeLessThanOrEqual(84);
  });

  it('downgrades Priority → Watch when sectorFit is not Strong', () => {
    const input = makeFit({
      recommendation: 'Priority',
      thesisFitScore: 90,
      dimensions: {
        sectorFit: makeDim('Moderate'),
        workflowOwnership: makeDim('Strong'),
        dataMoat: makeDim('Strong'),
        stageAlignment: makeDim('Strong'),
        aiNative: makeDim('Moderate'),
      },
    });
    const result = enforceRecommendation(input);
    expect(result.recommendation).toBe('Watch');
  });

  it('downgrades Priority → Watch when neither workflowOwnership nor dataMoat is Strong', () => {
    const input = makeFit({
      recommendation: 'Priority',
      thesisFitScore: 90,
      dimensions: {
        sectorFit: makeDim('Strong'),
        workflowOwnership: makeDim('Moderate'),
        dataMoat: makeDim('Moderate'),
        stageAlignment: makeDim('Strong'),
        aiNative: makeDim('Strong'),
      },
    });
    const result = enforceRecommendation(input);
    expect(result.recommendation).toBe('Watch');
  });

  it('forces Pass when there are zero Strong dimensions', () => {
    const input = makeFit({
      recommendation: 'Watch',
      thesisFitScore: 70,
      dimensions: {
        sectorFit: makeDim('Moderate'),
        workflowOwnership: makeDim('Moderate'),
        dataMoat: makeDim('Moderate'),
        stageAlignment: makeDim('Moderate'),
        aiNative: makeDim('Moderate'),
      },
    });
    const result = enforceRecommendation(input);
    expect(result.recommendation).toBe('Pass');
    expect(result.thesisFitScore).toBeLessThanOrEqual(59);
  });

  it('forces Pass when 3+ dims are Weak and recommendation is Watch', () => {
    const input = makeFit({
      recommendation: 'Watch',
      thesisFitScore: 65,
      dimensions: {
        sectorFit: makeDim('Strong'),
        workflowOwnership: makeDim('Weak'),
        dataMoat: makeDim('Weak'),
        stageAlignment: makeDim('Weak'),
        aiNative: makeDim('Moderate'),
      },
    });
    const result = enforceRecommendation(input);
    expect(result.recommendation).toBe('Pass');
    expect(result.thesisFitScore).toBeLessThanOrEqual(59);
  });

  it('does not change Watch when conditions are reasonable (1 Strong, rest Moderate)', () => {
    const input = makeFit({
      recommendation: 'Watch',
      thesisFitScore: 65,
      dimensions: {
        sectorFit: makeDim('Strong'),
        workflowOwnership: makeDim('Moderate'),
        dataMoat: makeDim('Moderate'),
        stageAlignment: makeDim('Moderate'),
        aiNative: makeDim('Moderate'),
      },
    });
    const result = enforceRecommendation(input);
    expect(result.recommendation).toBe('Watch');
  });

  it('does not change a valid Pass', () => {
    const input = makeFit({
      recommendation: 'Pass',
      thesisFitScore: 40,
      dimensions: {
        sectorFit: makeDim('Weak'),
        workflowOwnership: makeDim('Weak'),
        dataMoat: makeDim('Weak'),
        stageAlignment: makeDim('Moderate'),
        aiNative: makeDim('Moderate'),
      },
    });
    const result = enforceRecommendation(input);
    expect(result.recommendation).toBe('Pass');
  });

  it('caps score at 84 when downgrading from Priority to Watch', () => {
    const input = makeFit({
      recommendation: 'Priority',
      thesisFitScore: 95,
      dimensions: {
        sectorFit: makeDim('Strong'),
        workflowOwnership: makeDim('Moderate'),
        dataMoat: makeDim('Moderate'),
        stageAlignment: makeDim('Strong'),
        aiNative: makeDim('Moderate'),
      },
    });
    const result = enforceRecommendation(input);
    expect(result.thesisFitScore).toBe(84);
  });

  it('caps score at 59 when forcing Pass due to zero Strongs', () => {
    const input = makeFit({
      recommendation: 'Watch',
      thesisFitScore: 75,
      dimensions: {
        sectorFit: makeDim('Moderate'),
        workflowOwnership: makeDim('Moderate'),
        dataMoat: makeDim('Moderate'),
        stageAlignment: makeDim('Moderate'),
        aiNative: makeDim('Moderate'),
      },
    });
    const result = enforceRecommendation(input);
    expect(result.thesisFitScore).toBe(59);
  });
});
