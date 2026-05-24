import { ExternalLink } from 'lucide-react';

interface SourcesCardProps {
  urls: string[];
}

export function SourcesCard({ urls }: SourcesCardProps) {
  if (urls.length === 0) return null;

  return (
    <section className="border border-[#e8e2d4] bg-white p-8 mb-6">
      <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[#1a1816]">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b6358] border border-[#e8e2d4] rounded-sm px-1.5 py-[2px]">
          Provenance
        </span>
        <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">Sources</h2>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358]">
          {urls.length} {urls.length === 1 ? 'page' : 'pages'} evaluated
        </span>
      </div>

      <ol className="space-y-2.5">
        {urls.map((url, i) => (
          <li key={i} className="flex items-start gap-3 group">
            <span className="font-mono text-[10px] text-[#6b1f2a] mt-1 shrink-0 w-6">
              {String(i + 1).padStart(2, '0')}
            </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 font-mono text-[12px] text-[#0f1e3a] hover:text-[#6b1f2a] transition-colors break-all leading-relaxed"
            >
              <span>{prettifyUrl(url)}</span>
              <ExternalLink className="w-3 h-3 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </li>
        ))}
      </ol>

      <p className="mt-5 pt-4 border-t border-[#e8e2d4] font-mono text-[9px] uppercase tracking-[0.1em] text-[#908874]">
        These are the URLs AI fetched and read when generating this company&apos;s profile and thesis score.
      </p>
    </section>
  );
}

function prettifyUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname === '/' ? '' : u.pathname;
    return `${u.hostname.replace(/^www\./, '')}${path}`;
  } catch {
    return url;
  }
}
