import { useState, useEffect } from "react";
import { formatDate } from "@/utils/dateUtils";
import { getUserId } from "@/utils/api";

export default function BlockchainVerification({ campaignId }) {
  const [blockchainData, setBlockchainData] = useState(null);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payout state
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [payoutProcessing, setPayoutProcessing] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

  useEffect(() => {
    fetchBlockchainData();
    fetchProjects();
    fetchPayouts();
  }, [campaignId]);

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
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

  const fetchPayouts = async () => {
    try {
      setPayoutsLoading(true);
      const userId = await getUserId();
      const response = await fetch(`${API_BASE}/vote/payouts/${campaignId}?userId=${userId}`);

      if (response.ok) {
        const data = await response.json();
        setPayouts(data.data?.payouts || []);
      } else if (response.status !== 404) {
        console.error("Failed to fetch payouts:", response.status);
      }
    } catch (err) {
      console.error("Error fetching payouts:", err);
    } finally {
      setPayoutsLoading(false);
    }
  };

  const handlePayout = async () => {
    if (payoutProcessing) return;

    const confirmed = window.confirm(
      "Are you sure you want to process the payout for this campaign? This will distribute 1 HBAR to winning projects based on vote results and record the transaction on the Hedera blockchain."
    );
    if (!confirmed) return;

    try {
      setPayoutProcessing(true);
      setPayoutError("");
      setPayoutSuccess("");

      const userId = await getUserId();

      const response = await fetch(`${API_BASE}/vote/payout/${campaignId}?userId=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.ok) {
        const txHash = result.data?.txHash || "Recorded";
        setPayoutSuccess(`Payout processed successfully! TX Hash: ${txHash}`);
        // Refresh payouts table to show the new record
        await fetchPayouts();
      } else {
        setPayoutError(result.message || "Failed to process payout");
      }
    } catch (err) {
      console.error("Payout error:", err);
      setPayoutError("Error processing payout. Please try again.");
    } finally {
      setPayoutProcessing(false);
    }
  };

  const truncateAddress = address => {
    if (!address) return "N/A";
    return address;
  };

  const truncateHash = hash => {
    if (!hash) return "N/A";
    if (hash.length > 30) {
      return `${hash.slice(0, 16)}...${hash.slice(-12)}`;
    }
    return hash;
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

        {/* Payout Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Payouts</h2>
              <p className="text-sm text-gray-500 mt-1">
                Distribute HBAR to winning projects and track transaction hashes
              </p>
            </div>
            {!payoutsLoading && payouts.length > 0 ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-green-700">Payout already processed</span>
              </div>
            ) : (
              <button
                onClick={handlePayout}
                disabled={payoutProcessing || payoutsLoading}
                className={`flex items-center px-6 py-3 rounded-lg font-medium text-white transition-all ${
                  payoutProcessing || payoutsLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-md hover:shadow-lg"
                }`}
              >
                {payoutProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Process Payout
                  </>
                )}
              </button>
            )}
          </div>

          {/* Payout Success/Error Messages */}
          {payoutSuccess && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-green-800 font-medium">Payout Successful</p>
                <p className="text-green-700 text-sm mt-1">{payoutSuccess}</p>
              </div>
              <button onClick={() => setPayoutSuccess("")} className="ml-auto text-green-600 hover:text-green-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {payoutError && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <p className="text-red-800 font-medium">Payout Failed</p>
                <p className="text-red-700 text-sm mt-1">{payoutError}</p>
              </div>
              <button onClick={() => setPayoutError("")} className="ml-auto text-red-600 hover:text-red-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Payouts Table */}
          <div className="p-6">
            {payoutsLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500 text-sm">Loading payouts...</p>
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500">No payouts have been processed yet for this campaign.</p>
                <p className="text-gray-400 text-sm mt-1">
                  Click &quot;Process Payout&quot; to distribute HBAR to winning projects.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TX Hash
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payouts.map((payout, index) => (
                      <tr key={payout.id || index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="bg-gray-50 rounded px-2 py-1">
                            {payout.txId ? (
                              <a
                                href={`https://hashscan.io/testnet/transaction/${payout.txId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-mono break-all"
                                title={payout.txId}
                              >
                                {truncateHash(payout.txId)}
                                <svg
                                  className="w-3 h-3 inline-block ml-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            ) : (
                              <code className="text-xs text-gray-500">Pending...</code>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payout.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Vote Distribution Per Project */}
        {votes && votes.length > 0 && (() => {
          // Tally votes per project
          const tally = {};
          votes.forEach(vote => {
            const pid = vote.projectId;
            if (!tally[pid]) {
              tally[pid] = {
                projectId: pid,
                projectName: projects[pid]?.projectName || vote.projectName || "Unnamed Project",
                count: 0,
              };
            }
            tally[pid].count++;
          });

          // Sort descending by count
          const sorted = Object.values(tally).sort((a, b) => b.count - a.count);
          const totalVotesCount = votes.length;

          return (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Vote Distribution Per Project</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Breakdown of how votes were distributed across projects
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {sorted.map((project, index) => {
                    const pct = totalVotesCount > 0 ? ((project.count / totalVotesCount) * 100).toFixed(1) : 0;
                    const barColors = [
                      "bg-green-500",
                      "bg-blue-500",
                      "bg-purple-500",
                      "bg-yellow-500",
                      "bg-pink-500",
                      "bg-indigo-500",
                    ];
                    const barColor = barColors[index % barColors.length];

                    return (
                      <div key={project.projectId}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              #{index + 1} {project.projectName}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">ID: {project.projectId}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-semibold text-gray-900">{project.count} votes</span>
                            <span className="text-sm font-bold text-gray-700">{pct}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`${barColor} h-3 rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary row */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-900">{totalVotesCount} votes</span>
                    <span className="text-sm font-bold text-gray-700">100%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
                <span className="text-green-700">Immutable &amp; Tamper-Proof</span>
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