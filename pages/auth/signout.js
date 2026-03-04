import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { clearGoogleUser } from '../../utils/googleAuth';
import { clearBackendAuth } from '../../utils/backendAuth';

export default function SignOut() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  const handleSignOut = async () => {
    // Clear Google user data from localStorage
    clearGoogleUser();
    // Clear backend authentication data
    clearBackendAuth();
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const handleCancel = () => {
    router.back();
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sign Out
            </h1>
            <p className="text-gray-600">
              Are you sure you want to sign out?
            </p>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Signed in as: <span className="font-medium">{session.user?.email}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 