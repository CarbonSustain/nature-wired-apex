import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { getCurrentSessionData, authenticatedApiCall } from "@/utils/backendAuth";
import { getGoogleUser } from "@/utils/googleAuth";
import { getUserByEmail } from "@/utils/api";
export default function VotingInterface() {
  const router = useRouter();
  const { campaign: campaignId } = router.query;
  const { data: session, status } = useSession();
  const [campaign, setCampaign] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [reason, setReason] = useState("");
  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (campaignId) {
      fetchData();
    }
  }, [campaignId, session, status, router]);

  const fetchData = async () => {
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

      // Check if campaign is active
      if (enrichedCampaignData.campaignStatus?.name !== "Active") {
        setError(
          `Voting is only allowed for active campaigns. This campaign is currently ${
            enrichedCampaignData.campaignStatus?.name || "inactive"
          }.`
        );
        setCampaign(enrichedCampaignData);
        return;
      }

      setCampaign(enrichedCampaignData);

      // Get the selected project IDs from the campaign's CampaignProject array
      const selectedProjectIds = enrichedCampaignData.CampaignProject?.map(cp => cp.projectId) || [];

      if (selectedProjectIds.length === 0) {
        setProjects([]);
        return;
      }

      // Fetch only the projects that are assigned to this campaign
      const projectPromises = selectedProjectIds.map(async projectId => {
        try {
          const response = await fetch(`${apiBase}/project/${projectId}`);
          if (response.ok) {
            const projectData = await response.json();
            return projectData.data;
          }
        } catch (err) {
          console.error(`Error fetching project ${projectId}:`, err);
        }
        return null;
      });

      const projectResults = await Promise.all(projectPromises);
      const validProjects = projectResults.filter(project => project !== null);
      setProjects(validProjects);
    } catch (err) {
      setError("Failed to load voting information");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelection = projectId => {
    setSelectedProject(projectId);
  };

  async function submitVote(votePayload) {
    try {
      const res = await fetch(`${API_BASE}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // add Authorization if you still need it:
          // "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(votePayload),
      });

      const ct = res.headers.get("content-type") || "";
      const text = await res.text();
      const json = ct.includes("application/json") ? JSON.parse(text) : null;

      if (!res.ok) {
        throw new Error(json?.message || `HTTP ${res.status} ${res.statusText} | ${text.slice(0, 120)}…`);
      }

      return json; // voteResult
    } catch (err) {
      console.error("Vote failed:", err);
      return null; // mimic your old behavior of stopping on failure
    }
  }

  const handleSubmitVote = async () => {
    if (!selectedProject) {
      alert("Please select a project to vote for.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const gUser = getGoogleUser();
      console.log(gUser);

      const user = await getUserByEmail(gUser.email);
      console.log(user);

      const votePayload = {
        userId: user.data.id,
        campaignId: Number(campaignId),
        projectId: Number(selectedProject),
        reason: reason.trim() || undefined,
      };

      console.log("🗳️ Submitting vote:", votePayload);

      const voteResult = await submitVote(votePayload);
      if (!voteResult) return; // stop on failure
      console.log("✅ Vote submitted successfully:", voteResult);

      // Store data for confirmation page
      const votingData = {
        campaignId,
        selectedProject,
        reason,
        voteId: voteResult.data?.id ?? voteResult.id, // support either shape
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("votingData", JSON.stringify(votingData));
      await router.push(`/vote/campaign/confirmation?campaign=${campaignId}`);
    } catch (err) {
      console.error("❌ Error submitting vote:", err);
      const msg = err?.message || (typeof err === "string" ? err : "Failed to submit vote. Please try again.");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading voting interface...</p>
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
              <div className="text-sm text-gray-500">Employee Voting Portal</div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/vote/campaign?campaign=${campaignId}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ← Back to Campaign
              </Link>
              <div className="text-sm text-gray-500">Campaign ID: {campaignId}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Campaign Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vote for a Project</h1>
            <p className="text-lg text-gray-600">{campaign.name}</p>
          </div>

          {/* Voting Instructions */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Simple Voting</h3>
            <p className="text-blue-800">
              Select one project that you want to vote for. You can only choose one project.
            </p>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Available Projects</h2>

          <div className="space-y-4">
            {projects.map(project => (
              <div
                key={project.uniqueId ?? project.id}
                onClick={() => handleProjectSelection(project.id)}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                  selectedProject === project.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      selectedProject === project.id ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    }`}
                  >
                    {selectedProject === project.id && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{project.projectName ?? "Untitled Project"}</h3>

                    {/* No 'organization' field in your model; show something meaningful instead */}
                    <p className="text-sm text-gray-600 mb-2">
                      {project.primarySector || project.secondarySector || project.projectTypes || "—"}
                    </p>

                    {/* You don’t have a 'description' field; derive something sensible */}
                    <p className="text-gray-700 text-sm">
                      {project.projectMethodology ||
                        project.verificationMethod ||
                        (Array.isArray(project.standards) ? project.standards.join(", ") : "") ||
                        (typeof project.impactAndRiskAssessments === "object" &&
                          project.impactAndRiskAssessments?.summary) ||
                        "No description available."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {projects.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p className="text-gray-500">No projects available for voting.</p>
            </div>
          )}
        </div>

        {/* Reason Input */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why are you voting for this project?</h2>
          <div className="max-w-2xl mx-auto">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Share your thoughts (Optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Share your thoughts on why this project should be funded..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-2 text-right">{reason.length}/500 characters</p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          )}

          <button
            onClick={handleSubmitVote}
            disabled={!selectedProject || submitting || error}
            className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {submitting ? "Submitting..." : "Submit Vote"}
          </button>

          {error && (
            <p className="mt-4 text-sm text-gray-600">
              Please contact an administrator if you believe this is an error.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
