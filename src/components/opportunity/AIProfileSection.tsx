import type { AIProfile } from '@/lib/types';

interface AIProfileSectionProps {
  profile: AIProfile;
}

export function AIProfileSection({ profile }: AIProfileSectionProps) {
  return (
    <section className="border border-[#e8e2d4] bg-white p-8 mb-6">
      <SectionHeader eyebrow="AI Generated" title="Structured Profile" />

      <div className="grid grid-cols-2 gap-x-12 gap-y-7 mb-7">
        <Field label="Problem" value={profile.problem} />
        <Field label="Customer" value={profile.customer} />
        <Field label="AI Use Case" value={profile.aiUseCase} />
        <Field label="Data Moat Potential" value={profile.dataMoatPotential} />
        <Field label="Business Model" value={profile.businessModel} />
        <Field label="Funding Stage" value={profile.fundingStage} />
      </div>

      {profile.competitiveLandscape && (
        <div className="pt-6 border-t border-[#e8e2d4]">
          <Field label="Competitive Landscape" value={profile.competitiveLandscape} />
        </div>
      )}

      {profile.risks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[#e8e2d4]">
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358] mb-3">Identified Risks</div>
          <ol className="space-y-2">
            {profile.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] text-[#1a1816] leading-relaxed">
                <span className="font-mono text-[10px] text-[#6b1f2a] mt-1 shrink-0 w-5">{String(i + 1).padStart(2, '0')}</span>
                <span>{risk}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-6 pb-3 border-b border-[#1a1816]">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b1f2a] border border-[#6b1f2a] rounded-sm px-1.5 py-[2px]">
        AI · Generated
      </span>
      <h2 className="font-serif text-[22px] text-[#1a1816] tracking-tight">{title}</h2>
      <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b6358]">{eyebrow}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358] mb-1.5">{label}</div>
      <p className="text-[14px] text-[#1a1816] leading-relaxed">{value}</p>
    </div>
  );
}
