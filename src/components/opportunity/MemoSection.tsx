'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-0.5">AI Generated</span>
          <h2 className="text-sm font-semibold text-gray-900">Internal Sourcing Note</h2>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={generateMemo}
          disabled={loading}
          className="text-xs"
        >
          {loading ? 'Generating...' : memo ? 'Regenerate' : 'Generate Sourcing Note'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse [animation-delay:0.4s]" />
          </div>
          <p className="text-xs text-gray-400">Writing internal memo...</p>
        </div>
      )}

      {!loading && memo && (
        <MemoRenderer markdown={memo} />
      )}

      {!loading && !memo && !error && (
        <p className="text-sm text-gray-400 text-center py-6">
          Click &ldquo;Generate Sourcing Note&rdquo; to create an AI-written internal memo for this company.
        </p>
      )}
    </div>
  );
}

function MemoRenderer({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n');

  return (
    <div className="prose prose-sm max-w-none">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h3 key={i} className="text-sm font-semibold text-gray-900 mt-5 mb-2 first:mt-0">{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={i} className="text-base font-semibold text-gray-900 mb-2">{line.replace('# ', '')}</h2>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <p key={i} className="text-sm text-gray-700 flex items-start gap-2 mb-1"><span className="text-gray-400 shrink-0 mt-0.5">•</span>{line.replace(/^[-*] /, '')}</p>;
        }
        if (line.trim() === '') {
          return <div key={i} className="h-1" />;
        }
        return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">{line}</p>;
      })}
    </div>
  );
}
