'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModeToggle } from './ModeToggle';
import { ScanProgress } from './ScanProgress';
import { WebScanProgress } from './WebScanProgress';
import { CorpusPicker, type CorpusOption } from './CorpusPicker';
import { PdfDropzone } from './PdfDropzone';
import { SECTORS, WORKFLOW_CATEGORIES } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ScanMode } from '@/lib/types';

type AnalyzeSubMode = 'paste' | 'pdf';

interface WebProgressState {
  queries: string[];
  classification: { total: number; companies: number; listicles: number; articles: number } | null;
  expansions: Array<{ url: string; extracted: number }>;
  candidates: Array<{
    index: number;
    total: number;
    url: string;
    hint?: string;
    status: 'scoring' | 'done' | 'error';
    recommendation?: 'Priority' | 'Watch' | 'Pass';
    fitScore?: number;
    error?: string;
  }>;
  warnings: string[];
  status: string;
  finished: boolean;
}

const EMPTY_WEB_PROGRESS: WebProgressState = {
  queries: [],
  classification: null,
  expansions: [],
  candidates: [],
  warnings: [],
  status: 'Starting...',
  finished: false,
};

export function ScanForm() {
  const router = useRouter();
  const [mode, setMode] = useState<ScanMode>('search');
  const [corpora, setCorpora] = useState<CorpusOption[]>([]);
  const [corpusId, setCorpusId] = useState<string | null>(null);
  const [sector, setSector] = useState('Any');
  const [workflowCategory, setWorkflowCategory] = useState('Any');
  const [thesisPrompt, setThesisPrompt] = useState('');
  const [analyzeSubMode, setAnalyzeSubMode] = useState<AnalyzeSubMode>('paste');
  const [rawInput, setRawInput] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [maxCompanies, setMaxCompanies] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [webProgress, setWebProgress] = useState<WebProgressState>(EMPTY_WEB_PROGRESS);

  // Detect a URL in the paste textarea so we can show a small live indicator.
  const trimmedRaw = rawInput.trim();
  const detectedUrl = /^https?:\/\/\S+$/i.test(trimmedRaw) ? trimmedRaw : null;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/corpora')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const list: CorpusOption[] = data.corpora ?? [];
        setCorpora(list);
        if (list.length > 0 && !corpusId) {
          setCorpusId(list[0].id);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [corpusId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarnings([]);

    if (thesisPrompt.trim().length < 10) {
      setError('Please enter a thesis prompt (at least 10 characters).');
      return;
    }

    if (mode === 'search') {
      if (!corpusId) {
        setError('Please select a corpus.');
        return;
      }
    } else if (mode === 'analyze') {
      if (analyzeSubMode === 'paste' && rawInput.trim().length < 20) {
        setError('Please paste at least 20 characters of source material.');
        return;
      }
      if (analyzeSubMode === 'pdf' && !pdfFile) {
        setError('Please upload a PDF file.');
        return;
      }
    }
    // mode === 'web' has no extra requirements beyond the thesis prompt.

    setLoading(true);
    setWebProgress(EMPTY_WEB_PROGRESS);

    try {
      if (mode === 'web') {
        await runWebScan();
      } else {
        await runStandardScan();
      }
    } catch {
      setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  async function runStandardScan() {
    let res: Response;
    if (mode === 'analyze' && analyzeSubMode === 'pdf' && pdfFile) {
      const fd = new FormData();
      fd.append('file', pdfFile);
      fd.append('thesisPrompt', thesisPrompt.trim());
      fd.append('sector', sector);
      fd.append('workflowCategory', workflowCategory);
      res = await fetch('/api/scans', { method: 'POST', body: fd });
    } else {
      res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          corpusId: mode === 'search' ? corpusId : undefined,
          sector,
          workflowCategory,
          thesisPrompt: thesisPrompt.trim(),
          rawInput: mode === 'analyze' ? rawInput.trim() : undefined,
        }),
      });
    }

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Scan failed. Please try again.');
      return;
    }

    if (data.warnings?.length > 0) setWarnings(data.warnings);

    if (data.processedCount === 0) {
      setError(
        mode === 'search'
          ? 'No companies in the selected corpus matched these filters. Try widening Sector or Workflow Category, or pick another corpus.'
          : 'AI could not extract a company from this material. Try a longer, more descriptive source.'
      );
      return;
    }

    const targetView = data.surfacedCount > 0 ? 'pipeline' : 'passed';
    router.push(`/?view=${targetView}`);
  }

  async function runWebScan() {
    const res = await fetch('/api/scans/web', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thesis: thesisPrompt.trim(),
        sector: sector === 'Any' ? undefined : sector,
        workflow: workflowCategory === 'Any' ? undefined : workflowCategory,
        maxCompanies,
      }),
    });

    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Web scan failed to start.');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let scanFinished = false;
    let finalSurfacedCount = 0;
    let finalPassedCount = 0;
    let finalProcessedCount = 0;
    let finalWarnings: string[] = [];

    while (!scanFinished) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Process complete NDJSON lines
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        let event: Record<string, unknown>;
        try {
          event = JSON.parse(trimmed);
        } catch {
          continue;
        }
        handleWebEvent(event);
        if (event.type === 'done') {
          scanFinished = true;
          finalSurfacedCount = (event.surfacedCount as number) ?? 0;
          finalPassedCount = (event.passedCount as number) ?? 0;
          finalProcessedCount = (event.processedCount as number) ?? 0;
          finalWarnings = (event.warnings as string[]) ?? [];
        }
      }
    }

    setWebProgress((prev) => ({ ...prev, finished: true, status: 'Scan complete.' }));

    // If the scan literally surfaced nothing, stay on this page and surface
    // warnings instead of redirecting into a confusing empty state.
    if (finalProcessedCount === 0) {
      setLoading(false);
      setError(
        finalWarnings.length > 0
          ? `Scan produced no companies. ${finalWarnings[0]}`
          : 'Scan produced no companies. Try a more specific thesis or different sector.'
      );
      setWarnings(finalWarnings);
      return;
    }

    // Give the user a moment to see the final results before redirecting.
    await new Promise((r) => setTimeout(r, 1500));
    const targetView = finalSurfacedCount > 0 ? 'pipeline' : 'passed';
    // Track in case the consumer wants the count post-redirect
    void finalPassedCount;
    router.push(`/?view=${targetView}`);
    router.refresh();
  }

  function handleWebEvent(event: Record<string, unknown>) {
    setWebProgress((prev) => {
      const next = { ...prev };
      switch (event.type) {
        case 'status':
          next.status = String(event.message);
          break;
        case 'queries':
          next.queries = (event.queries as string[]) ?? [];
          next.status = 'Searching the web...';
          break;
        case 'search-batch':
          next.status = `Searched: "${event.query}" — ${event.resultsCount} new URLs`;
          break;
        case 'classify':
          next.classification = {
            total: event.total as number,
            companies: event.companies as number,
            listicles: event.listicles as number,
            articles: event.articles as number,
          };
          next.status = 'Classified URLs. Expanding listicles...';
          break;
        case 'expand-listicle':
          next.expansions = [
            ...next.expansions,
            { url: event.url as string, extracted: event.extracted as number },
          ];
          next.status = `Expanded listicle: ${event.extracted} companies extracted`;
          break;
        case 'candidate-start': {
          const idx = event.index as number;
          const total = event.total as number;
          const url = event.url as string;
          const hint = event.hint as string | undefined;
          next.candidates = [
            ...next.candidates.filter((c) => c.index !== idx),
            { index: idx, total, url, hint, status: 'scoring' as const },
          ].sort((a, b) => a.index - b.index);
          next.status = `Scoring ${idx} of ${total}: ${shortenUrlForStatus(url)}`;
          break;
        }
        case 'candidate-done': {
          const idx = event.index as number;
          const total = event.total as number;
          const url = event.url as string;
          const hasError = typeof event.error === 'string';
          next.candidates = next.candidates.map((c) =>
            c.index === idx
              ? {
                  ...c,
                  status: hasError ? ('error' as const) : ('done' as const),
                  recommendation: event.recommendation as 'Priority' | 'Watch' | 'Pass' | undefined,
                  fitScore: event.fitScore as number | undefined,
                  error: event.error as string | undefined,
                  total,
                  url,
                }
              : c
          );
          break;
        }
        case 'warning':
          next.warnings = [...next.warnings, String(event.message)];
          break;
        case 'done':
          next.finished = true;
          break;
      }
      return next;
    });
  }

  if (loading) {
    if (mode === 'web') {
      return <WebScanProgress {...webProgress} />;
    }
    const selectedCorpus = corpora.find((c) => c.id === corpusId);
    return (
      <ScanProgress
        mode={mode}
        count={mode === 'search' ? selectedCorpus?.companyCount : undefined}
        urlBeingFetched={mode === 'analyze' && analyzeSubMode === 'paste' ? detectedUrl : null}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section eyebrow="Step 01" title="Scan Mode">
        <ModeToggle mode={mode} onChange={setMode} />
        <p className="mt-3 text-[13px] text-[#6b6358] leading-relaxed max-w-2xl">
          {mode === 'search' && 'AI reasons over our curated corpus of Vertical AI companies and scores each against your thesis.'}
          {mode === 'analyze' && 'Paste raw text, a company URL, or upload a PDF — AI extracts the structured profile and scores it.'}
          {mode === 'web' && 'AI generates targeted search queries from your thesis, scans the live web via Tavily/You.com/Jina, expands roundup articles to surface more companies, and scores each one as it goes.'}
        </p>
      </Section>

      {mode === 'search' && (
        <Section eyebrow="Step 02" title="Corpus">
          <CorpusPicker corpora={corpora} selectedId={corpusId} onSelect={setCorpusId} />
        </Section>
      )}

      <Section
        eyebrow={mode === 'search' ? 'Step 03' : 'Step 02'}
        title="Targeting"
      >
        <div className="grid grid-cols-2 gap-6 max-w-2xl">
          <SelectField label="Sector Focus" value={sector} onChange={setSector}>
            <option value="Any">Any Sector</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectField>
          <SelectField label="Workflow Category" value={workflowCategory} onChange={setWorkflowCategory}>
            <option value="Any">Any Workflow</option>
            {WORKFLOW_CATEGORIES.map((w) => <option key={w} value={w}>{w}</option>)}
          </SelectField>
        </div>
        {mode === 'web' && (
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[#6b6358]">
            Sector and workflow are optional for web scans — they bias the search queries but don&apos;t filter results.
          </p>
        )}
      </Section>

      <Section
        eyebrow={mode === 'search' ? 'Step 04' : 'Step 03'}
        title="Thesis Prompt"
      >
        <textarea
          value={thesisPrompt}
          onChange={(e) => setThesisPrompt(e.target.value)}
          placeholder="e.g. Find early-stage Vertical AI companies using AI agents to automate high-friction healthcare administrative workflows where proprietary workflow data could create defensibility."
          rows={4}
          className="w-full max-w-3xl bg-white border border-[#e8e2d4] px-4 py-3 text-[14px] text-[#1a1816] placeholder:text-[#908874] placeholder:italic focus:outline-none focus:border-[#1a1816] resize-none"
        />
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#6b6358]">
          AI uses this to evaluate every surfaced company. Pass / Watch / Priority is decided per company.
        </p>
      </Section>

      {mode === 'analyze' && (
        <Section eyebrow="Step 04" title="Source Material">
          <div className="inline-flex border border-[#1a1816] rounded-sm overflow-hidden mb-4">
            <SubToggle active={analyzeSubMode === 'paste'} onClick={() => setAnalyzeSubMode('paste')}>
              Paste Text
            </SubToggle>
            <SubToggle active={analyzeSubMode === 'pdf'} onClick={() => setAnalyzeSubMode('pdf')}>
              Upload PDF
            </SubToggle>
          </div>

          {analyzeSubMode === 'paste' ? (
            <>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Paste a company URL (https://...), website copy, article text, founder bio, launch announcement — anything works."
                rows={9}
                className="w-full max-w-3xl bg-white border border-[#e8e2d4] px-4 py-3 font-mono text-[12px] text-[#1a1816] placeholder:text-[#908874] focus:outline-none focus:border-[#1a1816] resize-none"
              />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#6b6358]">
                {detectedUrl
                  ? <>URL detected · we&apos;ll fetch <span className="normal-case tracking-normal text-[#1a1816] font-medium">{detectedUrl}</span> via Tavily → You.com → Jina Reader.</>
                  : <>Paste raw text OR a URL. URLs are fetched via Tavily, You.com, or Jina automatically.</>}
              </p>
            </>
          ) : (
            <>
              <PdfDropzone file={pdfFile} onChange={setPdfFile} />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#6b6358]">
                Text-based PDFs only — scanned-image PDFs cannot be extracted.
              </p>
            </>
          )}
        </Section>
      )}

      {mode === 'web' && (
        <Section eyebrow="Step 04" title="Scan Size">
          <div className="max-w-md">
            <div className="flex items-baseline justify-between mb-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
                Max companies to evaluate
              </label>
              <span className="font-serif text-[20px] text-[#1a1816]">{maxCompanies}</span>
            </div>
            <input
              type="range"
              min={5}
              max={20}
              step={1}
              value={maxCompanies}
              onChange={(e) => setMaxCompanies(parseInt(e.target.value, 10))}
              className="w-full accent-[#6b1f2a]"
            />
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-[#908874] mt-1">
              <span>5 · fast (~40s)</span>
              <span>20 · wide (~3min)</span>
            </div>
          </div>
        </Section>
      )}

      {error && (
        <div className="bg-[#6b1f2a]/[0.06] border-l-2 border-[#6b1f2a] px-4 py-3 max-w-3xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b1f2a] mb-1">Error</div>
          <p className="text-[13px] text-[#1a1816]">{error}</p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-[#b8893a]/[0.08] border-l-2 border-[#b8893a] px-4 py-3 max-w-3xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#b8893a] mb-1">Warnings</div>
          <ul className="text-[13px] text-[#1a1816] space-y-1">
            {warnings.map((w, i) => <li key={i}>· {w}</li>)}
          </ul>
        </div>
      )}

      <div className="pt-6 border-t border-[#e8e2d4] flex items-center gap-5 max-w-3xl">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1a1816] text-[#faf7f2] px-6 py-3 text-[13px] font-medium tracking-[0.02em] hover:bg-[#0f1e3a] transition-colors disabled:opacity-50"
        >
          {mode === 'web' ? 'Run Web Scan' : 'Run Scan'}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
          {mode === 'search' && 'AI scores every company in the corpus against your thesis'}
          {mode === 'analyze' && 'AI extracts and scores the source material'}
          {mode === 'web' && 'AI searches the live web, surfaces candidates, scores each one'}
        </span>
      </div>
    </form>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3 pb-2 border-b border-[#e8e2d4]">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b1f2a]">{eyebrow}</span>
        <h2 className="font-serif text-[20px] text-[#1a1816] tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-[#e8e2d4] px-3 py-2 text-[14px] text-[#1a1816] focus:outline-none focus:border-[#1a1816]"
      >
        {children}
      </select>
    </div>
  );
}

function SubToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'font-mono text-[10px] uppercase tracking-[0.08em] px-4 py-2 font-medium transition-colors',
        active ? 'bg-[#1a1816] text-[#faf7f2]' : 'bg-transparent text-[#1a1816] hover:bg-[#f5f1e8]',
        'border-r border-[#1a1816] last:border-r-0'
      )}
    >
      {children}
    </button>
  );
}

function shortenUrlForStatus(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
