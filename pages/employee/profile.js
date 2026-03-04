import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

export default function EmployeeProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/naturewired-logo.png"
                alt="Nature Backers Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
              <div className="text-sm text-gray-500">
                Employee Voting Portal
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/employee/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600">
            View and manage your account information
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                ) : (
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {session?.user?.name}
                </h3>
                <p className="text-gray-600">{session?.user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Full Name</label>
                    <p className="text-gray-900">{session?.user?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email Address</label>
                    <p className="text-gray-900">{session?.user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Account Type</label>
                    <p className="text-gray-900">Employee</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Account Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">User ID</label>
                    <p className="text-gray-900">{session?.backendUserId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Login Method</label>
                    <p className="text-gray-900">Google</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Member Since</label>
                    <p className="text-gray-900">
                      {session?.user?.email_verified ? 'Verified' : 'Not verified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
              <div className="flex space-x-4">
                <Link
                  href="/vote/campaign?campaign=4"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Vote Now
                </Link>
                <Link
                  href="/employee/results"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Results
                </Link>
                <Link
                  href="/employee/dashboard"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 