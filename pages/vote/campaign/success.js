import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getUserId } from '@/utils/api';

const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

export default function VotingSuccess() {
  const router = useRouter();
  const { campaign: campaignId } = router.query;

  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [volunteerState, setVolunteerState] = useState('idle'); // idle | loading | done | error
  const [volunteerDismissed, setVolunteerDismissed] = useState(false);

  // Show the volunteer popup shortly after the page loads
  useEffect(() => {
    const timer = setTimeout(() => setShowVolunteerModal(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleVolunteerYes = async () => {
    setVolunteerState('loading');
    try {
      const userId = await getUserId();
      if (!userId) throw new Error('Could not determine user');

      const res = await fetch(`${API_BASE}/volunteer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, campaignId: Number(campaignId) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to register');
      }

      setVolunteerState('done');
    } catch (err) {
      console.error('Volunteer error:', err);
      setVolunteerState('error');
    }
  };

  const handleDismiss = () => {
    setShowVolunteerModal(false);
    setVolunteerDismissed(true);
  };

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
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold mt-0.5">1</div>
                <p>Your vote has been securely recorded in our system</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold mt-0.5">2</div>
                <p>All votes will be tallied when the campaign ends</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold mt-0.5">3</div>
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
              Back to Campaign
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

      {/* Volunteer Modal */}
      {showVolunteerModal && !volunteerDismissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-100 text-center animate-[fadeInUp_0.25s_ease-out]">

            {volunteerState === 'idle' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to Volunteer?</h2>
                <p className="text-gray-600 mb-8">
                  Want to go further? Sign up to volunteer for this campaign and help make a real difference on the ground.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleVolunteerYes}
                    className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors shadow-md"
                  >
                    Yes, I want to volunteer!
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </>
            )}

            {volunteerState === 'loading' && (
              <div className="py-4">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Registering your interest...</p>
              </div>
            )}

            {volunteerState === 'done' && (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re Signed Up!</h2>
                <p className="text-gray-600 mb-6">
                  Thank you for volunteering. We&apos;ll be in touch with next steps for this campaign.
                </p>
                <button
                  onClick={handleDismiss}
                  className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                >
                  Close
                </button>
              </>
            )}

            {volunteerState === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Something went wrong</h2>
                <p className="text-gray-600 mb-6">We couldn&apos;t save your volunteer registration. Please try again.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setVolunteerState('idle')}
                    className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Try again
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
