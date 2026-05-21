import { FitBadge } from '@/components/dashboard/FitBadge';
import type { ThesisFitAnalysis } from '@/lib/types';

interface ThesisFitSectionProps {
  fit: ThesisFitAnalysis;
}

const REC_STYLES = {
  Priority: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Watch: 'text-amber-700 bg-amber-50 border-amber-200',
  Pass: 'text-gray-600 bg-gray-50 border-gray-200',
};

export function ThesisFitSection({ fit }: ThesisFitSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-0.5">AI Generated</span>
        <h2 className="text-sm font-semibold text-gray-900">Thesis Fit Analysis</h2>
      </div>

      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{fit.fitScore}</div>
          <div className="text-xs text-gray-400 mt-0.5">/ 100</div>
        </div>
        <div>
          <FitBadge score={fit.fitScore} />
          <div className="mt-1.5">
            <span className={`text-xs font-semibold border rounded px-2 py-0.5 ${REC_STYLES[fit.recommendation]}`}>
              {fit.recommendation}
            </span>
          </div>
        </div>
        <div className="flex-1 pl-4 border-l border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed">{fit.rationale}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Key Risks</h3>
          <ul className="space-y-1.5">
            {fit.keyRisks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-300 shrink-0 mt-0.5">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Diligence Questions</h3>
          <ul className="space-y-1.5">
            {fit.diligenceQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-300 shrink-0 mt-0.5">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {fit.nextStep && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">AI Suggested Next Step</span>
          <p className="text-sm text-gray-700">{fit.nextStep}</p>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Scored against: <span className="italic">&ldquo;{fit.thesisPromptUsed}&rdquo;</span>
      </p>
    </div>
  );
}
