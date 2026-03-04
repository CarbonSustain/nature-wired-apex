// pages/admin/launch-voting-campaign.js

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import SidebarLayout from "@/components/SidebarLayout";
import { handleCreateCampaign, handleAddProjectsToCampaign } from "@/utils/campaignApi";

export default function LaunchVotingCampaign() {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

  const [draft, setDraft] = useState(null);
  const [selectedProjects, setSelectedProjects] = useState([]); // [{id, name}]
  const [departments, setDepartments] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState(null);

  // Hydrate from sessionStorage
  useEffect(() => {
    try {
      const rawDraft = sessionStorage.getItem("campaignDraft");
      const rawSel = sessionStorage.getItem("selectedProjects");
      setDraft(rawDraft ? JSON.parse(rawDraft) : null);
      setSelectedProjects(rawSel ? JSON.parse(rawSel) : []);
    } catch {
      setDraft(null);
      setSelectedProjects([]);
    }
  }, []);

  // Fetch departments + all projects for details rendering
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [deptRes, projRes] = await Promise.all([
          fetch(`${API_BASE}/department`).then(r => r.json()),
          fetch(`${API_BASE}/project`).then(r => r.json()),
        ]);

        if (!mounted) return;

        const deptList = Array.isArray(deptRes?.data) ? deptRes.data : Array.isArray(deptRes) ? deptRes : [];
        const projList = Array.isArray(projRes?.data) ? projRes.data : Array.isArray(projRes) ? projRes : [];

        setDepartments(deptList);
        setAllProjects(projList);
      } catch (e) {
        console.error("Confirm page load error:", e);
        if (mounted) setError("Failed to load departments/projects.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  // Map selected project IDs → full project objects for rendering
  const selectedProjectObjects = useMemo(() => {
    if (!selectedProjects?.length || !allProjects?.length) return [];
    const idSet = new Set(selectedProjects.map(p => p.id));
    return allProjects.filter(p => idSet.has(p.id)).map(p => mapProjectForDisplay(p));
  }, [selectedProjects, allProjects]);

  const departmentName = id => {
    const d = departments.find(x => x.id === id);
    return d?.name || `Department ${id}`;
  };

  const onBack = () => router.push("/admin/select-projects");

  const onConfirm = async () => {
    try {
      setLaunching(true);
      setError(null);

      if (!draft) throw new Error("Missing campaign draft.");

      // Coerce any stored date values to UTC ISO (server expects UTC)
      const startISO = coerceIsoUtc(draft.startDateISO || draft.startDate);
      const endISO = coerceIsoUtc(draft.endDateISO || draft.endDate);

      if (!startISO || !endISO) {
        throw new Error("Start and End dates are required.");
      }
      if (!(new Date(endISO) > new Date(startISO))) {
        throw new Error("End date must be after start date.");
      }

      const departmentIds = (draft.departmentIds || []).map(Number).filter(n => Number.isFinite(n));
      if (!departmentIds.length) throw new Error("At least one department must be selected.");

      // Build payload to match backend
      const payload = {
        name: draft.name,
        votingStyle: draft.votingStyle, // TOKEN_BASED | STORY_FEATURE | THEMED_BADGES
        startDate: startISO,
        endDate: endISO,
        emailSubject: draft.emailSubject || "",
        emailBody: draft.emailBody || "",
        departmentIds,
      };

      // Branding upload: use draft file if present; else fallback to CarbonSustain logo
      let brandingUpload;
      if (draft.brandingPreviewDataUrl) {
        brandingUpload = {
          dataURL: draft.brandingPreviewDataUrl,
          fileName: draft.brandingFileName || "branding.bin",
        };
      } else {
        brandingUpload = {
          dataURL: CARBON_SUSTAIN_LOGO_DATA_URL,
          fileName: "CarbonSustain.jpg",
        };
        console.warn("No branding provided; sending CarbonSustain fallback.");
      }

      // Create campaign (multipart)
      const result = await handleCreateCampaign(payload, brandingUpload);
      const campaignId = result?.data?.id ?? result?.id;
      if (!campaignId) throw new Error("Campaign created but no ID returned.");

      // Attach selected projects, if any
      const projectIds = selectedProjects.map(p => p.id).filter(id => id != null);
      if (projectIds.length > 0) {
        const attachRes = await handleAddProjectsToCampaign(campaignId, projectIds);
        if (!attachRes?.ok && attachRes?.status && attachRes?.status >= 400) {
          console.warn("Attaching projects failed:", attachRes);
          alert("Campaign created, but attaching projects failed. You can add them later.");
        }
      }

      router.push({ pathname: "/admin/launch-success", query: { id: String(campaignId) } });
    } catch (e) {
      console.error("Launch failed:", e);
      setError(e?.message || "Launch failed.");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto p-8 text-black">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Confirm Campaign Launch</h1>
          <div className="text-sm">Step 2 → Confirm</div>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : (
          <>
            {/* Campaign summary */}
            <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold mb-3">Campaign</h2>
              {draft ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <Row k="Name" v={draft.name || "—"} />
                  <Row k="Voting Style" v={draft.votingStyle || "—"} />
                  <Row k="Email Subject" v={draft.emailSubject || "—"} />
                  <div className="md:col-span-2">
                    <span className="font-semibold">Email Body:</span>{" "}
                    <span className="whitespace-pre-wrap break-words">{safe(draft.emailBody, "—")}</span>
                  </div>
                  <Row k="Start" v={draft.startDateISO || draft.startDate || "—"} />
                  <Row k="End" v={draft.endDateISO || draft.endDate || "—"} />
                  <div className="md:col-span-2">
                    <span className="font-semibold">Departments:</span>{" "}
                    {Array.isArray(draft.departmentIds) && draft.departmentIds.length ? (
                      <ul className="mt-1 ml-4 list-disc">
                        {draft.departmentIds.map(id => (
                          <li key={id}>
                            {departmentName(Number(id))} <span className="text-gray-600">(ID: {id})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </div>

                  {(draft.brandingFileName || draft.brandingPreviewDataUrl) && (
                    <div className="md:col-span-2">
                      <div className="font-semibold">Branding</div>
                      <div className="mt-1 text-sm">
                        {draft.brandingFileName ? `Using file: ${draft.brandingFileName}` : "—"}
                      </div>
                      {draft.brandingPreviewDataUrl && (
                        <div className="mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={draft.brandingPreviewDataUrl}
                            alt="Branding preview"
                            className="max-h-32 rounded border"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-700">— No campaign draft found —</div>
              )}
            </section>

            {/* Projects summary */}
            <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Selected Projects</h2>
                <div className="text-sm">{selectedProjects.length} selected</div>
              </div>

              {selectedProjectObjects.length === 0 ? (
                <div className="text-gray-700 mt-2">— No projects selected —</div>
              ) : (
                <div className="mt-4 space-y-4">
                  {selectedProjectObjects.map(p => {
                    const nonNull = getNonNullEntries(p);
                    const nulls = getNullKeys(p);
                    return (
                      <div key={p.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-sm text-gray-700">ID: {p.id}</div>
                        </div>

                        {/* chips summary */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {normalizeList(p.region ?? p.regions ?? p.location).map((l, i) => (
                            <Chip key={`r-${p.id}-${i}`} label={l} cls="border-gray-500 text-gray-800" />
                          ))}
                          {normalizeList(p.project_type ?? p.project_types ?? p.type ?? p.types).map((l, i) => (
                            <Chip key={`t-${p.id}-${i}`} label={l} cls="border-purple-500 text-purple-800" />
                          ))}
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

                        {/* All fields (non-null) */}
                        <div className="mt-4">
                          <div className="font-semibold mb-2">All Fields (non-null)</div>
                          <div className="grid grid-cols-1 md-grid-cols-2 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            {nonNull.map(([k, v]) => (
                              <div key={k}>
                                <span className="font-semibold">{k}:</span> <span className="break-words">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Null fields */}
                        <div className="mt-4">
                          <div className="font-semibold mb-2">Null fields</div>
                          <div className="text-sm text-gray-800">{nulls.length ? nulls.join(", ") : "None"}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Actions */}
            {error && <div className="mb-4 text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>}
            <div className="flex items-center justify-between">
              <button onClick={onBack} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50">
                Back
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                disabled={launching || !draft}
              >
                {launching ? "Launching…" : "Confirm Launch"}
              </button>
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

/* ------------- helpers ------------- */

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

function normalizeList(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map(textify)
      .map(s => String(s).trim())
      .filter(Boolean);
  }
  return [textify(val)].filter(Boolean);
}

// SDG normalization that handles nested shapes like { sdg: { id, name } }
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

function mapProjectForDisplay(p = {}) {
  const name = p.projectName || p.name || p.title || p.uniqueId || `Project ${p.id ?? ""}`;
  const descPieces = normalizeList([p.description, p.primarySector, p.project_types, p.standards]).filter(Boolean);
  const description = descPieces.join(" ").trim() || "Project details available";
  const link = p.link ?? p.url ?? p.website ?? null;
  return { ...p, name, description, link };
}

function isNullish(v) {
  return v === null || v === undefined;
}

function formatValueDetailed(key, value) {
  if (key === "sdgs") {
    const names = normalizeSdgsForDisplay(value);
    return names.length ? names.join(", ") : "—";
  }
  if (Array.isArray(value)) {
    return value
      .map(it =>
        it && typeof it === "object" ? it.name ?? it.label ?? it.value ?? it.title ?? JSON.stringify(it) : String(it)
      )
      .join(", ");
  }
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function getNonNullEntries(obj) {
  if (!obj || typeof obj !== "object") return [];
  const entries = Object.entries(obj)
    .filter(([, v]) => !isNullish(v))
    .map(([k, v]) => [k, formatValueDetailed(k, v)]);
  entries.sort(([a], [b]) => a.localeCompare(b));
  return entries;
}

function getNullKeys(obj) {
  if (!obj || typeof obj !== "object") return [];
  return Object.keys(obj)
    .filter(k => isNullish(obj[k]))
    .sort((a, b) => a.localeCompare(b));
}

// Dates → always send UTC ISO to server
function coerceIsoUtc(input) {
  if (!input) return null;
  if (typeof input === "string" && /Z$/.test(input)) return input; // already UTC ISO
  const d = new Date(input); // parses local or ISO
  if (isNaN(d.getTime())) return null;
  return d.toISOString(); // UTC ISO
}

// Simple chip UI
function Chip({ label, cls }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls || "border-gray-400 text-gray-700"}`}>
      {String(label)}
    </span>
  );
}

/** Embedded CarbonSustain logo (fallback if user didn’t upload one) */
const CARBON_SUSTAIN_LOGO_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKAP/2Q==";
