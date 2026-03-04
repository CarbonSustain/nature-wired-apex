// pages/admin/launch-success.js

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import SidebarLayout from "@/components/SidebarLayout";

export default function LaunchSuccess() {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);

  // Pull draft for fallbacks (branding file, etc.)
  const [draft, setDraft] = useState(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("campaignDraft");
      setDraft(raw ? JSON.parse(raw) : null);
    } catch {
      setDraft(null);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [campRes, deptRes, projRes] = await Promise.all([
          fetch(`${API_BASE}/campaign/${id}`).then(r => r.json()),
          fetch(`${API_BASE}/department`).then(r => r.json()),
          fetch(`${API_BASE}/project`).then(r => r.json()),
        ]);

        if (!mounted) return;

        const campaignData = campRes?.data ?? campRes ?? null;
        const deptList = Array.isArray(deptRes?.data) ? deptRes.data : Array.isArray(deptRes) ? deptRes : [];
        const projList = Array.isArray(projRes?.data) ? projRes.data : Array.isArray(projRes) ? projRes : [];

        setCampaign(campaignData);
        setDepartments(deptList);
        setProjects(projList);
      } catch (e) {
        console.error("Success page load error:", e);
        if (mounted) setError("Failed to load campaign.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [API_BASE, id]);

  const deptName = deptId => departments.find(d => d.id === deptId)?.name || `Department ${deptId}`;

  // Resolve selected project objects from CampaignProject list or from known projects
  const selectedProjectObjects = useMemo(() => {
    if (!campaign) return [];
    const campaignProjects = Array.isArray(campaign.CampaignProject) ? campaign.CampaignProject : [];
    if (!campaignProjects.length) return [];

    const map = new Map(projects.map(p => [p.id, p]));
    return campaignProjects.map(cp => {
      const p = map.get(cp.projectId);
      if (!p) {
        return {
          id: cp.projectId,
          uniqueId: `Project ${cp.projectId}`,
          name: `Project ${cp.projectId}`,
        };
      }
      return {
        ...p,
        name: p.projectName || p.name || p.uniqueId || `Project ${p.id}`,
      };
    });
  }, [campaign, projects]);

  const title = "Campaign Launched Successfully";
  const shareUrl = makeShareUrl(campaign, router);

  // Determine branding image to show:
  const brandingSrc =
    // prefer backend-hosted URL
    (campaign?.url && String(campaign.url)) ||
    // fallback to what user uploaded on step 1
    (draft?.brandingPreviewDataUrl && String(draft.brandingPreviewDataUrl)) ||
    // final fallback to CarbonSustain logo
    CARBON_SUSTAIN_LOGO_DATA_URL;

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto p-8 text-black">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-base mb-6">
          Thank you for launching a campaign to support nature-based projects. Here are your campaign details.
        </p>

        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>
        ) : !campaign ? (
          <div className="text-gray-700">Campaign not found.</div>
        ) : (
          <>
            {/* Branding + Share */}
            <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold mb-1">Branding File</div>
                  <div className="text-sm">
                    {draft?.brandingFileName
                      ? draft.brandingFileName
                      : campaign.url
                      ? fileNameFromUrl(campaign.url)
                      : "—"}
                  </div>
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={brandingSrc} alt="Branding" className="max-h-28 rounded border" />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 ml-auto">
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="px-3 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm"
                  >
                    Copy Share Link
                  </button>
                  <a
                    href={shareUrl}
                    className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Campaign
                  </a>
                </div>
              </div>
            </section>

            {/* Campaign Details */}
            <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <Row k="Name" v={campaign.name || draft?.name || "—"} />
                <Row k="Voting Style" v={prettyVotingStyle(campaign.votingStyle || draft?.votingStyle)} />
                <Row k="Email Subject" v={campaign.emailSubject || draft?.emailSubject || "—"} />
                <div className="md:col-span-2">
                  <span className="font-semibold">Email Body:</span>{" "}
                  <span className="whitespace-pre-wrap break-words">
                    {safe(campaign.emailBody || draft?.emailBody, "—")}
                  </span>
                </div>
                <Row k="Start Date" v={formatDate(campaign.startDate) || draft?.startDateISO || "—"} />
                <Row k="End Date" v={formatDate(campaign.endDate) || draft?.endDateISO || "—"} />
                <div className="md:col-span-2">
                  <span className="font-semibold">Departments:</span>{" "}
                  {campaign.CampaignDepartment?.length ? (
                    <ul className="mt-1 ml-4 list-disc">
                      {campaign.CampaignDepartment.map(cd => (
                        <li key={`${cd.campaignId}-${cd.departmentId}`}>
                          {cd.department?.name || deptName(cd.departmentId)}{" "}
                          <span className="text-gray-600">(ID: {cd.departmentId})</span>
                        </li>
                      ))}
                    </ul>
                  ) : Array.isArray(draft?.departmentIds) && draft.departmentIds.length ? (
                    <ul className="mt-1 ml-4 list-disc">
                      {draft.departmentIds.map(id => (
                        <li key={id}>
                          {deptName(Number(id))} <span className="text-gray-600">(ID: {id})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </section>

            {/* Selected Projects */}
            <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold mb-3">Selected Projects</h2>
              {selectedProjectObjects.length ? (
                <div className="space-y-3">
                  {selectedProjectObjects.map(p => (
                    <div key={p.id} className="border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-gray-700">ID: {p.id}</div>
                      </div>

                      {/* small chips summary */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {normalizeList(p.region ?? p.regions ?? p.location).map((l, i) => (
                          <Chip key={`r-${p.id}-${i}`} label={l} cls="border-gray-500 text-gray-800" />
                        ))}
                        {normalizeList(p.project_type ?? p.projectTypes ?? p.project_types ?? p.type ?? p.types).map(
                          (l, i) => (
                            <Chip key={`t-${p.id}-${i}`} label={l} cls="border-purple-500 text-purple-800" />
                          )
                        )}
                        {normalizeList(p.verification ?? p.verifications ?? p.standards ?? p.standard).map((l, i) => (
                          <Chip key={`v-${p.id}-${i}`} label={l} cls="border-emerald-500 text-emerald-800" />
                        ))}
                        {normalizeList(p.health_social_equity ?? p.healthEquity ?? p.health_social).map((l, i) => (
                          <Chip key={`e-${p.id}-${i}`} label={l} cls="border-rose-500 text-rose-800" />
                        ))}
                        {normalizeSdgsForDisplay(p.sdgs).map((l, i) => (
                          <Chip key={`s-${p.id}-${i}`} label={l} cls="border-blue-500 text-blue-700" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-700">No projects were attached.</div>
              )}
            </section>

            <div className="text-base">Share your campaign and invite others to vote</div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

/* ---------------- helpers ---------------- */

function Row({ k, v }) {
  return (
    <div>
      <span className="font-semibold">{k}:</span> <span className="break-words">{safe(v, "—")}</span>
    </div>
  );
}

function safe(v, fallback = "—") {
  if (v === null || v === undefined) return fallback;
  const s = typeof v === "string" ? v : String(v);
  return s.trim() ? s : fallback;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toISOString(); // keep UTC clarity; swap to locale if desired
}

function prettyVotingStyle(v) {
  const m = String(v || "").toUpperCase();
  switch (m) {
    case "TOKEN_BASED":
      return "Token-based";
    case "STORY_FEATURE":
      return "Story feature";
    case "THEMED_BADGES":
      return "Themed badges";
    default:
      return v || "—";
  }
}

function normalizeList(val) {
  if (!val) return [];
  if (Array.isArray(val))
    return val
      .map(textify)
      .map(s => String(s).trim())
      .filter(Boolean);
  return [textify(val)].filter(Boolean);
}

function normalizeSdgsForDisplay(val) {
  const items = Array.isArray(val) ? val : val ? [val] : [];
  const out = [];
  for (const item of items) {
    if (item && typeof item === "object") {
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

function Chip({ label, cls }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls || "border-gray-400 text-gray-700"}`}>
      {String(label)}
    </span>
  );
}

function fileNameFromUrl(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last || url;
  } catch {
    const parts = String(url).split("/").filter(Boolean);
    return parts.pop() || String(url);
  }
}

function copyToClipboard(text) {
  try {
    navigator.clipboard?.writeText?.(text);
  } catch {}
}

function makeShareUrl(campaign, router) {
  // If your app has a public campaign page by name, adjust here.
  // Safer is to use the id route if available.
  const origin = (typeof window !== "undefined" && window.location?.origin) || "http://localhost:3000";
  if (campaign?.id) return `${origin}/campaign/${encodeURIComponent(String(campaign.id))}`;
  if (campaign?.name) return `${origin}/campaign/${encodeURIComponent(String(campaign.name))}`;
  return origin;
}

/** Embedded CarbonSustain logo (fallback if user didn’t upload one) */
const CARBON_SUSTAIN_LOGO_DATA_URL =
  "data:image/jpeg;base64,/9j/4Q/+RXhpZgAATU0AKgAAAAgABgESAAMAAAABAAEAAAEaAAUAAAABAAAAVgEbAAUAAAABAAAAXgEoAAMAAAABAAIAAAITA..." +
  "AA"; // Replace "..." with the full data URL you pasted from me (keep as one line).
