'use client';

import { useState } from 'react';

interface MemoSectionProps {
  companyId: string;
}

export function MemoSection({ companyId }: MemoSectionProps) {
  const [memo, setMemo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateMemo() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Memo generation failed.');
        return;
      }
      setMemo(data.memo);
    } catch {
      setError('Network error — could not generate memo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border border-[#e8e2d4] bg-white p-8 mb-6">
      <div className="flex items-baseline justify-between gap-3 mb-6 pb-3 border-b border-[#1a1816]">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b1f2a] border border-[#6b1f2a] rounded-sm px-1.5 py-[2px]">
            AI · Generated
          </span>
          <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">Internal Sourcing Note</h2>
        </div>
        <button
          onClick={generateMemo}
          disabled={loading}
          className="font-mono text-[10px] uppercase tracking-[0.1em] font-medium border border-[#1a1816] px-3 py-1.5 hover:bg-[#1a1816] hover:text-[#faf7f2] transition-colors disabled:opacity-50 rounded-sm"
        >
          {loading ? 'Generating...' : memo ? 'Regenerate' : 'Generate Memo'}
        </button>
      </div>

      {error && (
        <div className="bg-[#6b1f2a]/[0.06] border-l-2 border-[#6b1f2a] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b1f2a] mb-1">Error</div>
          <p className="text-[13px] text-[#1a1816]">{error}</p>
        </div>
      )}

      {loading && (
        <div className="py-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse [animation-delay:0.4s]" />
          </div>
          <p className="font-serif text-[16px] italic text-[#6b6358]">Drafting internal memo...</p>
        </div>
      )}

      {!loading && memo && <MemoRenderer markdown={memo} />}

      {!loading && !memo && !error && (
        <div className="py-12 text-center">
          <p className="font-serif text-[18px] italic text-[#6b6358] mb-2">No memo drafted yet.</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#908874]">
            Click &ldquo;Generate Memo&rdquo; to draft an AI-written sourcing note.
          </p>
        </div>
      )}
    </section>
  );
}

function MemoRenderer({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n');

  return (
    <div className="max-w-3xl">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h3
              key={i}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b1f2a] mt-7 mb-3 first:mt-0"
            >
              {line.replace('## ', '')}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={i} className="font-serif text-[24px] text-[#1a1816] mb-3 tracking-tight">
              {line.replace('# ', '')}
            </h2>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-3 mb-2 text-[14px] text-[#1a1816] leading-relaxed">
              <span className="text-[#6b1f2a] shrink-0 mt-1">·</span>
              <span>{line.replace(/^[-*] /, '')}</span>
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        return (
          <p key={i} className="font-serif text-[15px] text-[#1a1816] leading-[1.7] mb-3">
            {line}
          </p>
        );
      })}
    </div>
  );
}
