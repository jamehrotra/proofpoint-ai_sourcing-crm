# Proofpoint Signal Scout

An AI-powered sourcing cockpit for Proofpoint Capital — a VC firm investing in early-stage Vertical AI companies. Signal Scout lets an analyst surface candidate companies via three scan modes, score them against a live investment thesis using Claude, review structured AI profiles and thesis-fit analyses, override AI recommendations, capture journaled notes, and track follow-up tasks across the pipeline.

Built for the Proofpoint Capital AI/Technology Internship assignment.

---

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY (required), TAVILY_API_KEY and YOUCOM_API_KEY (optional)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database initializes and seeds three sourcing corpora on first start. The pipeline is **empty by default** — run a scan to populate it.

### Demo Accounts

| Username | Password |
|---|---|
| `jmhrotra` | `proofpoint` |
| `temp` | `proofpoint` |

---

## What It Does

1. **Scan** — pick a corpus (Q1/Q2/Q3 2026), set sector + workflow filters, write a thesis prompt
2. **Surface** — AI scores every matching company and routes results to Pipeline or Passed-by-AI
3. **Structure** — paste text, drop a URL, or upload a PDF — AI extracts a structured company profile
4. **Review** — full dossier with AI profile, 5-dimension thesis-fit breakdown, and streaming sourcing memo
5. **Override** — set your own status; overrides are tracked with a prominent indicator on every page
6. **Journal** — append-only reviewer notes attributed to the logged-in user, timestamped
7. **Track** — diligence questions convert to action tasks; cross-company To Do page spans the pipeline

---

## Scan Modes

### Search Corpus
AI scores every company in a curated corpus against your thesis. 20 companies run in ~60 seconds via parallel Claude calls (4 concurrent, respecting the API rate limit). Repeat scans with the same thesis return instantly from cache. Priority and Watch land in the Pipeline; Pass goes to the Passed-by-AI tab.

### Analyze Given Data
Three sub-modes share the same AI pipeline:
- **Paste text** — raw article, founder bio, website copy
- **Paste URL** — auto-detected, fetched via Tavily → You.com → Jina fallback chain
- **Upload PDF** — server-side text extraction via `pdf-parse`; text-based PDFs only

### Search the Web *(live discovery)*
AI generates 3–5 targeted search queries from your thesis, searches the live web via Tavily, classifies results (company-site / listicle / article / noise), expands roundup articles by extracting company names, then fetches + profiles + scores each candidate. Results stream live via NDJSON — each company appears in the pipeline as it completes. Takes ~40s for 5 companies.

---

## Thesis-Fit Scoring

Every company is scored on five dimensions, each rated **Strong / Moderate / Weak** with a one-sentence evidence note:

| Dimension | Strong means... |
|---|---|
| Sector Fit | Deep in Healthcare, Life Sciences, or Financial Services |
| Workflow Ownership | The product *runs* the workflow — not just advises on it |
| Data Moat | Proprietary outcome data compounds with usage |
| Stage Alignment | Pre-Seed through Series B preferred |
| AI Native | AI is the product's reason for existence |

**Scoring rules (enforced both in prompt and in code):**
- `85–100 → Priority` requires 3+ Strong dims including Sector + (Workflow or Moat)
- `60–84 → Watch` — real fit, one meaningful gap
- `0–59 → Pass` — material misalignment or zero Strong dimensions
- Score formula: per-dimension ranges (Strong = 18–22, Moderate = 9–13, Weak = 0–5 for core dims; slightly lower for stage/AI-native) summed to a continuous score — no fixed grid

The `enforceRecommendation()` function in `src/lib/ai/score.ts` hard-corrects any Claude output that violates these rules — e.g. if Claude returns Priority but the dimensions don't qualify, it's downgraded to Watch at the code layer.

---

## Sourcing Corpora

Three temporal corpora seeded at startup, ~18–20 companies each:

| Corpus | Focus |
|---|---|
| **Q1 2026** | Healthcare & Financial Services foundation — Abridge, Hippocratic AI, Cohere Health, Sardine, Tennr, Greenlite, Eko, PathAI, Aidoc |
| **Q2 2026** | Life Sciences + cross-sector — Tempus AI, Truveta, EvenUp, Garner Health, Iambic, Persona, Suki, BioReason, Glean |
| **Q3 2026** | Later-stage + emerging — Datavant, Recursion, Ramp, Decagon, ZestyAI, Cradle, Isomorphic Labs, Genesis Therapeutics |

---

## AI Behaviors

Five distinct Claude calls, all on `claude-sonnet-4-6`:

| Behavior | Input | Output |
|---|---|---|
| `extractProfile` | Raw text | Structured AIProfile JSON |
| `scoreThesisFit` | Profile + thesis | Fit score, 5 dimensions, rationale, risks, diligence Qs |
| `generateMemo` | Full company context | 300–500 word sourcing memo (persisted to DB) |
| `streamMemo` | Full company context | Same memo, streamed word-by-word |
| `rewriteDiligenceAsAction` | Raw diligence question | Verb-first action task ("Investigate NRR with top 3 customers") |

All JSON outputs validated with **Zod**. `parseClaudeJson()` strips markdown fences Claude occasionally adds. Corpus scans score 5 companies concurrently with one automatic retry on transient failure.

---

## Architecture

### Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard — Pipeline + Passed-by-AI tabs, sortable/filterable table |
| `/scan` | New scan — mode picker, corpus selector, thesis input, PDF upload |
| `/opportunity/[id]` | Full company dossier (~10 sections) |
| `/todo` | Cross-company follow-up tasks, grouped by company status |
| `/history` | Past scans with thesis and company counts |

### API Routes

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/scans` | Run corpus or analyze scan |
| `POST` | `/api/scans/web` | Run live web discovery scan (NDJSON stream) |
| `GET` | `/api/companies` | List pipeline companies |
| `GET/DELETE` | `/api/companies/:id` | Company detail / cascade delete |
| `POST` | `/api/review/:companyId` | Save reviewer decision |
| `POST/GET` | `/api/notes` | Create / list journal notes |
| `PATCH/DELETE` | `/api/notes/:id` | Edit / delete a note |
| `POST/GET` | `/api/tasks` | Create / list tasks |
| `PATCH/DELETE` | `/api/tasks/:id` | Complete / delete a task |
| `GET` | `/api/corpora` | List seeded corpora |
| `POST` | `/api/ai/extract` | Extract AIProfile from raw text |
| `POST` | `/api/ai/score` | Score profile against thesis |
| `POST` | `/api/ai/memo` | Generate sourcing memo |
| `POST` | `/api/ai/memo/stream` | Stream sourcing memo |
| `POST` | `/api/ai/rewrite-diligence` | Rewrite diligence question as action task |

### Data Model

SQLite via `better-sqlite3`. Single file at `data/signal-scout.db`.

```
sourcing_scans        — scan config (corpus, sector, workflow, thesis, mode)
corpus_companies      — seeded reference companies
companies             — pipeline entries (corpus + web + analyze)
ai_profiles           — Claude-extracted structured profiles
thesis_fit_analyses   — fit scores + 5-dimension breakdown (multiple per company)
review_decisions      — current human status per company
notes_log             — append-only reviewer journal (never overwritten)
tasks                 — follow-up tasks with done flag + createdBy
sourcing_memos        — persisted AI memos with generatedBy
```

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **SQLite** via `better-sqlite3`
- **Anthropic Claude** (`claude-sonnet-4-6`) via official SDK
- **Zod** for AI output validation
- **shadcn/ui** + **Tailwind CSS** — custom editorial design system (Fraunces serif + Inter Tight + JetBrains Mono, cream/navy/burgundy)
- **marked** for memo markdown rendering
- **pdf-parse** for server-side PDF text extraction
- **Vitest** for unit tests

---

## Environment Variables

```
ANTHROPIC_API_KEY=your_key_here   # required

# Web provider chain — Tavily → You.com → Jina (Jina needs no key)
TAVILY_API_KEY=your_key_here      # https://tavily.com
YOUCOM_API_KEY=your_key_here      # https://api.you.com
```

The AI client reads `.env.local` directly as a fallback if the variable is empty in the process environment (guards against a parent shell exporting `ANTHROPIC_API_KEY=` as an empty string).

---

## Tests

```bash
npx vitest run
```

**27 unit tests** across three suites:

| Suite | What it covers |
|---|---|
| `AIProfileSchema` | Valid profiles, missing fields, empty risks, empty name, optional field defaults |
| `ThesisFitSchema` | Priority/Watch/Pass outputs, score bounds (0–100, integer only), invalid enum values, empty arrays, dimension note validation |
| `enforceRecommendation` | Priority → Watch downgrade rules, zero-Strong → Pass, 3+ Weak → Pass, score caps at 84 and 59, valid cases left unchanged |

### Resetting the Database

```powershell
# Stop the dev server first (Ctrl+C)
Remove-Item .\data\signal-scout.db, .\data\signal-scout.db-shm, .\data\signal-scout.db-wal -Force
npm run dev
```

---

## Demo Walkthrough

1. Sign in at `/login` → `jmhrotra / proofpoint`
2. Empty pipeline → welcome screen → **Start Your First Scan**
3. **Search Corpus** → Q1 2026 → Healthcare → thesis: *"Find Vertical AI companies with deep workflow ownership and proprietary data moats"* → Run
4. ~45s → Pipeline populates with Priority and Watch companies
5. Open **Abridge** or **Cohere Health** → full dossier
6. **Generate Memo** → streams word-by-word
7. Hover a diligence question → **+ Add as Task** → AI rewrites as action verb → appears in Follow-Up Tasks
8. Add a journal note → timestamped + attributed to your login
9. Set status to **Priority** → OVERRIDE chip appears if it differs from AI verdict
10. **To Do** nav → all open tasks across every company
11. **History** nav → every past scan with thesis and counts

---

## What's Next

- CRM export (Affinity, Notion) — push scored companies directly
- Founder signal layer — LinkedIn / news event triggers
- Thesis versioning — track how scoring shifts as thesis evolves
- Real auth (Clerk / NextAuth) with per-user task assignment
- Diff view across scans — highlight new fits, dropped fits, score deltas
- Score calibration — track override patterns and fine-tune the scoring prompt against actual analyst judgment
