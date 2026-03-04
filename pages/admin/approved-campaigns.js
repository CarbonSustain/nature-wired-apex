import { useState, useEffect } from "react";
import Link from "next/link";
import ApprovedCampaignCard from "../../components/ApprovedCampaignCard";
import SidebarLayout from "../../components/SidebarLayout";
import VotingResults from "../../components/VotingResults";
import BlockchainVerification from "../../components/BlockchainVerification";
import { getUserId } from "@/utils/api";

export default function ApprovedCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingProgress, setLoadingProgress] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [activeTab, setActiveTab] = useState("database");

  useEffect(() => {
    fetchApprovedCampaigns();
  }, []);

  const fetchApprovedCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      setLoadingProgress("Fetching campaigns...");

      const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
      console.log("API_BASE:", API_BASE);

      setLoadingProgress("Loading campaigns from backend...");
      const campaignsTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Campaigns fetch timeout")), 10000)
      );

      const campaignsResponse = await Promise.race([
        fetch(`${API_BASE}/campaign`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }),
        campaignsTimeout,
      ]);

      if (!campaignsResponse.ok) {
        throw new Error(`Failed to fetch campaigns: ${campaignsResponse.status}`);
      }

      const campaignsData = await campaignsResponse.json();
      const campaigns = campaignsData.data || [];

      console.log("All campaigns:", campaigns);
      console.log(
        "Campaign statuses:",
        campaigns.map(c => ({ id: c.id, status: c.status, campaignStatusId: c.campaignStatusId }))
      );

      // Filter campaigns to only show approved ones
      const approvedCampaigns = campaigns.filter(campaign => {
        // Check if campaign has approved status
        const isApproved =
          campaign.status === "approved" || campaign.status === "Approved" || campaign.campaignStatusId === 5; // Approved status ID is 5

        console.log(
          `Campaign ${campaign.id} (${campaign.name}): status="${campaign.status}", campaignStatusId=${campaign.campaignStatusId}, isApproved=${isApproved}`
        );

        return isApproved;
      });

      console.log("Found", approvedCampaigns.length, "campaigns");

      const userId = await getUserId();

      setLoadingProgress("Fetching vote and hedera data...");
      const enrichedCampaigns = await Promise.allSettled(
        approvedCampaigns.map(async campaign => {
          try {
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 3000));

            let votes = [];
            let hederaInfo = null;
            let totalVotes = 0;

            try {
              const [votesResponse, hederaResponse] = await Promise.race([
                Promise.all([
                  fetch(`${API_BASE}/vote/campaign-votes/${campaign.id}?userId=${userId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                  }),
                  fetch(`${API_BASE}/vote/hedera/${campaign.id}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                  }),
                ]),
                timeout,
              ]);

              if (votesResponse.ok) {
                const votesData = await votesResponse.json();
                console.log(`Campaign ${campaign.id} raw votes response:`, votesData);
                console.log(`Campaign ${campaign.id} data structure:`, {
                  hasData: !!votesData.data,
                  hasTotalVotes: !!votesData.data?.totalVotes,
                  totalVotesValue: votesData.data?.totalVotes,
                  hasVotes: !!votesData.data?.votes,
                  votesLength: votesData.data?.votes?.length,
                });

                const votesArray = votesData.data?.votes || votesData.data || votesData || [];
                votes = votesArray;
                totalVotes = votesData.data?.totalVotes || votesArray.length || 0;
                console.log(`Campaign ${campaign.id} final calculation:`, {
                  votesArrayLength: votesArray.length,
                  totalVotesFromAPI: votesData.data?.totalVotes,
                  finalTotalVotes: totalVotes,
                });
              } else {
                console.log(`Votes API returned ${votesResponse.status} for campaign ${campaign.id}`);
                const errorText = await votesResponse.text();
                console.log(`Votes response:`, errorText);
                // Set default values when API fails
                votes = [];
                totalVotes = 0;
              }

              if (hederaResponse.ok) {
                const hederaData = await hederaResponse.json();
                hederaInfo = hederaData.data || hederaData || null;
                console.log(`Campaign ${campaign.id} hedera:`, hederaInfo);
              } else {
                console.log(`Hedera API returned ${hederaResponse.status} for campaign ${campaign.id}`);
                console.log(`Hedera response:`, await hederaResponse.text());
              }
            } catch (apiError) {
              console.log(`API call failed for campaign ${campaign.id}:`, apiError.message);
              // Continue with empty data instead of failing
            }

            return { ...campaign, votes, hederaInfo, totalVotes };
          } catch (error) {
            console.error(`Error fetching data for campaign ${campaign.id}:`, error);
            return { ...campaign, votes: [], hederaInfo: null, totalVotes: 0 };
          }
        })
      );

      const finalCampaigns = enrichedCampaigns
        .map(result => {
          if (result.status === "fulfilled") {
            return result.value;
          } else {
            console.error("Campaign fetch failed:", result.reason);
            return null;
          }
        })
        .filter(campaign => campaign !== null);

      console.log("Final campaigns data:", finalCampaigns);
      console.log("Campaign 1 vote count check:", finalCampaigns.find(c => c.id === 1)?.totalVotes);
      setCampaigns(finalCampaigns);
    } catch (err) {
      setError("Failed to load approved campaigns");
      console.error("Error fetching approved campaigns:", err);
    } finally {
      setLoading(false);
      setLoadingProgress("");
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading approved campaigns...</p>
            {loadingProgress && <p className="text-sm text-gray-500">{loadingProgress}</p>}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const handleCampaignClick = campaign => {
    setSelectedCampaign(campaign);
    setActiveTab("database");
  };

  const handleBackToList = () => {
    setSelectedCampaign(null);
    setActiveTab("database");
  };

  if (selectedCampaign) {
    return (
      <SidebarLayout>
        <div className="p-8">
          {/* Back Button */}
          <button
            onClick={handleBackToList}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Campaigns
          </button>

          {/* Campaign Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{selectedCampaign.name}</h1>
              <p className="text-gray-600">Campaign ID: {selectedCampaign.id}</p>
            </div>
            <Link
              href={`/admin/campaign-report/${selectedCampaign.id}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>View Full Report</span>
            </Link>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab("database")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "database"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Database Data
                </button>
                <button
                  onClick={() => setActiveTab("blockchain")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "blockchain"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Blockchain Data
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "database" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Voting Results</h2>
                  <VotingResults campaignId={selectedCampaign.id} />
                </div>
              )}

              {activeTab === "blockchain" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Blockchain Verification</h2>
                  <BlockchainVerification campaignId={selectedCampaign.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Approved Campaigns</h1>
        <p className="text-gray-600 mb-8">
          View all approved campaigns with their voting results and blockchain verification details
        </p>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Approved Campaigns</h3>
            <p className="text-gray-600">There are currently no approved campaigns to display.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
              <div key={campaign.id} onClick={() => handleCampaignClick(campaign)} className="cursor-pointer">
                <ApprovedCampaignCard campaign={campaign} />
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
