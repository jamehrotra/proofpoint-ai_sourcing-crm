'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface RemoveCompanyButtonProps {
  companyId: string;
  companyName: string;
}

export function RemoveCompanyButton({ companyId, companyName }: RemoveCompanyButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/companies/${companyId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to remove company.');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] hover:text-[#6b1f2a] transition-colors inline-flex items-center gap-1.5 py-1 px-2"
      >
        <Trash2 className="w-3 h-3" />
        Remove
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-[#6b1f2a]/[0.06] border border-[#6b1f2a] rounded-sm px-3 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b1f2a]">
        Remove {companyName}?
      </span>
      <button
        onClick={handleConfirm}
        disabled={busy}
        className="font-mono text-[10px] uppercase tracking-[0.1em] font-medium bg-[#6b1f2a] text-[#faf7f2] px-2.5 py-1 rounded-sm hover:bg-[#1a1816] transition-colors disabled:opacity-50"
      >
        {busy ? 'Removing...' : 'Confirm'}
      </button>
      <button
        onClick={() => { setConfirming(false); setError(null); }}
        disabled={busy}
        className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] hover:text-[#1a1816] transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      {error && (
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b1f2a]">{error}</span>
      )}
    </div>
  );
}
