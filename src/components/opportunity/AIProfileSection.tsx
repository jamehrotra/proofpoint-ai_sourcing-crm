import type { AIProfile } from '@/lib/types';

interface AIProfileSectionProps {
  profile: AIProfile;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1">{label}</span>
      <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
    </div>
  );
}

export function AIProfileSection({ profile }: AIProfileSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-0.5">AI Generated</span>
        <h2 className="text-sm font-semibold text-gray-900">Company Profile</h2>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        <Field label="Problem" value={profile.problem} />
        <Field label="Customer" value={profile.customer} />
        <Field label="AI Use Case" value={profile.aiUseCase} />
        <Field label="Data Moat Potential" value={profile.dataMoatPotential} />
        <Field label="Business Model" value={profile.businessModel} />
        <Field label="Funding Stage" value={profile.fundingStage} />
      </div>
      {profile.competitiveLandscape && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <Field label="Competitive Landscape" value={profile.competitiveLandscape} />
        </div>
      )}
      {profile.risks.length > 0 && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-2">Risks</span>
          <ul className="space-y-1.5">
            {profile.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-300 mt-0.5 shrink-0">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
