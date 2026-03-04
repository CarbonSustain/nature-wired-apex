import { useRouter } from 'next/router';
import BlockchainVerification from '../../components/BlockchainVerification';

export default function BlockchainVerificationPage() {
  const router = useRouter();
  const { campaign: campaignId } = router.query;

  if (!campaignId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <BlockchainVerification campaignId={campaignId} />;
} 