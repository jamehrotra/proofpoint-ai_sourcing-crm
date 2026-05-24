# Proofpoint Signal Scout

An internal sourcing cockpit for Proofpoint Capital — a VC firm investing in early-stage Vertical AI companies. Signal Scout lets a team member configure an AI-driven sourcing scan, surface candidate companies, review structured AI-generated profiles and thesis-fit analyses, override AI recommendations, capture journaled reviewer notes, and track follow-up tasks across the pipeline.

Built as a focused prototype for the Proofpoint AI/Technology Internship.

---

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The database initializes on first start and seeds three sourcing corpora automatically. The pipeline is **empty by default** — run a scan to populate it.

### Demo Accounts

Signal Scout uses mock authentication. You'll be prompted to sign in on first visit. Use one of:

| Username | Password | Display Name |
|---|---|---|
| `jmhrotra` | `proofpoint` | Jonathan Mehrotra |
| `temp` | `proofpoint` | Temporary User |

Mock auth is intentionally tiny: a hard-coded user list, a single signed cookie, no hashing. The system is structured so adding more users is a one-line change in `src/lib/auth.ts`.

---

## What It Does

A Proofpoint team member can:

1. **Scan** — choose a sourcing corpus (Q1 / Q2 / Q3 2026 Pull), set sector and workflow filters, and write a thesis prompt
2. **Surface** — AI evaluates every matching company in the corpus and routes results to Pipeline or Passed-by-AI based on its judgment
3. **Structure** — AI extracts a structured company profile from raw text (or a PDF) in the Analyze Given Data mode
4. **Review** — inspect AI-generated profiles, thesis-fit analyses, and on-demand sourcing memos
5. **Override** — accept or override AI's recommendation; overrides are tracked with a prominent on-page indicator
6. **Journal** — every "Save Decision" appends a timestamped note to the Reviewer Journal (history is preserved, never overwritten)
7. **Track follow-ups** — every "Next Step" becomes a task in a dedicated To Do page that spans all companies

---

## Workflow Mapping

The product covers all six steps in the assignment workflow:

| Step | Where it lives |
|---|---|
| **Scan** | `/scan` page — corpus picker, filters, thesis prompt |
| **Surface** | `/api/scans` route — per-company Claude evaluation, write to DB |
| **Structure** | AI behavior 1 (profile extraction) — runs in Analyze mode |
| **Review** | `/opportunity/[id]` page — full dossier with AI sections distinguished from human sections |
| **Human Action** | Reviewer Decision panel — set status, add notes, add tasks |
| **Queue Return** | Pipeline / Passed-by-AI tabs on the dashboard — human-set status always overrides AI |

---

## Scan Modes

### Search for Companies
AI reasons over a curated **sourcing corpus** — a pre-seeded set of real Vertical AI companies — and scores each one against your thesis. The pipeline view shows what AI rated **Priority** or **Watch**; everything AI rated **Pass** lands in a separate **Passed by AI** tab where you can review and override.

### Analyze Given Data
Paste raw text (article, website copy, founder bio) **OR a company URL** (auto-detected and fetched via Tavily → You.com → Jina chain) **OR upload a PDF** (pitch deck, one-pager, market report). AI extracts a structured company profile and scores it against your thesis. Text-based PDFs are supported via server-side `pdf-parse`; scanned-image PDFs cannot be extracted.

### Search the Web *(live discovery mode)*
Type a thesis, set an optional sector/workflow, choose a scan size (5–20 companies), and AI does the rest:

1. **Generates** 3-5 targeted search queries from your thesis (Claude)
2. **Searches** the live web via Tavily, biased toward VC + tech press sources (YC, a16z, Crunchbase, TechCrunch, Forbes, etc.)
3. **Classifies** every result as company-site, listicle, article, or noise (heuristic)
4. **Expands** roundup articles by reading them with Claude and pulling out company names
5. **Fetches + extracts + scores** each candidate, streaming results to the UI live — each company pops into the Pipeline as it's scored

The whole scan takes 40 seconds (5 companies) to 3 minutes (20 companies). Progress streams via NDJSON so you watch every step happen.

---

## Sourcing Corpora

Three temporal corpora are seeded at startup, each containing ~18-20 real Vertical AI companies across Healthcare, Life Sciences, Financial Services, and a handful of cross-sector references. Examples: Abridge, Hippocratic AI, Cohere Health, Owkin, Sardine, Eko, Insilico Medicine, Alloy, Tempus AI, Suki, Persona, Recursion, Isomorphic Labs, BenevolentAI, Ramp, Innovaccer, ZestyAI, Datavant, and more.

Corpus content is best-effort accurate based on training data — in production this layer would be replaced by a live web search connector (see Architecture).

---

## AI Behaviors

The app implements **three** distinct AI-powered behaviors, all running on `claude-sonnet-4-6` via the official Anthropic SDK.

### 1. Source-to-Profile Extraction
**Input:** raw text (paste or PDF-extracted)
**Output:** structured AIProfile JSON — companyName, sector, workflowCategory, customer, problem, aiUseCase, dataMoatPotential, stageEstimate, businessModel, fundingStage, competitiveLandscape, risks
**Used by:** Analyze Given Data mode

### 2. Thesis-Fit Scoring
**Input:** AIProfile + reviewer's thesis prompt
**Output:** ThesisFitAnalysis JSON — fitScore (0-100), recommendation (Priority/Watch/Pass), rationale, keyRisks, diligenceQuestions, nextStep
**Used by:** both scan modes — runs per company

### 3. Internal Sourcing Memo
**Input:** company + AIProfile + ThesisFitAnalysis
**Output:** 300-500 word markdown memo with Company Summary, Why Now, Thesis Fit, Key Risks, Recommended Next Steps
**Triggered by:** "Generate Memo" button on the detail page; result is **persisted** to DB and shown with a last-generated timestamp

### Prompt Design Strategy
- All prompts are defined as constants in `src/lib/ai/prompts.ts`
- Each AI call is **stateless** (single user + system message — no conversation history)
- JSON outputs are validated with **Zod** schemas before being stored
- `parseClaudeJson()` helper strips markdown code fences that Claude sometimes wraps JSON in, then extracts the first balanced `{...}` block as a final fallback

### Error Handling
- All Claude calls are try/catch-wrapped
- Batch scans (Search mode) capture per-company failures into a `warnings[]` array — one bad call does not kill the batch
- HTTP 502 returned to the client on Claude API failure
- Rate-limit (429) errors surface to the user with a clear message
- Empty PDFs / scanned-image PDFs return a guidance error instead of crashing

### Human-in-the-Loop
- Every AI recommendation can be overridden by setting the reviewer status to anything else
- The **OverrideBanner** appears prominently on the detail page when human status differs from AI's recommendation, explaining the override in plain English
- AI sections are visually distinguished from human sections — burgundy `AI · Generated` badge vs. black `Human · Review` badge

---

## Architecture

### Source Connector Layer

The scan engine is built around a small `SourceConnector` interface so the architecture cleanly extends to live web search later:

```ts
interface SourceConnector {
  name: string;
  search(query: SourcingQuery): Promise<RawSourceResult[]>;
}
```

| Connector | Status | Description |
|---|---|---|
| `CorpusConnector` | implemented | Queries the local seeded corpus by id, sector, and workflow |
| `ManualInputConnector` | implemented | Accepts raw text from Analyze mode |
| `WebSearchConnector` | stubbed | `WEB_SEARCH_PROVIDER=mock` env var; swap to `tavily` or `exa` later |

### Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard with Pipeline / Passed by AI tabs, sortable + filterable table |
| `/scan` | New sourcing scan — mode toggle, corpus picker, thesis prompt, PDF upload |
| `/opportunity/[id]` | Full company dossier with all AI and human sections |
| `/todo` | Cross-company follow-up list, grouped by company status |

### API Routes

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/scans` | Run a scan (JSON body or multipart for PDFs) |
| `GET` | `/api/companies?view=pipeline\|passed\|all` | List companies, with filters and sort |
| `GET` | `/api/companies/:id` | Full company detail |
| `DELETE` | `/api/companies/:id` | Cascade delete a company and all its related rows |
| `PATCH` | `/api/review/:companyId` | Save decision; append journal note; create task |
| `GET` | `/api/corpora` | List the seeded sourcing corpora |
| `GET`/`POST` | `/api/tasks` | List or create tasks |
| `PATCH`/`DELETE` | `/api/tasks/:id` | Mark task done / reopen / delete |
| `DELETE` | `/api/notes/:id` | Delete a journal note |
| `POST` | `/api/ai/extract` | AI behavior 1 — raw text → AIProfile |
| `POST` | `/api/ai/score` | AI behavior 2 — AIProfile + thesis → ThesisFitAnalysis |
| `POST` | `/api/ai/memo` | AI behavior 3 — Company + Profile + Fit → markdown memo (persisted) |

### Data Model

SQLite via `better-sqlite3`. Tables:

```
sourcing_scans       — scan config (corpusId, sector, workflow, thesis, mode)
corpus_companies     — seeded reference companies (the "web slices")
companies            — companies that have entered the pipeline
ai_profiles          — Claude-generated structured profiles per company
thesis_fit_analyses  — Claude-generated fit scores per company
review_decisions     — current human status per company
notes_log            — append-only timestamped reviewer notes
tasks                — follow-up tasks (multiple per company, done flag)
sourcing_memos       — persisted AI memos per company
```

Cascade delete on `DELETE /api/companies/:id` removes the company and every dependent row in a single transaction.

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **SQLite** via `better-sqlite3` — zero-config local DB, single file at `data/signal-scout.db`
- **Anthropic Claude** (`claude-sonnet-4-6`) via official SDK
- **Zod** for AI output validation
- **shadcn/ui** + **Tailwind CSS** with a custom editorial design system (Fraunces serif + Inter Tight + JetBrains Mono, cream / navy / burgundy palette)
- **marked** for memo markdown rendering
- **pdf-parse** for server-side PDF text extraction
- **Vitest** for unit tests of Zod schemas

---

## Environment Variables

```
ANTHROPIC_API_KEY=your_key_here
WEB_SEARCH_PROVIDER=mock      # legacy; the web chain below supersedes this

# Optional — web provider chain for URL fetching (Analyze mode) and the
# future Search-the-Web scan mode. Chain order: Tavily → You.com → Jina.
TAVILY_API_KEY=your_key_here  # https://tavily.com (free 1k/month)
YOUCOM_API_KEY=your_key_here  # https://api.you.com
```

If neither Tavily nor You.com keys are set, URL fetching still works — the chain falls back to **Jina Reader**, which requires no API key.

The AI client reads from `.env.local` directly as a fallback if the variable is empty in the process environment (handles a common case where a parent shell exports the variable as an empty string).

## Web Layer Architecture

Signal Scout has a small but extensible web layer at `src/lib/web/` that backs two product features:

| Feature | Status | Uses |
|---|---|---|
| **URL ingestion in Analyze mode** | ✅ Shipped | `chain.fetchUrl(url)` |
| **Search the Web scan mode** | 🟡 Architecture ready, UI not built | `chain.search(thesis)` |

The chain tries each provider in order and returns the first non-empty result:

```
Tavily       → real extraction, JS-aware, 1-3s
You.com      → snippet aggregation as middle layer
Jina Reader  → always-works floor, no key needed
```

Each provider implements a tiny `WebProvider` interface (`fetchUrl`, optional `search`). Adding a new provider (Exa, Firecrawl, etc.) is a single file. The chain order is hard-coded today; a future improvement is to make it configurable per environment.

In Analyze mode, paste a URL like `https://abridge.com` and the scan automatically fetches the page, extracts the company profile, and scores it against your thesis. The same pipeline as the corpus scan, just with the company data coming from the live web.

---

## Tests

```bash
npx vitest run
```

Tests cover Zod schema validation for AI outputs. No automated E2E tests; manual smoke tests are documented below.

### API Smoke Tests

```bash
# List all companies
curl http://localhost:3000/api/companies

# List corpora
curl http://localhost:3000/api/corpora

# Run a search scan
curl -X POST http://localhost:3000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "mode":"search",
    "corpusId":"q1-2026",
    "sector":"Healthcare",
    "workflowCategory":"Any",
    "thesisPrompt":"Find Vertical AI companies with deep workflow ownership in healthcare."
  }'

# Test AI extraction directly
curl -X POST http://localhost:3000/api/ai/extract \
  -H "Content-Type: application/json" \
  -d '{"rawText":"ClaimPilot AI automates healthcare claims denial..."}'
```

### Resetting the Database

To start from a clean empty pipeline:

```powershell
# Stop the dev server first (Ctrl+C)
Remove-Item .\data\signal-scout.db, .\data\signal-scout.db-shm, .\data\signal-scout.db-wal -Force
npm run dev
```

The schema and corpora are re-seeded on the next request.

---

## Demo Walkthrough (Suggested)

1. Open `/` → see empty pipeline + 3-step welcome
2. Click **Start Your First Scan**
3. Pick **Q1 2026 Pull**, set Sector = Healthcare, write a thesis prompt about workflow ownership
4. Click **Run Scan** → wait ~30 seconds while AI evaluates ~7 healthcare companies
5. Redirect to Pipeline tab → see Priority and Watch companies
6. Click **Passed by AI** tab → see companies AI rejected, with **Override** buttons
7. Click a Priority company → see full dossier with AI Profile, Thesis Fit, Reviewer Decision panel
8. Click **Generate Memo** → AI drafts a 300-500 word internal memo, persisted to DB
9. Set status to **Priority**, add a journal note "Strong fit on workflow data flywheel", add Next Step "Schedule founder intro" → Save Decision
10. Confirmation appears; new task in Follow-Up Tasks card; new entry in Reviewer Journal
11. Click **To Do** in the nav → see the new task in your cross-company follow-up list

---

## What I Would Do Next

- **Live web search connector** — swap `WEB_SEARCH_PROVIDER=mock` with a real Tavily or Exa implementation; surface fresh companies dynamically rather than from a static corpus
- **Scan history** — keep every scan as a first-class record with its surfaced companies, so reviewers can revisit "what did Q2 turn up under thesis X" later
- **Diff view across scans** — when re-running a thesis prompt against the same corpus, highlight what changed (new fits, dropped fits, score deltas)
- **Real auth + multi-user workflows** — Clerk or NextAuth, with per-user task assignment and shared reviewer journals
- **Export to PDF** — sourcing memo + dossier as a printable one-pager for partner meetings
- **Inline AI editing** — let the reviewer ask the AI to refine the memo ("make the risks section more specific")
- **Score calibration** — track which AI Pass calls the reviewer overrides over time; fine-tune the scoring prompt against actual reviewer judgment
