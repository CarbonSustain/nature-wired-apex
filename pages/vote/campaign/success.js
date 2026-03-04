import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

export default function VotingSuccess() {
  const router = useRouter();
  const { campaign: campaignId } = router.query;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Vote Submitted Successfully!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Thank you for participating in the voting campaign. Your vote has been recorded and will be counted in the final results.
          </p>

          {/* Campaign Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Campaign Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Campaign ID:</span>
                <span className="ml-2 text-gray-600">{campaignId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Submission Time:</span>
                <span className="ml-2 text-gray-600">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">What Happens Next?</h3>
            <div className="text-left space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold mt-0.5">
                  1
                </div>
                <p>Your vote has been securely recorded in our system</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold mt-0.5">
                  2
                </div>
                <p>All votes will be tallied when the campaign ends</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold mt-0.5">
                  3
                </div>
                <p>Results will be announced to all participants</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
                              href={`/vote/campaign?campaign=${campaignId}`}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back to Campaign
            </Link>
            
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Image
              src="/naturewired-logo.png"
              alt="Nature Backers Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </div>
          <p className="text-sm text-gray-500">
            Thank you for your participation in making a difference!
          </p>
        </div>
      </div>
    </div>
  );
} 