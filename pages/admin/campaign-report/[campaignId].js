import { useRouter } from 'next/router';
import CampaignReport from '@/components/CampaignReport';
import SidebarLayout from '@/components/SidebarLayout';

export default function CampaignReportPage() {
  const router = useRouter();
  const { campaignId } = router.query;

  if (!campaignId) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Campaign ID Required</h3>
            <p className="text-gray-600">Please provide a valid campaign ID to view the report.</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-white">
        {/* Header with back button */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campaign Report</h1>
              <p className="text-gray-600">Comprehensive analysis for Campaign #{campaignId}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Campaign Report Component */}
        <CampaignReport campaignId={campaignId} />
      </div>
    </SidebarLayout>
  );
} 