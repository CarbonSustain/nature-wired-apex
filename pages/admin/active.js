// pages/admin/active.js
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import SidebarLayout from "@/components/SidebarLayout";
import { handleGetallCampaign } from "../../utils/campaignApi";
import { formatDate } from "@/utils/dateUtils";

export default function ActiveCampaigns() {
  const router = useRouter();
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [campaignStatuses, setCampaignStatuses] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(null); // first status id
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const campaignRefs = useRef({});
  const [departments, setDepartments] = useState([]);
  const [campaignProjects, setCampaignProjects] = useState({}); // { [campaignId]: Project[] }

  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignRes, statusRes, departmentRes] = await Promise.all([
          handleGetallCampaign(),
          fetch(`${API_BASE}/campaign-status`).then(res => res.json()),
          fetch(`${API_BASE}/department`).then(res => res.json()),
        ]);

        // Sort by soonest endDate (nulls last)
        const sorted = (campaignRes.data || []).slice().sort((a, b) => {
          if (!a.endDate) return 1;
          if (!b.endDate) return -1;
          return new Date(a.endDate) - new Date(b.endDate);
        });

        setAllCampaigns(sorted);
        setCampaignStatuses(statusRes.data || []);
        setDepartments(departmentRes.data || []);

        if (statusRes.data && statusRes.data.length > 0 && statusRes.data[0]?.id) {
          setActiveTab(statusRes.data[0].id);
        }

        await fetchCampaignProjects(sorted);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [API_BASE]);

  const fetchCampaignProjects = async campaigns => {
    try {
      const projectsMap = {};

      // Fetch all projects once
      const allProjectsResponse = await fetch(`${API_BASE}/project`);
      if (!allProjectsResponse.ok) {
        console.error("Failed to fetch all projects:", allProjectsResponse.status);
        return;
      }
      const allProjectsData = await allProjectsResponse.json();
      const allProjects = allProjectsData.data || allProjectsData || [];

      const byId = new Map(allProjects.map(p => [p.id, p]));

      // Map to campaign
      for (const campaign of campaigns) {
        if (Array.isArray(campaign.CampaignProject) && campaign.CampaignProject.length > 0) {
          const full = campaign.CampaignProject.map(cp => {
            const proj = byId.get(cp.projectId);
            if (proj) {
              return withDisplayFields(proj);
            }
            // Fallback stub if not found
            return { id: cp.projectId, name: `Project ${cp.projectId}`, description: "", _raw: {} };
          });
          projectsMap[campaign.id] = full;
        } else {
          projectsMap[campaign.id] = [];
        }
      }

      setCampaignProjects(projectsMap);
    } catch (err) {
      console.error("Error fetching campaign projects:", err);
    }
  };

  // Auto-scroll to first match as user types
  useEffect(() => {
    if (!allCampaigns || !search.trim()) return;
    const keyword = search.trim().toLowerCase();
    const found = allCampaigns.find(
      c =>
        c.name?.toLowerCase().includes(keyword) ||
        (c.description && String(c.description).toLowerCase().includes(keyword))
    );
    if (found && campaignRefs.current[found.id]) {
      campaignRefs.current[found.id].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [search, allCampaigns]);

  // --- helpers ---

  const safeRender = (value, fallback = "N/A") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string" || typeof value === "number") return value;
    if (typeof value === "object") {
      // Show a compact, readable version instead of [object Object]
      try {
        return JSON.stringify(value);
      } catch {
        return fallback;
      }
    }
    return String(value);
  };

  function highlight(text, keyword) {
    if (!keyword) return safeRender(text);
    const safeText = String(safeRender(text, "") || "");
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return safeText.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  const getDepartmentNames = departmentIds => {
    if (!Array.isArray(departmentIds) || departmentIds.length === 0) return "N/A";
    return departmentIds.map(id => departments.find(d => d.id === id)?.name || `Department ${id}`).join(", ");
  };

  const getCampaignDepartmentNames = campaignDepartments => {
    if (!Array.isArray(campaignDepartments) || campaignDepartments.length === 0) return "N/A";
    return campaignDepartments.map(cd => cd.department?.name || `Department ${cd.departmentId}`).join(", ");
  };

  const getStatusInfo = statusId => {
    const status = campaignStatuses.find(s => s.id === statusId);
    if (!status) return { label: "Unknown", color: "bg-gray-100 text-gray-800" };

    switch ((status.name || "").toLowerCase()) {
      case "active":
        return { label: status.name, color: "bg-green-100 text-green-800" };
      case "pending":
        return { label: status.name, color: "bg-yellow-100 text-yellow-800" };
      case "approved":
        return { label: status.name, color: "bg-blue-100 text-blue-800" };
      case "rejected":
        return { label: status.name, color: "bg-red-100 text-red-800" };
      case "created":
        return { label: status.name, color: "bg-gray-100 text-gray-800" };
      case "cancelled":
        return { label: status.name, color: "bg-gray-100 text-gray-800" };
      default:
        return { label: status.name, color: "bg-gray-100 text-gray-800" };
    }
  };

  const getStatusColor = statusName => {
    switch ((statusName || "").toLowerCase()) {
      case "active":
        return "border-green-500 text-green-600";
      case "pending":
        return "border-yellow-500 text-yellow-600";
      case "approved":
        return "border-blue-500 text-blue-600";
      case "rejected":
        return "border-red-500 text-red-600";
      case "created":
        return "border-gray-500 text-gray-600";
      case "cancelled":
        return "border-gray-500 text-gray-600";
      default:
        return "border-gray-500 text-gray-600";
    }
  };

  const handleExportCampaign = async (campaignId, format = "CSV") => {
    try {
      const response = await fetch(`${API_BASE}/campaign-export/export/${campaignId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });
      if (!response.ok) throw new Error("Export failed");

      // filename from header if present
      let filename = `campaign_${campaignId}_report.${format.toLowerCase()}`;
      const disp = response.headers.get("content-disposition");
      if (disp && disp.includes("filename=")) {
        filename = disp.split("filename=")[1].replace(/"/g, "");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export campaign data.");
    }
  };

  const getFilteredCampaigns = () => {
    if (!allCampaigns || !activeTab) return [];
    const byStatus = allCampaigns.filter(c => c.campaignStatusId === activeTab);
    if (search.trim()) {
      const kw = search.trim().toLowerCase();
      return byStatus.filter(
        c =>
          (c.name && c.name.toLowerCase().includes(kw)) ||
          (c.description && String(c.description).toLowerCase().includes(kw))
      );
    }
    return byStatus;
  };

  const filteredCampaigns = getFilteredCampaigns();
  const activeStatus = campaignStatuses.find(s => s.id === activeTab);

  return (
    <SidebarLayout>
      <div className="p-8 text-black">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <button onClick={() => router.back()} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            Back
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex border-b mb-6 overflow-x-auto">
          {campaignStatuses.map(status => (
            <button
              key={status.id}
              onClick={() => setActiveTab(status.id)}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeTab === status.id
                  ? `border-b-2 ${getStatusColor(status.name)}`
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {status.name}
            </button>
          ))}
        </div>

        <form
          className="mb-6 flex gap-2"
          onSubmit={e => {
            e.preventDefault();
          }}
        >
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="border p-2 rounded w-full"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled>
            Go
          </button>
        </form>

        <div className="space-y-4">
          {allCampaigns ? (
            filteredCampaigns.length > 0 ? (
              filteredCampaigns.map(campaign => {
                const statusInfo = getStatusInfo(campaign.campaignStatusId);
                const isExpanded = expandedCampaign === campaign.id;

                return (
                  <div
                    key={campaign.id}
                    ref={el => (campaignRefs.current[campaign.id] = el)}
                    className="border p-4 rounded-lg hover:bg-gray-50 relative"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold">{highlight(campaign.name, search.trim())}</h2>
                        <p className="text-gray-700 mt-2">{highlight(campaign.description || "", search.trim())}</p>

                        <div className="mt-4 flex justify-between text-sm text-gray-700">
                          <span>
                            Total Votes:{" "}
                            {typeof campaign.votes === "number"
                              ? campaign.votes
                              : typeof campaign.votes === "object"
                              ? Object.keys(campaign.votes || {}).length
                              : 0}
                          </span>
                          <span>Ends: {formatDate(campaign.endDate)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4 min-w-[140px]">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <div className="text-sm text-gray-700 text-right">Starts: {formatDate(campaign.startDate)}</div>

                        <button
                          onClick={() => setExpandedCampaign(isExpanded ? null : campaign.id)}
                          className="px-2 py-1 rounded text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition"
                        >
                          {isExpanded ? "Hide Detail" : "View Detail"}
                        </button>

                        {/* Export buttons for approved campaigns */}
                        {activeStatus?.name?.toLowerCase() === "approved" && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <button
                              onClick={() => handleExportCampaign(campaign.id, "CSV")}
                              className="px-2 py-1 rounded text-xs bg-gray-500 text-white hover:bg-gray-600 transition"
                              title="Export as CSV"
                            >
                              CSV
                            </button>
                            <button
                              onClick={() => handleExportCampaign(campaign.id, "PDF")}
                              className="px-2 py-1 rounded text-xs bg-gray-500 text-white hover:bg-gray-600 transition"
                              title="Export as PDF"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() => handleExportCampaign(campaign.id, "PPTX")}
                              className="px-2 py-1 rounded text-xs bg-gray-500 text-white hover:bg-gray-600 transition"
                              title="Export as PowerPoint"
                            >
                              PPTX
                            </button>
                            <button
                              onClick={() => handleExportCampaign(campaign.id, "JSON")}
                              className="px-2 py-1 rounded text-xs bg-gray-500 text-white hover:bg-gray-600 transition"
                              title="Export as JSON"
                            >
                              JSON
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t text-sm grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                        <div>
                          <span className="font-semibold">Campaign ID:</span> {safeRender(campaign.id)}
                        </div>
                        <div>
                          <span className="font-semibold">Status ID:</span> {safeRender(campaign.campaignStatusId)}
                        </div>
                        <div>
                          <span className="font-semibold">Name:</span> {safeRender(campaign.name)}
                        </div>
                        <div>
                          <span className="font-semibold">Voting Style:</span> {safeRender(campaign.votingStyle)}
                        </div>

                        <div>
                          <span className="font-semibold">Start Date:</span> {formatDate(campaign.startDate)}
                        </div>
                        <div>
                          <span className="font-semibold">End Date:</span> {formatDate(campaign.endDate)}
                        </div>
                        <div>
                          <span className="font-semibold">Created At:</span> {formatDate(campaign.createdAt)}
                        </div>
                        {campaign.updatedAt && (
                          <div>
                            <span className="font-semibold">Updated At:</span> {formatDate(campaign.updatedAt)}
                          </div>
                        )}

                        <div>
                          <span className="font-semibold">Email Subject:</span> {safeRender(campaign.emailSubject)}
                        </div>
                        <div className="sm:col-span-2">
                          <span className="font-semibold">Email Body:</span>{" "}
                          <span className="whitespace-pre-wrap">
                            {safeRender(campaign.emailBody, "No email body available")}
                          </span>
                        </div>

                        <div className="sm:col-span-2">
                          <span className="font-semibold">Departments:</span>{" "}
                          {campaign.CampaignDepartment
                            ? getCampaignDepartmentNames(campaign.CampaignDepartment)
                            : getDepartmentNames(campaign.departmentIds)}
                        </div>

                        {/* Projects */}
                        <div className="sm:col-span-2">
                          <span className="font-semibold">Projects:</span>
                          {Array.isArray(campaignProjects[campaign.id]) && campaignProjects[campaign.id].length > 0 ? (
                            <div className="mt-1 space-y-2">
                              {campaignProjects[campaign.id].map((project, index) => (
                                <div key={index} className="ml-4 text-sm">
                                  <div className="font-medium">
                                    • {project.name} <span className="text-gray-600">(ID: {project.id})</span>
                                  </div>
                                  <ProjectSummary project={project} />
                                </div>
                              ))}
                            </div>
                          ) : Array.isArray(campaign.CampaignProject) && campaign.CampaignProject.length > 0 ? (
                            <div className="mt-1 space-y-1">
                              {campaign.CampaignProject.map((cp, index) => (
                                <div key={index} className="ml-4 text-sm">
                                  • Project {cp.projectId}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-700 ml-2">No projects assigned</span>
                          )}
                        </div>

                        {/* Campaign Status (name) */}
                        {campaign.campaignStatus?.name && (
                          <div className="sm:col-span-2">
                            <span className="font-semibold">Campaign Status:</span> {campaign.campaignStatus.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-gray-700">No {activeStatus?.name || "campaigns"} found.</div>
            )
          ) : (
            <div className="text-gray-700">Loading campaigns...</div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}

/* ---- project rendering helpers to avoid [object Object] ---- */

function withDisplayFields(p = {}) {
  const name = p.projectName || p.name || p.title || p.uniqueId || `Project ${p.id ?? ""}`;
  const description = buildDescription(p);
  return { ...p, name, description };
}

function buildDescription(p) {
  const bits = [p.description, p.primarySector, p.project_types, p.standards];
  const flat = bits.flat().filter(Boolean).map(textify);
  const s = flat.join(" ").trim();
  return s || "Project details available";
}

function ProjectSummary({ project }) {
  const sector = textify(project.primarySector) || "—";
  const types = normList(
    project.project_type ?? project.projectTypes ?? project.project_types ?? project.type ?? project.types
  );
  const verifs = normList(project.verification ?? project.verifications ?? project.standards ?? project.standard);
  const regions = normList(project.region ?? project.regions ?? project.location);
  const equities = normList(project.health_social_equity ?? project.healthEquity ?? project.health_social);
  const sdgNames = normalizeSdgsForDisplay(project.sdgs);

  return (
    <div className="mt-1 text-gray-800">
      <div>Sector: {sector}</div>
      <div>Project Type: {types.length ? types.join(", ") : "—"}</div>
      <div>Verification: {verifs.length ? verifs.join(", ") : "—"}</div>
      <div>Region: {regions.length ? regions.join(", ") : "—"}</div>
      <div>Health &amp; Social Equity: {equities.length ? equities.join(", ") : "—"}</div>
      <div>SDGs: {sdgNames.length ? sdgNames.join(", ") : "—"}</div>
      <div className="text-gray-700">Description: {project.description}</div>
    </div>
  );
}

function normList(val) {
  if (!val) return [];
  if (Array.isArray(val))
    return val
      .map(textify)
      .map(x => String(x).trim())
      .filter(Boolean);
  return [textify(val)].filter(Boolean);
}

function normalizeSdgsForDisplay(val) {
  const items = Array.isArray(val) ? val : val ? [val] : [];
  const out = [];
  for (const item of items) {
    if (item && typeof item === "object") {
      // handles { sdg: { id, name } } or { id, name }
      const nm = item?.sdg?.name ?? item?.name ?? item?.title;
      if (nm) out.push(String(nm));
      else out.push(textify(item));
    } else {
      out.push(String(item));
    }
  }
  return out.filter(Boolean);
}

function textify(x) {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") return String(x);
  if (Array.isArray(x)) return x.map(textify).join(", ");
  if (typeof x === "object") {
    return (
      x.name ??
      x.label ??
      x.value ??
      x.title ??
      x.text ??
      x.displayName ??
      (x.id != null ? `id:${x.id}` : JSON.stringify(x))
    );
  }
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}
