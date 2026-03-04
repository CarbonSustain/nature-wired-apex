import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

export default function VotingConfirmation() {
  const router = useRouter();
  const { campaign: campaignId } = router.query;
  const [campaign, setCampaign] = useState(null);
  const [votingData, setVotingData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (campaignId) {
      loadVotingData();
      fetchCampaignData();
    }
  }, [campaignId]);

  const loadVotingData = () => {
    try {
      const storedData = localStorage.getItem('votingData');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.campaignId === campaignId) {
          setVotingData(data);
          fetchSelectedProject(data.selectedProject);
        } else {
          setError('Voting data mismatch');
        }
      } else {
        setError('No voting data found');
      }
    } catch (err) {
      setError('Failed to load voting data');
      console.error('Error loading voting data:', err);
    }
  };

  const fetchSelectedProject = async (projectId) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_NATUREWIRED_API;
      const response = await fetch(`${apiBase}/project/${projectId}`);
      if (response.ok) {
        const projectData = await response.json();
        setSelectedProject(projectData.data);
      }
    } catch (err) {
      console.error('Error fetching selected project:', err);
    }
  };

  const fetchCampaignData = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_NATUREWIRED_API;
      const campaignResponse = await fetch(`${apiBase}/campaign/${campaignId}`);
      if (campaignResponse.ok) {
        const campaignData = await campaignResponse.json();
        setCampaign(campaignData.data);
      }
    } catch (err) {
      console.error('Error fetching campaign data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToBackend = async () => {
    // Vote is already submitted in the voting page
    // This function is no longer needed
    console.log('✅ Vote already submitted to backend');
  };

  const handleGoBack = () => {
            router.push(`/vote/campaign/voting?campaign=${campaignId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !votingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Voting Error</h1>
            <p className="text-gray-600 mb-6">{error || 'No voting data found.'}</p>
            <Link
              href={`/vote/campaign?campaign=${campaignId}`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Campaign
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
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
            <div className="text-sm text-gray-500">
              Campaign ID: {campaignId}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Confirmation Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Review Your Vote
            </h1>
            <p className="text-lg text-gray-600">
              {campaign?.name}
            </p>
          </div>

          {/* Voting Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Voting Style:</span>
                <span className="ml-2 text-gray-600">Simple Choice</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Selected Project:</span>
                <span className="ml-2 text-gray-600">1 project</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Vote Time:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(votingData.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Project */}
        {selectedProject && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Selected Project
            </h2>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                  1
                </div>
                
                <div className="flex-1">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">{selectedProject.name}</h3>
                    <p className="text-sm text-gray-600">{selectedProject.organization}</p>
                  </div>
                  
                  {selectedProject.image && (
                    <div className="mb-4">
                      <Image
                        src={selectedProject.image}
                        alt={selectedProject.name}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <p className="text-gray-700 text-sm">
                    {selectedProject.description}
                  </p>
                  
                  {votingData?.reason && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Your Reason for Voting:</h4>
                      <p className="text-blue-800 text-sm italic">&ldquo;{votingData.reason}&rdquo;</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Go Back & Edit
          </button>
          
          <Link
                            href={`/vote/campaign/success?campaign=${campaignId}`}
            className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Continue to Success
          </Link>
        </div>
      </div>
    </div>
  );
} 