import { ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import type { Company } from '@/lib/types';

interface CompanyHeaderProps {
  company: Company;
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-gray-900">{company.name}</h1>
            <StatusBadge status={company.status} />
          </div>
          <p className="text-sm text-gray-500">{company.description}</p>
        </div>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Website
          </a>
        )}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
        <div>
          <span className="text-xs text-gray-400 block mb-0.5">Sector</span>
          <span className="text-sm text-gray-700 font-medium">{company.sector}</span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-0.5">Workflow</span>
          <span className="text-sm text-gray-700 font-medium">{company.workflowCategory}</span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-0.5">Stage</span>
          <span className="text-sm text-gray-700 font-medium">{company.stage}</span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-0.5">Geography</span>
          <span className="text-sm text-gray-700 font-medium">{company.geography}</span>
        </div>
        <div>
          <span className="text-xs text-gray-400 block mb-0.5">Source</span>
          <span className="text-sm text-gray-700 font-medium capitalize">{company.sourceType === 'seed' ? 'Corpus' : 'AI Extracted'}</span>
        </div>
      </div>
    </div>
  );
}
