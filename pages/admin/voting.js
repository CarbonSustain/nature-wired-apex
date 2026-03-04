import { useState, useEffect } from "react";
import SidebarLayout from "../../components/SidebarLayout";
import Image from "next/image";
import Link from "next/link";

export default function VotingManagement() {
  const [campaigns, setCampaigns] = useState([]);
  const [campaignProjects, setCampaignProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalVotes: 0,
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_NATUREWIRED_API;

      // Fetch all campaigns, campaign statuses, and departments
      const [campaignResponse, statusResponse, departmentResponse] = await Promise.all([
        fetch(`${apiBase}/campaign`),
        fetch(`${apiBase}/campaign-status`),
        fetch(`${apiBase}/department`),
      ]);

      if (campaignResponse.ok && statusResponse.ok && departmentResponse.ok) {
        const campaignData = await campaignResponse.json();
        const statusData = await statusResponse.json();
        const departmentData = await departmentResponse.json();

        const campaignsData = campaignData.data || [];
        const statusesData = statusData.data || [];
        const departmentsData = departmentData.data || [];

        setCampaigns(campaignsData);
        setDepartments(departmentsData);

        // Find the "Active" status ID
        const activeStatus = statusesData.find(status => status.name && status.name.toLowerCase() === "active");
        const activeStatusId = activeStatus ? activeStatus.id : null;

        // Filter to only active campaigns
        const activeCampaigns = activeStatusId
          ? campaignsData.filter(campaign => campaign.campaignStatusId === activeStatusId)
          : [];

        setCampaigns(activeCampaigns); // Only show active campaigns

        // Fetch project details for each campaign
        await fetchCampaignProjects(activeCampaigns);

        setStats({
          totalCampaigns: campaignsData.length,
          activeCampaigns: activeCampaigns.length,
          totalVotes: campaignsData.reduce((sum, campaign) => sum + (campaign.totalVotes || 0), 0),
        });
      }
    } catch (err) {
      setError("Failed to load campaigns");
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCampaignStatus = campaign => {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);

    if (now < startDate) {
      return { status: "upcoming", color: "bg-yellow-100 text-yellow-800", text: "Upcoming" };
    } else if (now >= startDate && now <= endDate) {
      return { status: "active", color: "bg-green-100 text-green-800", text: "Active" };
    } else {
      return { status: "ended", color: "bg-gray-100 text-gray-800", text: "Ended" };
    }
  };

  const getVotingLink = campaignId => {
    return `${window.location.origin}/vote/campaign?campaign=${campaignId}&source=admin`;
  };

  const getDepartmentNames = departmentIds => {
    if (!departmentIds || !Array.isArray(departmentIds)) return "N/A";
    return departmentIds
      .map(id => {
        const dept = departments.find(d => d.id === id);
        return dept ? dept.name : `Department ${id}`;
      })
      .join(", ");
  };

  const getCampaignDepartmentNames = campaignDepartments => {
    if (!campaignDepartments || !Array.isArray(campaignDepartments)) return "N/A";
    return campaignDepartments.map(cd => cd.department?.name || `Department ${cd.departmentId}`).join(", ");
  };

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    alert("Voting link copied to clipboard!");
  };

  const fetchCampaignProjects = async campaigns => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_NATUREWIRED_API;
      const projectsMap = {};

      console.log("Fetching projects for campaigns:", campaigns);

      for (const campaign of campaigns) {
        console.log(`Campaign ${campaign.id} (${campaign.name}):`, {
          campaignProject: campaign.CampaignProject,
          hasCampaignProjects: campaign.CampaignProject && campaign.CampaignProject.length > 0,
        });

        if (campaign.CampaignProject && campaign.CampaignProject.length > 0) {
          const projectPromises = campaign.CampaignProject.map(async campaignProject => {
            try {
              const response = await fetch(`${apiBase}/project/${campaignProject.projectId}`);
              if (response.ok) {
                const projectData = await response.json();
                return projectData.data;
              }
            } catch (err) {
              console.error(`Error fetching project ${campaignProject.projectId}:`, err);
            }
            return null;
          });

          const projects = await Promise.all(projectPromises);
          const validProjects = projects.filter(project => project !== null);
          projectsMap[campaign.id] = validProjects;
          console.log(`Campaign ${campaign.id} projects:`, validProjects);
        } else {
          projectsMap[campaign.id] = [];
          console.log(`Campaign ${campaign.id} has no projects`);
        }
      }

      console.log("Final projects map:", projectsMap);
      setCampaignProjects(projectsMap);
    } catch (err) {
      console.error("Error fetching campaign projects:", err);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading voting campaigns...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voting Management</h1>
          <p className="text-gray-600">Manage and monitor voting campaigns for employees</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVotes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Voting Campaigns</h2>
            <p className="text-gray-600 mt-1">Manage and access voting campaigns</p>
          </div>

          {error ? (
            <div className="p-6 text-center">
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
              <p className="text-red-600">{error}</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-6">Create your first voting campaign to get started.</p>
              <Link
                href="/admin/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Campaign
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {campaigns.map(campaign => {
                const status = getCampaignStatus(campaign);
                const votingLink = getVotingLink(campaign.id);
                const isExpanded = expandedCampaign === campaign.id;

                return (
                  <div key={campaign.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.text}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Start Date:</span>
                            <span className="ml-2">{new Date(campaign.startDate).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="font-medium">End Date:</span>
                            <span className="ml-2">{new Date(campaign.endDate).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm mb-4">
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-4 h-4 text-gray-400"
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
                            <span>{campaign.CampaignProject?.length || 0} Projects</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>{campaign.totalVotes || 0} Votes</span>
                          </div>
                        </div>

                        {/* Expanded campaign details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                            {/* Basic Campaign Information */}
                            <div>
                              <span className="font-semibold">Campaign ID:</span> {campaign.id}
                            </div>
                            <div>
                              <span className="font-semibold">Status ID:</span> {campaign.campaignStatusId}
                            </div>
                            <div>
                              <span className="font-semibold">Name:</span> {campaign.name}
                            </div>
                            <div>
                              <span className="font-semibold">Voting Style:</span> {campaign.votingStyle || "N/A"}
                            </div>

                            {/* Date Information */}
                            <div>
                              <span className="font-semibold">Start Date:</span>{" "}
                              {new Date(campaign.startDate).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-semibold">End Date:</span>{" "}
                              {new Date(campaign.endDate).toLocaleString()}
                            </div>
                            <div>
                              <span className="font-semibold">Created At:</span>{" "}
                              {new Date(campaign.createdAt).toLocaleString()}
                            </div>
                            {campaign.updatedAt && (
                              <div>
                                <span className="font-semibold">Updated At:</span>{" "}
                                {new Date(campaign.updatedAt).toLocaleString()}
                              </div>
                            )}

                            {/* Email Information */}
                            <div>
                              <span className="font-semibold">Email Subject:</span> {campaign.emailSubject || "N/A"}
                            </div>
                            <div className="sm:col-span-2">
                              <span className="font-semibold">Email Body:</span>{" "}
                              {campaign.emailBody || "No email body available"}
                            </div>

                            {/* Department Information */}
                            <div>
                              <span className="font-semibold">Departments:</span>{" "}
                              {campaign.CampaignDepartment
                                ? getCampaignDepartmentNames(campaign.CampaignDepartment)
                                : getDepartmentNames(campaign.departmentIds)}
                            </div>

                            {/* Projects Information */}
                            <div className="sm:col-span-2">
                              <span className="font-semibold">Projects:</span>
                              {campaignProjects[campaign.id] && campaignProjects[campaign.id].length > 0 ? (
                                <div className="mt-1 space-y-1">
                                  {campaignProjects[campaign.id].map((project, index) => (
                                    <div key={index} className="ml-4 text-sm">
                                      • {project.name}
                                      {project.description && (
                                        <span className="text-gray-500 ml-2">
                                          ({project.description.substring(0, 50) + "..."})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : campaign.CampaignProject && campaign.CampaignProject.length > 0 ? (
                                <div className="mt-1 space-y-1">
                                  {campaign.CampaignProject.map((campaignProject, index) => (
                                    <div key={index} className="ml-4 text-sm">
                                      • Project ID: {campaignProject.projectId}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500 ml-2">No projects assigned</span>
                              )}
                            </div>

                            {/* Additional Fields */}
                            {campaign.branding && (
                              <div>
                                <span className="font-semibold">Branding:</span> {campaign.branding}
                              </div>
                            )}
                            {campaign.file && (
                              <div>
                                <span className="font-semibold">File:</span> {campaign.file}
                              </div>
                            )}

                            {/* Campaign Status Information */}
                            {campaign.campaignStatus && (
                              <div className="sm:col-span-2">
                                <span className="font-semibold">Campaign Status:</span> {campaign.campaignStatus.name}
                              </div>
                            )}

                            {/* Campaign Projects Section */}
                            <div className="sm:col-span-2">
                              <span className="font-semibold">Campaign Projects:</span>
                              {campaign.CampaignProject && campaign.CampaignProject.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                  {campaignProjects[campaign.id]
                                    ? campaignProjects[campaign.id].map((project, index) => (
                                        <div
                                          key={project.id}
                                          className="flex items-center space-x-3 text-sm bg-gray-50 p-2 rounded"
                                        >
                                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-xs">
                                            {index + 1}
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-medium text-gray-900">{project.name}</div>
                                            <div className="text-xs text-gray-500">{project.organization}</div>
                                          </div>
                                        </div>
                                      ))
                                    : campaign.CampaignProject.map((campaignProject, index) => (
                                        <div
                                          key={campaignProject.id}
                                          className="flex items-center space-x-2 text-sm bg-gray-50 p-2 rounded"
                                        >
                                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-xs">
                                            {index + 1}
                                          </div>
                                          <span className="text-gray-600">Project ID: {campaignProject.projectId}</span>
                                        </div>
                                      ))}
                                </div>
                              ) : (
                                <div className="mt-2 text-sm text-gray-500">No projects assigned to this campaign.</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-6">
                        <button
                          onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                          className="px-3 py-1 rounded text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition"
                        >
                          {isExpanded ? "Hide Detail" : "View Detail"}
                        </button>

                        <Link
                          href={votingLink}
                          target="_blank"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          View Voting Page
                        </Link>

                        <button
                          onClick={() => copyToClipboard(votingLink)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copy Link
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
