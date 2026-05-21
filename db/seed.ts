import { nanoid } from 'nanoid';
import { getDb } from './client';

interface SeedCompany {
  name: string;
  sector: string;
  workflowCategory: string;
  stage: string;
  geography: string;
  website: string;
  description: string;
  profile: {
    problem: string;
    customer: string;
    aiUseCase: string;
    dataMoatPotential: string;
    businessModel: string;
    fundingStage: string;
    competitiveLandscape: string;
    risks: string[];
  };
}

const SEED_COMPANIES: SeedCompany[] = [
  {
    name: 'ClaimPilot AI',
    sector: 'Healthcare',
    workflowCategory: 'Revenue Cycle',
    stage: 'Seed',
    geography: 'United States',
    website: 'https://claimpilot.ai',
    description: 'ClaimPilot AI automates the end-to-end healthcare claims denial management workflow using AI agents that analyze payer decisions, draft appeal letters, and manage follow-up communications — reducing denial write-offs by 40% for mid-size provider groups.',
    profile: {
      problem: 'Healthcare providers lose $300B+ annually to claim denials. Manual denial management is labor-intensive, slow, and error-prone — most denials go unappealed despite strong cases.',
      customer: 'Mid-size provider groups and hospital billing departments with 50–500 beds',
      aiUseCase: 'Agentic AI that reads EOB documents, classifies denial reasons, drafts payer-specific appeal letters, and tracks follow-up across the claims lifecycle',
      dataMoatPotential: 'High — proprietary claims resolution data and payer response patterns create compounding accuracy advantages over time',
      businessModel: 'SaaS subscription + performance-based fee on recovered revenue',
      fundingStage: 'Seed ($3M)',
      competitiveLandscape: 'Competes with Waystar, Experian Health RCM, and manual billing services; differentiated by full workflow automation vs. point tools',
      risks: ['EHR integration complexity with legacy systems', 'Dependence on payer data formats that change frequently', 'Long enterprise sales cycles with hospital procurement'],
    },
  },
  {
    name: 'CareNav AI',
    sector: 'Healthcare',
    workflowCategory: 'Clinical Ops',
    stage: 'Series A',
    geography: 'United States',
    website: 'https://carenav.ai',
    description: 'CareNav AI is a patient intake and care navigation platform that uses conversational AI to triage patients, gather structured clinical history, and route them to the right care pathway — reducing intake time by 60% and no-show rates by 25%.',
    profile: {
      problem: 'Healthcare systems waste clinical staff time on manual intake, scheduling, and care routing — leading to patient leakage, no-shows, and poor care matching',
      customer: 'Multi-specialty outpatient clinics and health systems with high patient volume',
      aiUseCase: 'Conversational AI agent for patient intake, structured symptom collection, insurance verification, and intelligent care pathway routing',
      dataMoatPotential: 'Medium — patient interaction data improves routing accuracy; defensibility depends on EHR integration depth',
      businessModel: 'Per-seat SaaS for clinical staff + per-patient-encounter pricing',
      fundingStage: 'Series A ($12M)',
      competitiveLandscape: 'Competes with Kyruus, Relatient, and health system internal tools; differentiated by AI-first conversational intake vs. form-based workflows',
      risks: ['HIPAA compliance complexity for conversational AI', 'Patient adoption resistance to AI-driven intake', 'Integration requirements with 20+ major EHR systems'],
    },
  },
  {
    name: 'DenialGuard AI',
    sector: 'Healthcare',
    workflowCategory: 'Revenue Cycle',
    stage: 'Pre-Seed',
    geography: 'United States',
    website: 'https://denialguard.ai',
    description: 'DenialGuard AI predicts claim denials before submission using ML models trained on historical payer behavior, enabling billing teams to preemptively fix issues and increase first-pass acceptance rates above 95%.',
    profile: {
      problem: 'Healthcare providers submit millions of claims that get denied preventably — the cost to rework denied claims averages $25 per claim and delays cash flow by 60+ days',
      customer: 'Hospital revenue cycle departments and large medical group billing teams',
      aiUseCase: 'Predictive denial prevention — ML models score each claim pre-submission for denial risk by payer and denial reason, with automated fix recommendations',
      dataMoatPotential: 'High — payer-specific denial models improve with claim volume and create switching costs for providers with large historical datasets',
      businessModel: 'SaaS subscription based on monthly claim volume',
      fundingStage: 'Pre-Seed ($1.5M)',
      competitiveLandscape: 'Early market with limited direct competition; adjacent to Olive AI (now defunct), Waystar, and Change Healthcare analytics products',
      risks: ['Requires large clean claims dataset to train models — cold start problem for new customers', 'Regulatory risk around AI-driven billing decisions', 'Market awareness is low for predictive vs. reactive denial management'],
    },
  },
  {
    name: 'AuthBridge AI',
    sector: 'Healthcare',
    workflowCategory: 'Prior Auth',
    stage: 'Seed',
    geography: 'United States',
    website: 'https://authbridge.ai',
    description: 'AuthBridge AI automates prior authorization requests across all major payers using AI agents that pull clinical documentation, complete payer-specific forms, submit requests, and track approval status in real time.',
    profile: {
      problem: 'Prior authorization is the #1 administrative burden in US healthcare — physicians spend 16 hours/week on PA, and 94% say it delays necessary care',
      customer: 'Specialty practices (oncology, orthopedics, cardiology) and health systems with high PA volume',
      aiUseCase: 'AI agent that reads clinical notes, maps to payer criteria, assembles supporting documentation, submits PA requests via payer portals, and manages appeals',
      dataMoatPotential: 'High — payer-specific approval criteria and clinical documentation patterns create a compounding knowledge base',
      businessModel: 'Per-authorization fee + monthly platform fee',
      fundingStage: 'Seed ($4M)',
      competitiveLandscape: 'Competes with Cohere Health, Rhyme, and Infinitus; differentiated by full end-to-end automation vs. assisted workflows',
      risks: ['Payer portal access and screen-scraping reliability', 'Clinical documentation quality variance across provider systems', 'Regulatory scrutiny around AI in clinical decision support adjacent workflows'],
    },
  },
  {
    name: 'TrialForge AI',
    sector: 'Life Sciences',
    workflowCategory: 'Drug Discovery',
    stage: 'Series A',
    geography: 'United States',
    website: 'https://trialforge.ai',
    description: 'TrialForge AI accelerates clinical trial design and site selection using AI that analyzes real-world patient data, protocol feasibility, and site performance history to cut trial startup time by 40%.',
    profile: {
      problem: 'Clinical trial startups take 18-24 months on average — site selection, protocol design, and patient recruitment planning are manual, siloed, and slow',
      customer: 'CROs and mid-to-large pharma/biotech clinical operations teams',
      aiUseCase: 'AI platform for trial design optimization: site scoring, enrollment feasibility modeling, protocol risk identification, and competitive intelligence on similar trials',
      dataMoatPotential: 'High — proprietary site performance database and trial outcome data create defensible benchmarks unavailable from public sources',
      businessModel: 'Annual SaaS subscription per trial + professional services for protocol design',
      fundingStage: 'Series A ($15M)',
      competitiveLandscape: 'Competes with Medidata, Veeva Vault CTMS, and site intelligence vendors; differentiated by AI-first trial design vs. data management tools',
      risks: ['Data licensing costs for real-world patient data', 'Pharma procurement cycles are 12-18 months', 'Regulatory acceptance of AI-assisted trial design is still evolving'],
    },
  },
  {
    name: 'BioProtocol AI',
    sector: 'Life Sciences',
    workflowCategory: 'Lab Ops',
    stage: 'Seed',
    geography: 'United States',
    website: 'https://bioprotocol.ai',
    description: 'BioProtocol AI generates, optimizes, and documents experimental protocols for wet lab teams using LLMs trained on scientific literature and internal lab data, reducing protocol design time from days to hours.',
    profile: {
      problem: 'Wet lab researchers spend 30-40% of their time on protocol documentation, literature review, and experimental design — work that is highly repetitive and knowledge-intensive',
      customer: 'Biotech R&D teams, CROs, and academic research labs with active wet lab programs',
      aiUseCase: 'LLM-powered protocol generation and optimization: literature synthesis, reagent selection, step-by-step protocol drafting, and version-controlled lab notebook integration',
      dataMoatPotential: 'Medium — proprietary protocol outcome data and lab-specific fine-tuning create switching costs after initial deployment',
      businessModel: 'Per-seat SaaS subscription for researchers',
      fundingStage: 'Seed ($3.5M)',
      competitiveLandscape: 'Emerging space; adjacent to Benchling (lab notebook), protocols.io (protocol sharing), and internal lab informatics tools',
      risks: ['Scientific accuracy requirements demand high reliability — hallucination risk in protocols is serious', 'Long sales cycle into academic institutions', 'Biotech budget volatility in funding downturns'],
    },
  },
  {
    name: 'LabOps Copilot',
    sector: 'Life Sciences',
    workflowCategory: 'Lab Ops',
    stage: 'Pre-Seed',
    geography: 'United States',
    website: 'https://labopscopilot.com',
    description: 'LabOps Copilot is an AI operations layer for biotech labs that automates equipment scheduling, reagent inventory management, and cross-team experiment coordination — reducing lab downtime by 30%.',
    profile: {
      problem: 'Biotech labs operate with fragmented tools for scheduling, inventory, and experiment tracking — leading to equipment conflicts, reagent stockouts, and research delays',
      customer: 'Biotech companies with 20-200 person R&D organizations and shared lab infrastructure',
      aiUseCase: 'AI scheduling and coordination agent that predicts equipment demand, optimizes instrument utilization, automates reagent reorder triggers, and surfaces cross-team dependencies',
      dataMoatPotential: 'Medium — lab utilization data and reagent consumption patterns improve predictions over time',
      businessModel: 'Monthly SaaS per lab (site licensing)',
      fundingStage: 'Pre-Seed ($800K)',
      competitiveLandscape: 'Niche space; competes with generic lab management software (LIMS) and spreadsheet-based scheduling; no direct AI-first competitor at scale',
      risks: ['Small initial market size — limited to well-funded biotech labs', 'Integration with diverse lab equipment APIs is complex', 'Founder-market fit dependent on deep lab operations knowledge'],
    },
  },
  {
    name: 'PathwayIQ',
    sector: 'Life Sciences',
    workflowCategory: 'Drug Discovery',
    stage: 'Seed',
    geography: 'United States',
    website: 'https://pathwayiq.com',
    description: 'PathwayIQ uses AI to map disease biology and identify novel drug targets by synthesizing pathway data, genetic associations, and published literature — reducing target identification time from 18 months to 6.',
    profile: {
      problem: 'Drug target identification is the highest-risk, most time-consuming phase of early drug discovery — failure rates are >90% and are often due to poor target selection',
      customer: 'Early-stage biotech companies and pharma R&D groups in oncology, immunology, and rare disease',
      aiUseCase: 'AI platform that synthesizes multi-omic data, disease pathway maps, genetic association data, and scientific literature to score and prioritize novel drug targets',
      dataMoatPotential: 'High — proprietary target validation datasets and pathway interaction models not available in public databases',
      businessModel: 'Annual platform license + data licensing for proprietary target datasets',
      fundingStage: 'Seed ($5M)',
      competitiveLandscape: 'Competes with BenevolentAI, Recursion Pharmaceuticals, and Insilico Medicine; differentiated by focus on target identification vs. full drug design',
      risks: ['Scientific validation of AI-identified targets requires long wet lab timelines', 'Competition from well-funded AI drug discovery platforms', 'Dependent on access to proprietary genomics and proteomics datasets'],
    },
  },
  {
    name: 'RegLens AI',
    sector: 'Financial Services',
    workflowCategory: 'Regulatory',
    stage: 'Seed',
    geography: 'United States',
    website: 'https://reglens.ai',
    description: 'RegLens AI continuously monitors regulatory changes across SEC, FINRA, CFPB, and state regulators, maps changes to internal policies, and generates compliance gap reports — replacing a process that takes compliance teams 40+ hours per regulatory update.',
    profile: {
      problem: 'Financial institutions face an accelerating pace of regulatory change — compliance teams manually track hundreds of regulatory sources and map changes to internal controls, creating risk of missed obligations',
      customer: 'Compliance and legal teams at mid-to-large broker-dealers, RIAs, and regional banks',
      aiUseCase: 'AI regulatory monitoring agent: ingests regulatory feeds, classifies changes by topic and applicability, maps to internal policy library, and generates prioritized gap analysis reports',
      dataMoatPotential: 'High — proprietary regulatory change database and institution-specific policy mapping create strong switching costs',
      businessModel: 'Annual SaaS subscription per institution + per-user seat fees',
      fundingStage: 'Seed ($4M)',
      competitiveLandscape: 'Competes with Thomson Reuters Regulatory Intelligence, Wolters Kluwer, and Ascent RegTech; differentiated by AI-first change mapping vs. manual database subscriptions',
      risks: ['Accuracy requirements are extremely high — regulatory misclassification creates legal liability', 'Long procurement cycles in regulated financial institutions', 'Regulatory landscape varies significantly by institution type and jurisdiction'],
    },
  },
  {
    name: 'KYCFlow AI',
    sector: 'Financial Services',
    workflowCategory: 'KYC',
    stage: 'Series A',
    geography: 'United States',
    website: 'https://kycflow.ai',
    description: 'KYCFlow AI automates Know Your Customer (KYC) and AML onboarding workflows for banks and fintechs — reducing customer onboarding time from 14 days to 2 and cutting compliance operations costs by 50%.',
    profile: {
      problem: 'KYC/AML onboarding is slow, expensive, and manually intensive — banks spend $50M+ annually on compliance operations, and 40% of customers abandon onboarding due to friction',
      customer: 'Banks, credit unions, and fintechs onboarding retail and SMB customers at scale',
      aiUseCase: 'AI-powered document verification, entity resolution, adverse media screening, and risk scoring — fully automated with human-in-the-loop escalation for high-risk cases',
      dataMoatPotential: 'High — proprietary fraud and risk signal database built from millions of onboarding decisions creates compounding accuracy advantages',
      businessModel: 'Per-onboarding transaction fee + annual platform subscription',
      fundingStage: 'Series A ($18M)',
      competitiveLandscape: 'Competes with Alloy, Sardine, Socure, and Jumio; differentiated by full workflow automation vs. point verification tools',
      risks: ['Regulatory risk around automated AML decision-making', 'False positive rates must be extremely low to avoid customer experience damage', 'Competitive market with well-funded incumbents'],
    },
  },
  {
    name: 'AuditTrail AI',
    sector: 'Financial Services',
    workflowCategory: 'Audit',
    stage: 'Pre-Seed',
    geography: 'United States',
    website: 'https://audittrail.ai',
    description: 'AuditTrail AI automates internal audit workflows for financial institutions — from risk assessment scoping to testing procedures to findings documentation — reducing audit cycle time by 35%.',
    profile: {
      problem: 'Internal audit teams in financial institutions manually execute hundreds of audit procedures, document findings in Word and Excel, and track remediation in disconnected systems — creating risk of gaps and inefficiency',
      customer: 'Internal audit departments at regional banks, insurance companies, and asset managers with 10-100 person audit teams',
      aiUseCase: 'AI audit workflow automation: risk-based scoping recommendations, automated control testing against transaction data, AI-generated findings documentation, and remediation tracking',
      dataMoatPotential: 'Medium — audit finding patterns and control effectiveness data improve AI recommendations over time',
      businessModel: 'Annual SaaS subscription per audit department',
      fundingStage: 'Pre-Seed ($1.2M)',
      competitiveLandscape: 'Competes with AuditBoard, Workiva, and TeamMate+; differentiated by AI-native workflow automation vs. document management and reporting tools',
      risks: ['Audit findings require high accuracy — AI errors could create regulatory exposure', 'Internal audit buyers are conservative and slow to adopt new tools', 'Market fragmentation across institution types and regulatory frameworks'],
    },
  },
  {
    name: 'ComplianceOS',
    sector: 'Financial Services',
    workflowCategory: 'Compliance',
    stage: 'Seed',
    geography: 'United States',
    website: 'https://complianceos.com',
    description: 'ComplianceOS is an AI-native compliance management platform for investment advisers and broker-dealers that automates annual review workflows, policy management, training tracking, and regulatory filing preparation.',
    profile: {
      problem: 'RIAs and broker-dealers manage compliance on spreadsheets and shared drives — CCOs spend 60%+ of their time on administrative compliance tasks rather than strategic risk management',
      customer: 'Chief Compliance Officers and compliance teams at RIAs and broker-dealers with $100M-$5B AUM',
      aiUseCase: 'AI compliance workflow platform: policy document management with AI-assisted updates, automated employee training tracking, annual review checklist generation, and Form ADV/BD preparation assistance',
      dataMoatPotential: 'Medium — institutional compliance data and policy libraries create switching costs after 12+ months of use',
      businessModel: 'Annual SaaS subscription tiered by AUM and number of employees',
      fundingStage: 'Seed ($3M)',
      competitiveLandscape: 'Competes with Smarsh, ComplySci, and RIA-in-a-Box; differentiated by AI-native workflow automation vs. surveillance and recordkeeping tools',
      risks: ['Crowded compliance software market with strong incumbents', 'RIA compliance budgets are highly constrained', 'Product scope must balance breadth (to win) against depth (to deliver value)'],
    },
  },
  {
    name: 'VertexCare',
    sector: 'Healthcare',
    workflowCategory: 'Value-Based Care',
    stage: 'Seed',
    geography: 'United States',
    website: 'https://vertexcare.ai',
    description: 'VertexCare uses AI to help primary care practices succeed under value-based care contracts by identifying care gaps, predicting high-risk patients, and automating quality measure documentation to maximize shared savings payments.',
    profile: {
      problem: 'Primary care practices that take value-based care risk contracts struggle to operationalize population health management — care gap closure and quality measure reporting are manual and reactive',
      customer: 'Independent primary care practices and small health systems in ACO and Medicare Advantage value-based contracts',
      aiUseCase: 'AI population health co-pilot: real-time risk stratification, automated care gap identification across attributed patients, quality measure coding assistance, and shared savings projection modeling',
      dataMoatPotential: 'High — claims and clinical data from value-based contracts creates proprietary population risk models that improve with each contract year',
      businessModel: 'Per-attributed-patient monthly fee + percentage of incremental shared savings',
      fundingStage: 'Seed ($5M)',
      competitiveLandscape: 'Competes with Arcadia, Innovaccer, and health system internal analytics; differentiated by focus on independent primary care vs. large health system tools',
      risks: ['Revenue model tied to shared savings is long-cycle and uncertain', 'Requires EHR and payer data integration at each practice', 'Value-based care contract adoption varies significantly by market'],
    },
  },
  {
    name: 'NovaTrial',
    sector: 'Life Sciences',
    workflowCategory: 'Clinical Finance',
    stage: 'Pre-Seed',
    geography: 'United States',
    website: 'https://novatrial.ai',
    description: 'NovaTrial AI automates clinical trial budget modeling, site payment tracking, and grant milestone reporting for biotech sponsors and CROs — reducing finance team overhead by 50% and eliminating site payment delays.',
    profile: {
      problem: 'Clinical trial financial operations are run on spreadsheets — budget modeling is manual, site payment processing is delayed, and grant milestone reporting takes weeks rather than days',
      customer: 'Finance and clinical operations teams at early-stage biotech companies ($10M-$200M raised) running 1-5 active trials',
      aiUseCase: 'AI financial automation for clinical trials: intelligent budget-to-actual reconciliation, AI-assisted site payment verification, automated milestone tracking, and grant reporting document generation',
      dataMoatPotential: 'Medium — trial budget benchmarks and site payment rate data create useful industry comparisons over time',
      businessModel: 'Annual SaaS subscription per active trial + professional services for budget modeling',
      fundingStage: 'Pre-Seed ($900K)',
      competitiveLandscape: 'Niche market; adjacent to Medidata (enterprise), BioAtla (large pharma), and manual Excel-based processes; no AI-first clinical finance tool at scale',
      risks: ['Narrow initial ICP limits market size — must expand from clinical finance to broader trial ops', 'Customer acquisition depends on CRO and biotech network effects', 'Biotech funding environment affects customer budgets directly'],
    },
  },
];

export function seedDatabase() {
  const db = getDb();

  const companyCount = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number }).count;
  if (companyCount > 0) {
    return;
  }

  const insertCompany = db.prepare(`
    INSERT INTO companies (id, name, sector, workflowCategory, stage, geography, website, description, status, sourceType, createdAt)
    VALUES (@id, @name, @sector, @workflowCategory, @stage, @geography, @website, @description, @status, @sourceType, @createdAt)
  `);

  const insertProfile = db.prepare(`
    INSERT INTO ai_profiles (id, companyId, problem, customer, aiUseCase, dataMoatPotential, businessModel, fundingStage, competitiveLandscape, risks, extractedAt)
    VALUES (@id, @companyId, @problem, @customer, @aiUseCase, @dataMoatPotential, @businessModel, @fundingStage, @competitiveLandscape, @risks, @extractedAt)
  `);

  const seedAll = db.transaction(() => {
    for (const company of SEED_COMPANIES) {
      const companyId = nanoid();
      const now = new Date().toISOString();

      insertCompany.run({
        id: companyId,
        name: company.name,
        sector: company.sector,
        workflowCategory: company.workflowCategory,
        stage: company.stage,
        geography: company.geography,
        website: company.website,
        description: company.description,
        status: 'New',
        sourceType: 'seed',
        createdAt: now,
      });

      insertProfile.run({
        id: nanoid(),
        companyId,
        problem: company.profile.problem,
        customer: company.profile.customer,
        aiUseCase: company.profile.aiUseCase,
        dataMoatPotential: company.profile.dataMoatPotential,
        businessModel: company.profile.businessModel,
        fundingStage: company.profile.fundingStage,
        competitiveLandscape: company.profile.competitiveLandscape,
        risks: JSON.stringify(company.profile.risks),
        extractedAt: now,
      });
    }
  });

  seedAll();
}
