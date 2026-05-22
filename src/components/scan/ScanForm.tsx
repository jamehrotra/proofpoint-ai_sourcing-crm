'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ModeToggle } from './ModeToggle';
import { ScanProgress } from './ScanProgress';
import { CorpusPicker, type CorpusOption } from './CorpusPicker';
import { PdfDropzone } from './PdfDropzone';
import { SECTORS, WORKFLOW_CATEGORIES } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ScanMode } from '@/lib/types';

type AnalyzeSubMode = 'paste' | 'pdf';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

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
    } else {
      if (analyzeSubMode === 'paste' && rawInput.trim().length < 20) {
        setError('Please paste at least 20 characters of source material.');
        return;
      }
      if (analyzeSubMode === 'pdf' && !pdfFile) {
        setError('Please upload a PDF file.');
        return;
      }
    }

    setLoading(true);
    try {
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

      if (data.warnings?.length > 0) {
        setWarnings(data.warnings);
      }

      const targetView = data.surfacedCount > 0 ? 'pipeline' : 'passed';
      router.push(`/?view=${targetView}`);
    } catch {
      setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    const selectedCorpus = corpora.find((c) => c.id === corpusId);
    return (
      <ScanProgress
        mode={mode}
        count={mode === 'search' ? selectedCorpus?.companyCount : undefined}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section eyebrow="Step 01" title="Scan Mode">
        <ModeToggle mode={mode} onChange={setMode} />
        <p className="mt-3 text-[13px] text-[#6b6358] leading-relaxed max-w-2xl">
          {mode === 'search'
            ? 'AI will reason over a curated corpus of Vertical AI companies and score each one against your thesis.'
            : 'Paste raw text or upload a PDF — AI extracts the structured profile and scores it.'}
        </p>
      </Section>

      {mode === 'search' && (
        <Section eyebrow="Step 02" title="Corpus">
          <CorpusPicker corpora={corpora} selectedId={corpusId} onSelect={setCorpusId} />
        </Section>
      )}

      <Section eyebrow={mode === 'search' ? 'Step 03' : 'Step 02'} title="Targeting">
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
      </Section>

      <Section eyebrow={mode === 'search' ? 'Step 04' : 'Step 03'} title="Thesis Prompt">
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
                placeholder="Paste website copy, article text, product launch announcement, founder bio, job posting, or any other content about the company..."
                rows={9}
                className="w-full max-w-3xl bg-white border border-[#e8e2d4] px-4 py-3 font-mono text-[12px] text-[#1a1816] placeholder:text-[#908874] focus:outline-none focus:border-[#1a1816] resize-none"
              />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#6b6358]">
                Any format — AI extracts the structured company profile from whatever you paste.
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
          Run Scan
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
          {mode === 'search' ? 'AI scores every company in the corpus against your thesis' : 'AI extracts and scores the source material'}
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
