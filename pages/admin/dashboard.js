import { useEffect, useState } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import { formatDate } from "@/utils/dateUtils";

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignStatuses, setCampaignStatuses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("🔍 API_BASE:", API_BASE); // Debug log

        if (!API_BASE) {
          console.error("❌ API_BASE is undefined!");
          setError("API configuration is missing");
          setLoading(false);
          return;
        }

        console.log("🔍 Testing API endpoints...");

        // Test each endpoint individually with better error handling
        const testEndpoint = async (url, name) => {
          try {
            console.log(`🔍 Testing ${name}:`, url);
            const response = await fetch(url);
            console.log(`✅ ${name} response status:`, response.status);

            if (!response.ok) {
              throw new Error(`${name} failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ${name} data:`, data);
            return data;
          } catch (error) {
            console.error(`❌ ${name} error:`, error);
            throw error;
          }
        };

        // Test endpoints individually
        const campaignRes = await testEndpoint(`${API_BASE}/campaign`, "Campaign API");
        const projectRes = await testEndpoint(`${API_BASE}/project`, "Project API");
        const statusRes = await testEndpoint(`${API_BASE}/campaign-status`, "Status API");

        console.log("✅ All APIs successful:");
        console.log("campaignRes:", campaignRes);
        console.log("projectRes:", projectRes);
        console.log("statusRes:", statusRes);

        setCampaigns(Array.isArray(campaignRes.data) ? campaignRes.data : []);
        setProjects(Array.isArray(projectRes.data) ? projectRes.data : []);
        setCampaignStatuses(Array.isArray(statusRes.data) ? statusRes.data : []);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        console.error("❌ API_BASE was:", API_BASE);
        console.error("❌ Full error details:", error.message);
        console.error("❌ Error stack:", error.stack);

        // Set user-friendly error message
        if (error.message.includes("502") || error.message.includes("Bad Gateway")) {
          setError("Backend server is currently unavailable. Please try again later.");
        } else if (error.message.includes("Failed to fetch")) {
          setError("Unable to connect to the server. Please check your internet connection.");
        } else {
          setError(`Failed to load dashboard data: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE]);

  const getStatusCount = (items, status) => items.filter(item => item.status === status).length;
  const getCampaignStatusCount = (campaigns, statusId) =>
    campaigns.filter(campaign => campaign.campaignStatusId === statusId).length;

  // Get status color based on status name
  const getStatusColor = statusName => {
    switch (statusName.toLowerCase()) {
      case "active":
        return "#6CC24A";
      case "pending":
        return "#FFD600";
      case "approved":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      case "cancelled":
        return "#9E9E9E";
      default:
        return "#B0B0B0";
    }
  };

  const mostRecentCampaign = [...campaigns].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const mostVotedCampaign = [...campaigns].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];

  return (
    <SidebarLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {error && (
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
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {campaignStatuses.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">No Data Available</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>No campaigns or data found. This could be because:</p>
                      <ul className="list-disc list-inside mt-1">
                        <li>The backend server is starting up</li>
                        <li>No campaigns have been created yet</li>
                        <li>There might be a temporary connection issue</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {campaignStatuses.map(status => (
                    <StatCard
                      key={status.id}
                      label={`${status.name} Campaigns`}
                      count={getCampaignStatusCount(campaigns, status.id)}
                      color={getStatusColor(status.name)}
                    />
                  ))}
                </div>

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  <InfoCard
                    title="Most Recent Campaign"
                    data={
                      mostRecentCampaign ? (
                        <div>
                          <div className="font-semibold">{mostRecentCampaign.name}</div>
                          <div className="text-sm text-gray-600">
                            Status:{" "}
                            {campaignStatuses.find(s => s.id === mostRecentCampaign.campaignStatusId)?.name ||
                              "Unknown"}
                          </div>
                          <div className="text-sm text-gray-600">
                            Created: {formatDate(mostRecentCampaign.createdAt)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No campaigns found.</div>
                      )
                    }
                  />

                  <InfoCard
                    title="Most Voted Campaign"
                    data={
                      mostVotedCampaign ? (
                        <div>
                          <div className="font-semibold">{mostVotedCampaign.name}</div>
                          <div className="text-sm text-gray-600">
                            Votes:{" "}
                            {typeof mostVotedCampaign.votes === "number"
                              ? mostVotedCampaign.votes
                              : typeof mostVotedCampaign.votes === "object"
                              ? Object.keys(mostVotedCampaign.votes || {}).length
                              : 0}
                          </div>
                          <div className="text-sm text-gray-600">
                            Status:{" "}
                            {campaignStatuses.find(s => s.id === mostVotedCampaign.campaignStatusId)?.name || "Unknown"}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No vote data available.</div>
                      )
                    }
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

function StatCard({ label, count, color }) {
  return (
    <div className="bg-white rounded shadow p-6 border-t-4" style={{ borderTopColor: color }}>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-3xl font-bold">{count}</div>
    </div>
  );
}

function InfoCard({ title, data }) {
  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      {data}
    </div>
  );
}
