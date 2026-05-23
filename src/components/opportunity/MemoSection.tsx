'use client';

import { useState } from 'react';
import { marked } from 'marked';
import { displayNameForUsername } from '@/lib/auth';

interface MemoSectionProps {
  companyId: string;
  initialMemo?: string | null;
  initialGeneratedAt?: string | null;
  initialGeneratedBy?: string | null;
}

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function MemoSection({ companyId, initialMemo, initialGeneratedAt, initialGeneratedBy }: MemoSectionProps) {
  const [memo, setMemo] = useState<string | null>(initialMemo ?? null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt ?? null);
  const [generatedBy, setGeneratedBy] = useState<string | null>(initialGeneratedBy ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateMemo() {
    setLoading(true);
    setError(null);
    setMemo(''); // start fresh — streaming text will populate this
    try {
      const res = await fetch('/api/ai/memo/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      if (!res.ok) {
        // Streaming endpoint returns JSON for errors before opening the stream
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Memo generation failed.');
        setMemo(null);
        return;
      }

      if (!res.body) {
        setError('No response body from server.');
        setMemo(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setMemo(accumulated);
      }

      // Flush any tail bytes from the decoder
      accumulated += decoder.decode();
      if (accumulated.length > 0) setMemo(accumulated);

      setGeneratedAt(new Date().toISOString());
      // Authorship is captured server-side; client refresh will surface it on next page load.
    } catch (err) {
      console.error(err);
      setError('Network error — could not generate memo.');
      setMemo(null);
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
          {generatedAt && memo && (
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#908874] ml-2">
              Last generated {formatTimestamp(generatedAt)}
              {generatedBy && <> · {displayNameForUsername(generatedBy)}</>}
            </span>
          )}
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

      {loading && !memo && (
        <div className="py-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-[#6b1f2a] animate-pulse [animation-delay:0.4s]" />
          </div>
          <p className="font-serif text-[16px] italic text-[#6b6358]">Drafting internal memo...</p>
        </div>
      )}

      {memo && (
        <div>
          <MemoRenderer markdown={memo} />
          {loading && (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b1f2a] inline-flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#6b1f2a] animate-pulse" />
              Streaming...
            </p>
          )}
        </div>
      )}

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
  const html = marked.parse(markdown, { async: false }) as string;
  return (
    <div
      className="memo-prose max-w-3xl"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
