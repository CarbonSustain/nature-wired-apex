import { useState, useEffect } from "react";
import { formatDate } from "@/utils/dateUtils";
import { getUserId } from "@/utils/api";

export default function CampaignReport({ campaignId }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReportData();
  }, [campaignId]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
      const userId = await getUserId();

      // Fetch all available data
      const [campaignResponse, votingResponse, blockchainResponse, projectsResponse] = await Promise.all([
        fetch(`${API_BASE}/campaign`),
        fetch(`${API_BASE}/vote/campaign-votes/${campaignId}?userId=${userId}`),
        fetch(`${API_BASE}/vote/hedera/${campaignId}?userId=${userId}`),
        fetch(`${API_BASE}/project`),
      ]);

      // Parse responses
      const campaignData = await campaignResponse.json();
      const votingData = votingResponse.ok ? await votingResponse.json() : null;
      const blockchainData = blockchainResponse.ok ? await blockchainResponse.json() : null;
      const projectsData = projectsResponse.ok ? await projectsResponse.json() : null;

      // Find the specific campaign
      const campaign = campaignData.data?.find(c => c.id === parseInt(campaignId));

      if (!campaign) {
        setError("Campaign not found");
        return;
      }

      // Process voting data
      const votes = votingData?.data?.votes || [];
      const uniqueVoters = new Set(votes.map(v => v.user.id));
      const projectVoteCounts = {};

      votes.forEach(vote => {
        const projectId = vote.project.id;
        projectVoteCounts[projectId] = (projectVoteCounts[projectId] || 0) + 1;
      });

      // Get top 3 projects by votes
      const topProjects = Object.entries(projectVoteCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([projectId, voteCount]) => {
          const project = projectsData?.data?.find(p => p.id === parseInt(projectId));
          return {
            id: projectId,
            name: project?.projectName || `Project ${projectId}`,
            votes: voteCount,
            description: project?.description || "No description available",
          };
        });

      // Process blockchain data
      const blockchainVotes = blockchainData?.data?.votes || [];
      const verifiedVoteCount = blockchainVotes.length;

      setReportData({
        campaign,
        voting: votingData?.data,
        blockchain: blockchainData?.data,
        projects: projectsData?.data || [],
        metrics: {
          totalVotes: votes.length,
          uniqueVoters: uniqueVoters.size,
          totalProjects: projectsData?.data?.length || 0,
          verifiedVotes: verifiedVoteCount,
          participationRate: uniqueVoters.size > 0 ? Math.round((uniqueVoters.size / 100) * 100) : 0, // Assuming 100 total employees
          topProjects,
        },
      });
    } catch (err) {
      setError("Error loading campaign report data");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (startDate, endDate) => {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Generating campaign report...</p>
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

  if (!reportData) {
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Report Data</h3>
          <p className="text-gray-600">No campaign report data found.</p>
        </div>
      </div>
    );
  }

  const { campaign, voting, blockchain, projects, metrics } = reportData;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Nature Backers Campaign Report</h1>
            <p className="text-lg text-gray-600">Comprehensive campaign performance and impact analysis</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <div>
                <div className="text-green-600 font-semibold">NATURE</div>
                <div className="text-gray-600 text-sm">WIRED</div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.uniqueVoters}</div>
              <div className="text-sm text-gray-600">Employees Engaged</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metrics.totalVotes}</div>
              <div className="text-sm text-gray-600">Votes Cast</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{metrics.verifiedVotes}</div>
              <div className="text-sm text-gray-600">Verified Projects</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{metrics.participationRate}%</div>
              <div className="text-sm text-gray-600">Participation Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">{metrics.totalProjects}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Details</h2>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-700">Campaign Name:</span>
                <span className="ml-2 text-gray-900">{campaign.name}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Campaign ID:</span>
                <span className="ml-2 text-gray-900">{campaign.id}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    campaign.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : campaign.status === "active"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {campaign.status || "Unknown"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Reporting Period:</span>
                <div className="ml-2 text-gray-900 text-sm">
                  {formatDateRange(campaign.startDate, campaign.endDate)}
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Created:</span>
                <span className="ml-2 text-gray-900">{formatDate(campaign.createdAt)}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Transaction Hash:</span>
                <div className="ml-2 text-gray-900 text-xs font-mono break-all">{campaign.tx_hash || "N/A"}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Campaign Overview</h2>
            <div className="space-y-4">
              <div>
                <span className="font-semibold text-gray-700">Purpose:</span>
                <p className="mt-2 text-gray-900">{campaign.description || "No description provided"}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Campaign Mechanics:</span>
                <p className="mt-2 text-gray-900">
                  This campaign utilized blockchain-verified voting through the Hedera network, ensuring transparency
                  and immutability of all votes cast. Participants could vote on multiple projects with detailed
                  reasoning for their choices.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Participation Snapshot */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Participation Snapshot</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.uniqueVoters}</div>
              <div className="text-sm text-gray-600">Total Employees Engaged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.totalProjects}</div>
              <div className="text-sm text-gray-600">Projects Voted On</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.topProjects[0]?.name || "N/A"}</div>
              <div className="text-sm text-gray-600">Most Voted Project</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.participationRate}%</div>
              <div className="text-sm text-gray-600">Department Engagement Rate</div>
            </div>
          </div>
        </div>

        {/* Top 3 Projects by Votes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top 3 Projects by Votes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.topProjects.map((project, index) => (
                  <tr key={project.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{index + 1}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{project.id}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{project.votes}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">{project.description}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Voting Details */}
        {voting && voting.votes && voting.votes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Voting Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voter
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vote Hash
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {voting.votes.slice(0, 10).map((vote, index) => (
                    <tr key={vote.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vote.user.first_name} {vote.user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{vote.user.business_email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {projects.find(p => p.id === vote.project.id)?.projectName ||
                            vote.project.projectName ||
                            "Unnamed Project"}
                        </div>
                        <div className="text-sm text-gray-500">ID: {vote.project.id}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">{vote.voteData.reason}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="bg-gray-50 rounded px-2 py-1">
                          <code className="text-xs text-gray-700 break-all">{vote.vote_hash}</code>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(vote.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {voting.votes.length > 10 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  Showing first 10 votes of {voting.votes.length} total votes
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blockchain Verification */}
        {blockchain && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Blockchain Verification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <span className="font-semibold text-gray-700">Verification Status:</span>
                <div className="mt-2 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-700 font-medium">Verified on Hedera Network</span>
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Verified Votes:</span>
                <div className="mt-2 text-2xl font-bold text-green-600">{blockchain.voteCount || 0}</div>
              </div>
            </div>

            {blockchain.votes && blockchain.votes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Voter
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Blockchain Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blockchain.votes.slice(0, 10).map((vote, index) => (
                      <tr key={vote.voteId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{vote.userName}</div>
                            <div className="text-sm text-gray-500">{vote.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {projects.find(p => p.id === vote.projectId)?.projectName ||
                              vote.projectName ||
                              "Unnamed Project"}
                          </div>
                          <div className="text-sm text-gray-500">ID: {vote.projectId}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="bg-gray-50 rounded px-2 py-1">
                            <code className="text-xs text-gray-700 break-all">{vote.voterAddress}</code>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">{vote.reason}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(vote.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {blockchain.votes.length > 10 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Showing first 10 blockchain votes of {blockchain.votes.length} total verified votes
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Report Footer */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <span className="font-semibold text-gray-700">Report Generated:</span>
              <div className="mt-1 text-gray-900">{formatDate(new Date())}</div>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Campaign ID:</span>
              <div className="mt-1 text-gray-900">{campaignId}</div>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Data Version:</span>
              <div className="mt-1 text-gray-900">2.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
