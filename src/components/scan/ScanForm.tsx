'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModeToggle } from './ModeToggle';
import { ScanProgress } from './ScanProgress';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SECTORS, WORKFLOW_CATEGORIES } from '@/lib/utils';
import type { ScanMode } from '@/lib/types';

export function ScanForm() {
  const router = useRouter();
  const [mode, setMode] = useState<ScanMode>('search');
  const [sector, setSector] = useState('Any');
  const [workflowCategory, setWorkflowCategory] = useState('Any');
  const [thesisPrompt, setThesisPrompt] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarnings([]);

    if (thesisPrompt.trim().length < 10) {
      setError('Please enter a thesis prompt (at least 10 characters).');
      return;
    }
    if (mode === 'analyze' && rawInput.trim().length < 20) {
      setError('Please paste at least 20 characters of company source material.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: sector === 'Any' ? 'Any' : sector,
          workflowCategory: workflowCategory === 'Any' ? 'Any' : workflowCategory,
          thesisPrompt: thesisPrompt.trim(),
          mode,
          rawInput: mode === 'analyze' ? rawInput.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Scan failed. Please try again.');
        return;
      }

      if (data.warnings?.length > 0) {
        setWarnings(data.warnings);
      }

      router.push('/');
    } catch {
      setError('Network error — could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <ScanProgress mode={mode} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">Scan Mode</Label>
        <ModeToggle mode={mode} onChange={setMode} />
        <p className="text-xs text-gray-400 mt-2">
          {mode === 'search'
            ? 'AI will score companies from our curated Vertical AI corpus against your thesis.'
            : 'Paste any raw source material — website copy, article, blurb — and AI will extract and score it.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sector" className="text-sm font-medium text-gray-700 mb-1.5 block">Sector Focus</Label>
          <Select value={sector} onValueChange={(v) => v && setSector(v)}>
            <SelectTrigger id="sector" className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any">Any Sector</SelectItem>
              {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="workflow" className="text-sm font-medium text-gray-700 mb-1.5 block">Workflow Category</Label>
          <Select value={workflowCategory} onValueChange={(v) => v && setWorkflowCategory(v)}>
            <SelectTrigger id="workflow" className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Any">Any Workflow</SelectItem>
              {WORKFLOW_CATEGORIES.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="thesis" className="text-sm font-medium text-gray-700 mb-1.5 block">
          Thesis Prompt
        </Label>
        <Textarea
          id="thesis"
          value={thesisPrompt}
          onChange={(e) => setThesisPrompt(e.target.value)}
          placeholder="e.g. Find early-stage Vertical AI companies using AI agents to automate high-friction healthcare administrative workflows where proprietary workflow data could create defensibility."
          rows={4}
          className="text-sm resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          Describe what you are looking for. AI uses this to evaluate thesis fit for each company.
        </p>
      </div>

      {mode === 'analyze' && (
        <div>
          <Label htmlFor="rawInput" className="text-sm font-medium text-gray-700 mb-1.5 block">
            Paste Source Material
          </Label>
          <Textarea
            id="rawInput"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste website copy, article text, product launch announcement, founder bio, job posting, or any other content about the company..."
            rows={8}
            className="text-sm resize-none font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Any format — AI will extract the structured company profile from whatever you paste.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-3 text-sm text-amber-700">
          <p className="font-medium mb-1">Some companies could not be scored:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          Run Scan
        </Button>
        <span className="text-xs text-gray-400">
          {mode === 'search' ? 'Scores matched companies against your thesis' : 'Extracts and scores the pasted company'}
        </span>
      </div>
    </form>
  );
}
