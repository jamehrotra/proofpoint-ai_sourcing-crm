# Proofpoint Signal Scout

AI-powered sourcing workflow prototype for Vertical AI venture investing at Proofpoint Capital.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The database seeds automatically on first start — no manual setup needed.

## What It Does

Signal Scout is an internal sourcing cockpit that lets a Proofpoint team member:

1. **Scan** — configure a sourcing scan by sector, workflow, and thesis prompt
2. **Surface** — AI reasons over a curated company corpus and surfaces the best fits
3. **Structure** — AI extracts a structured company profile from raw source material
4. **Review** — inspect AI-generated profiles and thesis-fit analysis
5. **Route** — add reviewer notes, set status, and move opportunities through the pipeline

## Scan Modes

- **Search for Companies** — runs AI thesis-fit scoring against a seeded corpus of 14 Vertical AI companies across healthcare, life sciences, and financial services
- **Analyze Given Data** — paste any raw text (website copy, article, blurb) and AI extracts a structured company profile + thesis-fit score

## AI Behaviors

1. **Source-to-profile extraction** — converts messy source text into a structured JSON company profile
2. **Thesis-fit scoring** — scores each company against your thesis prompt and returns a recommendation (Priority / Watch / Pass) with rationale and diligence questions
3. **Internal sourcing memo** — generates a 300-500 word internal investment memo per company on demand

## Stack

- **Next.js 14** (App Router) + TypeScript
- **SQLite** via `better-sqlite3` — zero-config local DB
- **Anthropic Claude** (`claude-sonnet-4-6`) for all AI behaviors
- **shadcn/ui** + Tailwind CSS
- **Zod** for AI output validation

## Environment Variables

```
ANTHROPIC_API_KEY=your_key_here
WEB_SEARCH_PROVIDER=mock   # mock | tavily | exa (only mock implemented)
```

## API Smoke Tests

```bash
# List all companies
curl http://localhost:3000/api/companies

# Get company detail
curl http://localhost:3000/api/companies/<id>

# Update review decision
curl -X PATCH http://localhost:3000/api/review/<id> \
  -H "Content-Type: application/json" \
  -d '{"status":"Priority","reviewerNotes":"Strong team","nextStep":"Schedule intro call"}'

# Test AI extraction
curl -X POST http://localhost:3000/api/ai/extract \
  -H "Content-Type: application/json" \
  -d '{"rawText":"ClaimPilot AI automates healthcare revenue cycle workflows using AI agents..."}'
```

## What I Would Build Next

- Live web search connector (Tavily/Exa) to replace mock
- Scan history — view past scans and their surfaced companies
- Bulk status actions on the queue table
- Export sourcing memo to PDF
- Real auth (Clerk or similar)
