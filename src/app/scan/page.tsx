import { PageShell } from '@/components/layout/PageShell';
import { ScanForm } from '@/components/scan/ScanForm';

export default function ScanPage() {
  return (
    <PageShell
      title="New Sourcing Scan"
      description="Configure a scan to surface and score Vertical AI companies against your thesis."
    >
      <div className="max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <ScanForm />
        </div>
      </div>
    </PageShell>
  );
}
