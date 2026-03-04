import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";

export default function VotingLandingPage() {
  const router = useRouter();
  const { campaign: campaignId, source } = router.query; // source can be 'email' or 'admin'
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessMethod, setAccessMethod] = useState("");

  useEffect(() => {
    if (campaignId) {
      // Determine access method based on URL parameters or referrer
      const determineAccessMethod = () => {
        if (source === "email") {
          setAccessMethod("email");
        } else if (source === "admin") {
          setAccessMethod("admin");
        } else {
          // Try to determine from referrer
          const referrer = document.referrer;
          if (referrer.includes("/admin/")) {
            setAccessMethod("admin");
          } else if (referrer.includes("gmail.com") || referrer.includes("mail.google.com")) {
            setAccessMethod("email");
          } else {
            setAccessMethod("direct"); // Direct access
          }
        }
      };

      determineAccessMethod();
      fetchCampaignData();
    }
  }, [campaignId, source]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_NATUREWIRED_API;

      // Fetch campaign details
      const campaignResponse = await fetch(`${apiBase}/campaign/${campaignId}`);
      if (!campaignResponse.ok) throw new Error("Campaign not found");
      const campaignData = await campaignResponse.json();

      // Fetch campaign statuses to map the status ID to status name
      const statusResponse = await fetch(`${apiBase}/campaign-status`);
      let campaignStatus = null;

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const statusMap = {};
        if (statusData.data && Array.isArray(statusData.data)) {
          statusData.data.forEach(status => {
            statusMap[status.id] = status;
          });
        }

        // Map the campaign status ID to the status object
        if (campaignData.data && campaignData.data.campaignStatusId) {
          campaignStatus = statusMap[campaignData.data.campaignStatusId];
        }
      }

      // Merge the campaign status into the campaign data
      const enrichedCampaignData = {
        ...campaignData.data,
        campaignStatus: campaignStatus,
      };

      setCampaign(enrichedCampaignData);
    } catch (err) {
      setError("Failed to load campaign information");
      console.error("Error fetching campaign data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartVoting = () => {
    // Check if campaign is active before allowing voting
    if (campaign?.campaignStatus?.name !== "Active") {
      alert(
        `Voting is only allowed for active campaigns. This campaign is currently ${
          campaign?.campaignStatus?.name || "inactive"
        }.`
      );
      return;
    }
    router.push(`/vote/campaign/voting?campaign=${campaignId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</h1>
            <p className="text-gray-600 mb-6">{error || "This campaign does not exist or has been removed."}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Home
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
                {accessMethod && (
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      accessMethod === "email"
                        ? "bg-blue-100 text-blue-800"
                        : accessMethod === "admin"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {accessMethod === "email"
                      ? "📧 Email Access"
                      : accessMethod === "admin"
                      ? "⚙️ Admin Access"
                      : "🔗 Direct Access"}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500">Campaign ID: {campaignId}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{campaign.name}</h1>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Start: {new Date(campaign.startDate).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>End: {new Date(campaign.endDate).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>{campaign.CampaignProject?.length || 0} Projects</span>
              </div>
              <div className="flex items-center space-x-2">
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.campaignStatus?.name === "Active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {campaign.campaignStatus?.name || "Unknown"}
                </div>
              </div>
            </div>
          </div>

          {campaign.branding && (
            <div className="text-center mb-6">
              <Image
                src={campaign.branding}
                alt="Campaign Branding"
                width={200}
                height={80}
                className="mx-auto h-20 w-auto"
              />
            </div>
          )}

          <div className="text-center">
            <p className="text-lg text-gray-700 mb-6 max-w-3xl mx-auto">
              {campaign.campaignStatus?.name === "Active"
                ? "Welcome to the voting campaign! You'll be able to vote for projects that align with our goals and values."
                : `This campaign is currently ${
                    campaign.campaignStatus?.name || "inactive"
                  }. Voting is only allowed for active campaigns.`}
            </p>

            <button
              onClick={handleStartVoting}
              disabled={campaign.campaignStatus?.name !== "Active"}
              className={`inline-flex items-center px-8 py-4 text-lg font-semibold rounded-lg transition-colors shadow-lg ${
                campaign.campaignStatus?.name === "Active"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
              }`}
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {campaign.campaignStatus?.name === "Active" ? "Start Voting" : "Voting Not Available"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
