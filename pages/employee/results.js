import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

export default function EmployeeResults() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchResults();
  }, [session, status, router]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      // This would be your actual results API endpoint
      const response = await fetch(`${API_BASE}/vote/results`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Voting Results
          </h1>
          <p className="text-gray-600">
            View the latest voting results and campaign outcomes
          </p>
        </div>

        {/* Results Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Campaign Results</h2>
          </div>
          <div className="p-6">
            {results.length > 0 ? (
              <div className="space-y-6">
                {results.map((result) => (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {result.campaignName}
                    </h3>
                    <p className="text-gray-600 mb-4">{result.description}</p>
                    
                    <div className="space-y-3">
                      {result.projects?.map((project, index) => (
                        <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{project.name}</h4>
                              <p className="text-sm text-gray-600">{project.organization}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {typeof project.votes === 'number' ? project.votes : typeof project.votes === 'object' ? Object.keys(project.votes || {}).length : 0} votes
                            </div>
                            <div className="text-sm text-gray-600">
                              {project.percentage || 0}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500">No results available yet</p>
                <p className="text-sm text-gray-400 mt-2">Results will appear here once voting is complete</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 