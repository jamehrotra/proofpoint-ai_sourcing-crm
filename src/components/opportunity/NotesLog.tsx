'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { X } from 'lucide-react';
import { displayNameForUsername } from '@/lib/auth';
import type { NoteLogRow } from '../../../db/queries/notesLog';

interface NotesLogProps {
  notes: NoteLogRow[];
}

export function NotesLog({ notes }: NotesLogProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (notes.length === 0) return null;

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="border border-[#e8e2d4] bg-white p-8 mb-6">
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[#1a1816]">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#1a1816] border border-[#1a1816] rounded-sm px-1.5 py-[2px]">
          Human · Notes
        </span>
        <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">Reviewer Journal</h2>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
          {notes.length} {notes.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <ol className="space-y-5">
        {notes.map((note) => (
          <li key={note.id} className="flex items-start gap-4 group">
            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b1f2a] shrink-0 w-24 pt-1">
              {formatDate(note.createdAt)}
            </div>
            <div className="flex-1 border-l-2 border-[#e8e2d4] pl-4">
              <p className="font-serif text-[15px] text-[#1a1816] leading-[1.65] whitespace-pre-wrap">
                {note.body}
              </p>
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#908874]">
                — {displayNameForUsername(note.author)}
              </p>
            </div>
            <button
              onClick={() => handleDelete(note.id)}
              disabled={busyId === note.id}
              className="text-[#908874] hover:text-[#6b1f2a] transition-colors p-1 opacity-0 group-hover:opacity-100 disabled:opacity-50"
              aria-label="Delete note"
            >
              <X className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
