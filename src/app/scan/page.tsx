import { PageShell } from '@/components/layout/PageShell';
import { ScanForm } from '@/components/scan/ScanForm';

export default function ScanPage() {
  return (
    <PageShell
      eyebrow="Sourcing · New Scan"
      title={<>Configure a <em className="font-light italic text-[#6b1f2a]">sourcing scan</em></>}
      description="Surface and score Vertical AI companies against your investment thesis. AI runs against our curated corpus, or extracts a structured profile from any raw text you paste."
    >
      <div className="max-w-4xl bg-white border border-[#e8e2d4] p-10">
        <ScanForm />
      </div>
    </PageShell>
  );
}
