import Link from "next/link";
import { formatDate } from "@/utils/dateUtils";

export default function ApprovedCampaignCard({ campaign }) {
  const getStatusBadgeColor = status => {
    if (!status) return "bg-green-100 text-green-800"; // Default to approved if no status

    // Convert to string and handle both string and number status
    const statusStr = String(status).toLowerCase();

    switch (statusStr) {
      case "approved":
      case "3": // campaignStatusId = 3 means approved
        return "bg-green-100 text-green-800";
      case "active":
      case "1": // campaignStatusId = 1 means active
        return "bg-blue-100 text-blue-800";
      case "completed":
      case "2": // campaignStatusId = 2 means completed
        return "bg-purple-100 text-purple-800";
      case "pending":
      case "0": // campaignStatusId = 0 means pending
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text || typeof text !== "string") return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
      {/* Campaign Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2">{campaign.name || "Untitled Campaign"}</h3>
          <p className="text-sm text-gray-500 mt-1">ID: {campaign.id}</p>
        </div>
        <p className="text-gray-600 text-sm line-clamp-3">{truncateText(campaign.description)}</p>
      </div>

      {/* Campaign Details */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Date Range */}
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {formatDate(campaign.startDate || new Date())} - {formatDate(campaign.endDate || new Date())}
            </span>
          </div>

          {/* Hedera Hash */}
          {campaign.hederaInfo && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Blockchain Verification
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-medium text-gray-700">Hash:</span>
                  <div className="font-mono text-gray-600 break-all mt-1">{campaign.hederaInfo.hash}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Transaction ID:</span>
                  <div className="font-mono text-gray-600 break-all mt-1">{campaign.hederaInfo.transactionId}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      campaign.hederaInfo.status === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {campaign.hederaInfo.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Click to View Details */}
          <div className="text-center">
            <p className="text-sm text-gray-500">Click to view details</p>
          </div>
        </div>
      </div>
    </div>
  );
}
