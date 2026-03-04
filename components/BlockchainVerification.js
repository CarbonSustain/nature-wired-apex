import { useState, useEffect } from "react";
import { formatDate } from "@/utils/dateUtils";
import { getUserId } from "@/utils/api";

export default function BlockchainVerification({ campaignId }) {
  const [blockchainData, setBlockchainData] = useState(null);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBlockchainData();
    fetchProjects();
  }, [campaignId]);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
      const userId = await getUserId();
      const response = await fetch(`${API_BASE}/vote/hedera/${campaignId}?userId=${userId}`);

      if (response.ok) {
        const data = await response.json();
        setBlockchainData(data.data);
      } else {
        setError("Failed to fetch blockchain verification data");
      }
    } catch (err) {
      setError("Error loading blockchain verification data");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
      const response = await fetch(`${API_BASE}/project`);

      if (response.ok) {
        const data = await response.json();
        const projectsMap = {};
        data.data?.forEach(project => {
          projectsMap[project.id] = project;
        });
        setProjects(projectsMap);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  const truncateAddress = address => {
    if (!address) return "N/A";
    return address; // Show full address
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blockchain verification data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!blockchainData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Blockchain Data</h3>
          <p className="text-gray-600">No blockchain verification data found for this campaign.</p>
        </div>
      </div>
    );
  }

  const { message, voteCount, votes } = blockchainData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blockchain Verification</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hedera blockchain verification details for campaign {campaignId}
          </p>
        </div>

        {/* Blockchain Status Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Status</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-700 font-medium">Verified on Hedera</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Votes</h3>
              <div className="text-3xl font-bold text-green-600">{voteCount}</div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Blockchain Message</h3>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{message}</div>
            </div>
          </div>
        </div>

        {/* Blockchain Votes Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Blockchain Verified Votes</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Voter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vote Option
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blockchain Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {votes.map((vote, index) => (
                  <tr key={vote.voteId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vote.userName}</div>
                        <div className="text-sm text-gray-500">{vote.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {projects[vote.projectId]?.projectName || vote.projectName || "Unnamed Project"}
                      </div>
                      <div className="text-sm text-gray-500">ID: {vote.projectId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          vote.voteOption === "In Favor" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {vote.voteOption}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-gray-50 rounded px-2 py-1">
                        <code className="text-xs text-gray-700 break-all">{truncateAddress(vote.voterAddress)}</code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">{vote.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(vote.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Blockchain Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Network</h4>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-gray-700">Hedera Network</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Verification Type</h4>
              <div className="text-gray-700">Smart Contract Verification</div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Data Integrity</h4>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-700">Immutable & Tamper-Proof</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Timestamp</h4>
              <div className="text-gray-700">{formatDate(new Date())}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
