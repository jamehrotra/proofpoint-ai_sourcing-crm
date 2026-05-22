'use client';

import { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PdfDropzoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

const MAX_BYTES = 10 * 1024 * 1024;

export function PdfDropzone({ file, onChange }: PdfDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFile(f: File | null) {
    setError(null);
    if (!f) {
      onChange(null);
      return;
    }
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError('PDF too large (max 10 MB).');
      return;
    }
    onChange(f);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (file) {
    return (
      <div className="border border-[#1a1816] bg-[#f5f1e8] p-5 max-w-3xl flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <FileText className="w-8 h-8 text-[#6b1f2a] shrink-0 mt-0.5" />
          <div>
            <div className="font-serif text-[16px] text-[#1a1816] tracking-tight mb-0.5">{file.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
              PDF · {formatSize(file.size)} · Ready
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}
          className="text-[#6b6358] hover:text-[#6b1f2a] transition-colors"
          aria-label="Remove file"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) handleFile(dropped);
        }}
        className={cn(
          'flex flex-col items-center justify-center text-center px-6 py-12 border-2 border-dashed transition-colors cursor-pointer',
          dragOver ? 'border-[#1a1816] bg-[#f5f1e8]' : 'border-[#d4cec0] bg-white hover:border-[#1a1816] hover:bg-[#f5f1e8]/40'
        )}
      >
        <Upload className="w-7 h-7 text-[#6b6358] mb-3" />
        <div className="font-serif text-[18px] italic text-[#1a1816] mb-1">
          Drop a PDF here or click to upload
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
          Pitch deck, one-pager, or market report · Max 10 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {error && (
        <div className="mt-3 bg-[#6b1f2a]/[0.06] border-l-2 border-[#6b1f2a] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b1f2a] mb-1">Error</div>
          <p className="text-[13px] text-[#1a1816]">{error}</p>
        </div>
      )}
    </div>
  );
}
