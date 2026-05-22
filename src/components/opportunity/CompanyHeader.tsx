import { ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import type { Company } from '@/lib/types';

interface CompanyHeaderProps {
  company: Company;
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <article className="border-b-2 border-[#1a1816] pb-8 mb-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b1f2a] mb-3">
        Company Dossier · {company.sector}
      </div>
      <div className="flex items-start justify-between gap-8 mb-4">
        <h1 className="font-serif text-[44px] font-normal text-[#1a1816] tracking-[-0.02em] leading-[1]">
          {company.name}
        </h1>
        <div className="flex items-center gap-4 shrink-0 pt-3">
          <StatusBadge status={company.status} variant="pill" />
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b6358] hover:text-[#1a1816]"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </a>
          )}
        </div>
      </div>
      <p className="font-serif text-[18px] italic text-[#1a1816] leading-relaxed max-w-4xl mb-6">
        {company.description}
      </p>
      <dl className="grid grid-cols-5 gap-6 pt-5 border-t border-[#e8e2d4]">
        <Field label="Sector" value={company.sector} />
        <Field label="Workflow" value={company.workflowCategory} />
        <Field label="Stage" value={company.stage} />
        <Field label="Geography" value={company.geography} />
        <Field label="Source" value={company.sourceType === 'seed' ? 'Sourcing Corpus' : 'AI Extracted'} />
      </dl>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b6358] mb-1">{label}</dt>
      <dd className="text-[14px] text-[#1a1816]">{value}</dd>
    </div>
  );
}
