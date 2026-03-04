import { useState, useEffect } from "react";
import { getUserId } from "@/utils/api";
import { formatDate } from "@/utils/dateUtils";

export default function VotingResults({ campaignId }) {
  const [votingData, setVotingData] = useState(null);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVotingResults();
    fetchProjects();
  }, [campaignId]);

  const fetchVotingResults = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
      const userId = await getUserId();
      const response = await fetch(`${API_BASE}/vote/campaign-votes/${campaignId}?userId=${userId}`);

      if (response.ok) {
        const data = await response.json();
        setVotingData(data.data);
      } else {
        setError("Failed to fetch voting results");
      }
    } catch (err) {
      setError("Error loading voting results");
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

  const truncateHash = hash => {
    if (!hash) return "N/A";
    return hash; // Show full hash
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading voting results...</p>
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

  if (!votingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Voting Data</h3>
          <p className="text-gray-600">No voting results found for this campaign.</p>
        </div>
      </div>
    );
  }

  const { campaign, totalVotes, votes } = votingData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Voting Results</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Detailed voting results and blockchain verification for campaign
          </p>
        </div>

        {/* Campaign Info Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Campaign Details</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Name:</span> {campaign.name}
                </p>
                <p>
                  <span className="font-medium">ID:</span> {campaign.id}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction Hash</h3>
              <div className="bg-gray-50 rounded-lg p-3">
                <code className="text-sm text-gray-700 break-all">{campaign.tx_hash || "N/A"}</code>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Votes</h3>
              <div className="text-3xl font-bold text-green-600">{totalVotes}</div>
            </div>
          </div>
        </div>

        {/* Votes Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Individual Votes</h2>
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
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vote Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {votes.map((vote, index) => (
                  <tr key={vote.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {vote.user.first_name} {vote.user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{vote.user.business_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {projects[vote.project.id]?.projectName || vote.project.projectName || "Unnamed Project"}
                      </div>
                      <div className="text-sm text-gray-500">ID: {vote.project.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">{vote.voteData.reason}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-gray-50 rounded px-2 py-1">
                        <code className="text-xs text-gray-700 break-all">{truncateHash(vote.vote_hash)}</code>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(vote.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{votes.length}</div>
            <div className="text-sm text-gray-600">Total Votes Cast</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{new Set(votes.map(v => v.user.id)).size}</div>
            <div className="text-sm text-gray-600">Unique Voters</div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{new Set(votes.map(v => v.project.id)).size}</div>
            <div className="text-sm text-gray-600">Projects Voted On</div>
          </div>
        </div>
      </div>
    </div>
  );
}
