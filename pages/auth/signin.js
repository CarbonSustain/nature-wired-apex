import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { storeGoogleUser } from '../../utils/googleAuth';

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { campaignId } = router.query; // Get campaignId from URL
  
  // Debug logging
  console.log('🔍 SignIn page - router.query:', router.query);
  console.log('🔍 SignIn page - campaignId:', campaignId);
  console.log('🔍 SignIn page - router.asPath:', router.asPath);
  
  // Fallback: extract campaignId from URL if not in query
  const extractedCampaignId = campaignId || (router.asPath.includes('campaignId=') ? 
    router.asPath.split('campaignId=')[1]?.split('&')[0] : null);
  
  console.log('🔍 SignIn page - extractedCampaignId:', extractedCampaignId);

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        // If there's a campaignId, redirect to voting page with email source
        if (extractedCampaignId) {
          router.push(`/vote/campaign?campaign=${extractedCampaignId}&source=email`);
        } else {
          // For direct signin, redirect to admin dashboard
          router.push('/admin/dashboard');
        }
      }
    });
  }, [router, extractedCampaignId]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (extractedCampaignId) {
        localStorage.setItem('redirectCampaignId', extractedCampaignId);
      }

      const callbackUrl = extractedCampaignId
        ? `/vote/campaign?campaign=${extractedCampaignId}&source=email`
        : '/admin/dashboard';
      const result = await signIn('google', {
        callbackUrl,              // ← 相對路徑即可
        redirect: true,
      });

      if (result?.error) setError('Sign in failed. Please try again.');
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image
              src="/naturewired-logo.png"
              alt="Nature Backers Logo"
              width={180}
              height={180}
              className="mx-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Nature Backers
          </h1>
          <p className="text-gray-600">
            {extractedCampaignId 
              ? `Sign in to vote for campaign ${extractedCampaignId}`
              : 'Sign in to access your dashboard'
            }
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            By signing in, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 