// pages/admin/select-projects.js

import SidebarLayout from "@/components/SidebarLayout";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
  getProjectFilters,
  getAllProjects,
  filterProjects,
  mapProjectForDisplay,
  getSdgs,
} from "@/services/projectService";
import { useRouter } from "next/router";

const MAX_SELECT = 3;

export default function SelectProjects() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_NATUREWIRED_API;

  // Draft (saved from /admin/create.js)
  const [draft, setDraft] = useState(null);

  // Filter options and SDG name map
  const [filterOptions, setFilterOptions] = useState({
    funding_target: [],
    timeframe: [],
    region: [],
    project_type: [],
    verification: [],
    health_social_equity: [],
    sdgs: [],
    methodology: [
      { value: "VM0047", label: "VM0047 – ARR" },
      { value: "VM0033", label: "VM0033 – Tidal Wetlands" },
      { value: "VM0042", label: "VM0042 – REDD+" },
      { value: "VM0050", label: "VM0050 – Soil Carbon" },
      { value: "TPDDTEC", label: "TPDDTEC – Clean Water" },
      { value: "ATEC", label: "ATEC – Energy" },
      { value: "AMS II.C", label: "AMS II.C – Energy Efficiency" },
      { value: "BCarbon", label: "BCarbon – Blue Carbon" },
    ],
  });
  const [sdgNameMap, setSdgNameMap] = useState({}); // id/name → name
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Selected filters
  const [filters, setFilters] = useState({
    funding_target: [],
    timeframe: [],
    region: [],
    project_type: [],
    verification: [],
    health_social_equity: [],
    sdgs: [],
    methodology: [],
  });

  // Projects + selection
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProjects, setSelectedProjects] = useState([]); // [{id,name}]
  const [resyncing, setResyncing] = useState(false);
  const [resyncMessage, setResyncMessage] = useState(null);
  const [projectRefreshKey, setProjectRefreshKey] = useState(0);

  // Expanded inline details
  const [expanded, setExpanded] = useState({}); // { [id]: true }

  // Load draft + previous selections
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("campaignDraft");
      setDraft(raw ? JSON.parse(raw) : null);

      const prevSel = sessionStorage.getItem("selectedProjects");
      setSelectedProjects(prevSel ? JSON.parse(prevSel) : []);
    } catch {
      setDraft(null);
      setSelectedProjects([]);
    }
  }, []);

  // Load filters + SDGs
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingFilters(true);
      try {
        const [fo, sdgOpts] = await Promise.all([getProjectFilters(apiBase), getSdgs(apiBase)]);

        // Build name map for sdg id↔name
        const m = {};
        (sdgOpts || []).forEach(opt => {
          const [idStr] = String(opt.label).split(" – ");
          const idNum = Number(idStr);
          const name = opt.value;
          if (Number.isFinite(idNum)) {
            m[idNum] = name;
            m[String(idNum)] = name;
          }
          m[name] = name;
        });

        if (mounted) {
          setFilterOptions(prev => ({ ...prev, ...fo, sdgs: sdgOpts }));
          setSdgNameMap(m);
        }
      } catch (e) {
        console.error("Filter/SDG load error:", e);
        if (mounted) {
          setFilterOptions(prev => ({
            ...prev,
            funding_target: [],
            timeframe: [],
            region: [],
            project_type: [],
            verification: [],
            health_social_equity: [],
            sdgs: [],
          }));
          setSdgNameMap({});
        }
      } finally {
        if (mounted) setLoadingFilters(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [apiBase]);

  const hasAnyFilters = useMemo(() => {
    const f = filters;
    return (
      (f.funding_target?.length || 0) +
        (f.timeframe?.length || 0) +
        (f.region?.length || 0) +
        (f.project_type?.length || 0) +
        (f.verification?.length || 0) +
        (f.health_social_equity?.length || 0) +
        (f.sdgs?.length || 0) +
        (f.methodology?.length || 0) >
      0
    );
  }, [filters]);

  // Fetch projects initially and when filters change
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProjects(true);
      try {
        let list;
        if (!hasAnyFilters) {
          list = await getAllProjects(apiBase);
        } else {
          const payload = {
            funding_target: filters.funding_target,
            timeframe: filters.timeframe,
            region: filters.region,
            project_type: filters.project_type,
            verification: filters.verification,
            sdgs: filters.sdgs,
            health_social_equity: filters.health_social_equity,
            methodology: filters.methodology,
          };
          list = await filterProjects(apiBase, payload);
        }

        const mapped = (list || []).map(p => {
          const description = extractCardDescription(p);
          return mapProjectForDisplay({ ...p, description });
        });

        if (mounted) setProjects(mapped);
      } catch (e) {
        console.error("Project load error:", e);
        if (mounted) setProjects([]);
      } finally {
        if (mounted) setLoadingProjects(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [apiBase, hasAnyFilters, filters, projectRefreshKey]);

  const handleResync = async () => {
    setResyncing(true);
    setResyncMessage(null);
    try {
      const res = await fetch(`${apiBase}/project/resync`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Resync failed");

      // Immediately display the blockchain projects returned by the endpoint
      const blockchainProjects = body.data?.projects || [];
      if (blockchainProjects.length > 0) {
        const mapped = blockchainProjects.map(p => {
          const description = extractCardDescription(p);
          return mapProjectForDisplay({ ...p, description });
        });
        setProjects(mapped);
        setResyncMessage(`Loaded ${mapped.length} projects from blockchain. Database is syncing in the background.`);
      } else {
        setResyncMessage(`Refresh complete. Reloading projects from database...`);
        setProjectRefreshKey(k => k + 1);
      }
    } catch (e) {
      setResyncMessage(`Error: ${e.message}`);
    } finally {
      setResyncing(false);
    }
  };

  const toggleSelect = proj => {
    setSelectedProjects(prev => {
      const exists = prev.find(p => p.id === proj.id);
      if (exists) return prev.filter(p => p.id !== proj.id);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, { id: proj.id, name: proj.name }];
    });
  };

  const isSelected = id => !!selectedProjects.find(p => p.id === id);
  const toggleExpand = key => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const handleBack = () => router.push("/admin/create");

  const handleContinue = () => {
    try {
      sessionStorage.setItem("selectedProjects", JSON.stringify(selectedProjects));
      sessionStorage.setItem("projectFilters", JSON.stringify(filters));
    } catch {}

    // Also pass IDs via query for robustness
    const ids = selectedProjects.map(p => p.id).join(",");
    router.push({
      pathname: "/admin/launch-voting-campaign",
      query: { selectedProjects: ids },
    });
  };

  const multiSelectStyles = {
    option: (provided, state) => ({
      ...provided,
      color: "#000000",
      backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#dbeafe" : "white",
    }),
    singleValue: p => ({ ...p, color: "#000000" }),
    multiValueLabel: p => ({ ...p, color: "#000000" }),
    placeholder: p => ({ ...p, color: "#6b7280" }),
  };

  const selectedCount = selectedProjects.length;

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto p-8 text-black">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Select Projects</h1>
            <p className="text-gray-700 mt-1">
              Choose up to 3 projects for your campaign. Click a card to select/deselect. “View Detail” expands inline.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-gray-700">Step 2 of 2</div>
            <button
              onClick={handleResync}
              disabled={resyncing}
              className="px-3 py-1.5 rounded border border-orange-400 text-orange-700 text-sm hover:bg-orange-50 disabled:opacity-60"
            >
              {resyncing ? "Resyncing..." : "Refresh"}
            </button>
          </div>
        </div>
        {resyncMessage && (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
            {resyncMessage}
          </div>
        )}

        {/* Draft summary */}
        {draft && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-8 text-sm">
              <div>
                <span className="font-semibold">Name:</span> {draft.name || "—"}
              </div>
              <div>
                <span className="font-semibold">Voting Style:</span> {draft.votingStyle}
              </div>
              <div>
                <span className="font-semibold">Start:</span> {draft.startDateISO || "—"}
              </div>
              <div>
                <span className="font-semibold">End:</span> {draft.endDateISO || "—"}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Funding Target */}
            <div>
              <label className="block font-medium mb-1">Funding Target</label>
              <Select
                isMulti
                options={filterOptions.funding_target}
                value={filterOptions.funding_target.filter(o => filters.funding_target.includes(o.value))}
                onChange={sel => setFilters(p => ({ ...p, funding_target: (sel || []).map(o => o.value) }))}
                classNamePrefix="select"
                styles={multiSelectStyles}
                placeholder={loadingFilters ? "Loading..." : "Select funding target..."}
                isDisabled={loadingFilters}
                closeMenuOnSelect={false}
              />
            </div>

            {/* Timeframe */}
            <div>
              <label className="block font-medium mb-1">Timeframe</label>
              <Select
                isMulti
                options={filterOptions.timeframe}
                value={filterOptions.timeframe.filter(o => filters.timeframe.includes(o.value))}
                onChange={sel => setFilters(p => ({ ...p, timeframe: (sel || []).map(o => o.value) }))}
                classNamePrefix="select"
                styles={multiSelectStyles}
                placeholder={loadingFilters ? "Loading..." : "Select timeframe..."}
                isDisabled={loadingFilters}
                closeMenuOnSelect={false}
              />
            </div>

            {/* Region */}
            <div>
              <label className="block font-medium mb-1">Geographic Location</label>
              <Select
                isMulti
                options={filterOptions.region}
                value={filterOptions.region.filter(o => filters.region.includes(o.value))}
                onChange={sel => setFilters(p => ({ ...p, region: (sel || []).map(o => o.value) }))}
                classNamePrefix="select"
                styles={multiSelectStyles}
                placeholder={loadingFilters ? "Loading..." : "Select location..."}
                isDisabled={loadingFilters}
                closeMenuOnSelect={false}
              />
            </div>

            {/* Project Type */}
            <div>
              <label className="block font-medium mb-1">Project Type</label>
              <Select
                isMulti
                options={filterOptions.project_type}
                value={filterOptions.project_type.filter(o => filters.project_type.includes(o.value))}
                onChange={sel => setFilters(p => ({ ...p, project_type: (sel || []).map(o => o.value) }))}
                classNamePrefix="select"
                styles={multiSelectStyles}
                placeholder={loadingFilters ? "Loading..." : "Select project type..."}
                isDisabled={loadingFilters}
                closeMenuOnSelect={false}
              />
            </div>

            {/* Verification */}
            <div>
              <label className="block font-medium mb-1">Verification Standard</label>
              <Select
                isMulti
                options={filterOptions.verification}
                value={filterOptions.verification.filter(o => filters.verification.includes(o.value))}
                onChange={sel => setFilters(p => ({ ...p, verification: (sel || []).map(o => o.value) }))}
                classNamePrefix="select"
                styles={multiSelectStyles}
                placeholder={loadingFilters ? "Loading..." : "Select verification..."}
                isDisabled={loadingFilters}
                closeMenuOnSelect={false}
              />
            </div>

            {/* Health & Social Equity */}
            <div>
              <label className="block font-medium mb-1">Health & Social Equity</label>
              <Select
                isMulti
                options={filterOptions.health_social_equity}
                value={filterOptions.health_social_equity.filter(o => filters.health_social_equity.includes(o.value))}
                onChange={sel =>
                  setFilters(p => ({
                    ...p,
                    health_social_equity: (sel || []).map(o => o.value),
                  }))
                }
                classNamePrefix="select"
                styles={multiSelectStyles}
                placeholder={loadingFilters ? "Loading..." : "Select equity impacts..."}
                isDisabled={loadingFilters}
                closeMenuOnSelect={false}
              />
            </div>

            {/* SDGs */}
            <div>
              <label className="block font-medium mb-1">SDG Impact</label>
              <Select
                isMulti
                options={filterOptions.sdgs}
                value={filterOptions.sdgs.filter(o => filters.sdgs.includes(o.value))}
                onChange={sel => setFilters(p => ({ ...p, sdgs: (sel || []).map(o => o.value) }))}
                classNamePrefix="select"
                styles={multiSelectStyles}
                placeholder={loadingFilters ? "Loading..." : "Select SDGs..."}
                isDisabled={loadingFilters}
                closeMenuOnSelect={false}
              />
            </div>

            {/* Methodology */}
            <div>
              <label className="block font-medium mb-1">Methodology</label>
              <Select
                isMulti
                options={filterOptions.methodology}
                value={filterOptions.methodology.filter(o => filters.methodology.includes(o.value))}
                onChange={sel => setFilters(p => ({ ...p, methodology: (sel || []).map(o => o.value) }))}
                classNamePrefix="select"
                styles={multiSelectStyles}
                placeholder="Select methodology..."
                closeMenuOnSelect={false}
              />
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Matching Projects</h2>
          {loadingProjects ? (
            <div className="text-center py-8">Loading project recommendations…</div>
          ) : projects.length === 0 ? (
            <div className="text-gray-700">No matching projects found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((p, idx) => {
                const expandKey = makeProjectKey(p, idx);
                const selected = isSelected(p.id);
                const show = !!expanded[expandKey];

                // Normalize chips from any shape
                const regions = normalizeList(p.region ?? p.regions ?? p.location);
                const types = normalizeList(p.project_type ?? p.project_types ?? p.type ?? p.types);
                const verifs = normalizeList(p.verification ?? p.verifications ?? p.standards ?? p.standard);
                const equities = normalizeList(p.health_social_equity ?? p.healthEquity ?? p.health_social);
                const sdgs = normalizeSdgsForDisplay(p.sdgs, sdgNameMap); // handles { sdg: { id,name } } etc.

                return (
                  <div
                    key={expandKey}
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition ${
                      selected ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="text-sm text-gray-700 mt-1 line-clamp-2">{p.description}</div>
                        {/* chips */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {regions.map((label, i) => (
                            <Chip key={`r-${expandKey}-${i}`} label={label} cls="border-gray-500 text-gray-800" />
                          ))}
                          {types.map((label, i) => (
                            <Chip key={`t-${expandKey}-${i}`} label={label} cls="border-purple-500 text-purple-800" />
                          ))}
                          {verifs.map((label, i) => (
                            <Chip key={`v-${expandKey}-${i}`} label={label} cls="border-emerald-500 text-emerald-800" />
                          ))}
                          {equities.map((label, i) => (
                            <Chip key={`e-${expandKey}-${i}`} label={label} cls="border-rose-500 text-rose-800" />
                          ))}
                          {sdgs.map((label, i) => (
                            <Chip key={`s-${expandKey}-${i}`} label={label} cls="border-blue-500 text-blue-700" />
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col gap-2 items-end">
                        {p.link && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline text-blue-700 hover:text-blue-900"
                          >
                            View Project
                          </a>
                        )}
                        <button
                          onClick={() => toggleExpand(expandKey)}
                          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
                        >
                          {show ? "Hide Detail" : "View Detail"}
                        </button>
                        <button
                          onClick={() => toggleSelect(p)}
                          className={`px-3 py-1 rounded text-sm ${
                            selected
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {selected ? "Remove" : "Select"}
                        </button>
                      </div>
                    </div>

                    {/* inline detail */}
                    {show && (
                      <div className="mt-4 space-y-4">
                        {/* A) Concise essentials (kept) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                          <Detail label="ID" value={p.id} />
                          <Detail label="Unique ID" value={p.uniqueId} />
                          <Detail label="Status" value={p.status} />
                          <Detail label="Consensus Timestamp" value={p.consensusTimestamp} />
                          <Detail label="Created At" value={formatDateish(p.created_at)} />
                        </div>

                        {/* B) All non-null fields (auto) */}
                        <div className="border rounded-lg p-3">
                          <div className="font-semibold mb-2">All Fields (non-null)</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            {getNonNullEntries(p, sdgNameMap).map(([k, v]) => (
                              <div key={k}>
                                <span className="font-semibold">{k}:</span> <span className="break-words">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* C) Null field list */}
                        <div className="border rounded-lg p-3">
                          <div className="font-semibold mb-2">Null fields</div>
                          {getNullKeys(p).length ? (
                            <div className="text-sm text-gray-800">{getNullKeys(p).join(", ")}</div>
                          ) : (
                            <div className="text-sm text-gray-600">None</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm">
            Selected Projects: <span className="font-semibold">{selectedCount}</span> / {MAX_SELECT}
            {selectedCount > 0 && (
              <span className="ml-2 text-gray-700">{selectedProjects.map(p => p.name).join(", ")}</span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={handleBack} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50">
              Back
            </button>
            <button
              onClick={handleContinue}
              className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              disabled={selectedCount < 1 || selectedCount > MAX_SELECT}
              title={
                selectedCount < 1
                  ? "Select at least one project"
                  : selectedCount > MAX_SELECT
                  ? `Max ${MAX_SELECT} projects`
                  : ""
              }
            >
              Continue to Confirm
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

/* ----------------- helpers ------------------ */

function Detail({ label, value }) {
  return (
    <div>
      <span className="font-semibold">{label}:</span> {safe(value, "—")}
    </div>
  );
}

// Convert anything to a readable string
function textify(x) {
  if (x == null) return "";
  if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") return String(x);
  if (Array.isArray(x)) return normalizeList(x).join(", ");
  if (typeof x === "object") {
    return (
      x.name ??
      x.label ??
      x.value ??
      x.title ??
      x.text ??
      x.displayName ??
      (x.id != null ? String(x.id) : JSON.stringify(x))
    );
  }
  try {
    return JSON.stringify(x);
  } catch {
    return String(x);
  }
}

// Normalize any list-ish value into array of readable strings
function normalizeList(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map(item => textify(item))
      .map(s => String(s).trim())
      .filter(Boolean);
  }
  return [textify(val)].filter(Boolean);
}

// SDG normalization tailored to responses:
// accepts: [{ sdg: { id, name } }, ...] OR ids/names/objects mixed.
function normalizeSdgsForDisplay(val, nameMap) {
  const items = Array.isArray(val) ? val : val ? [val] : [];
  const out = [];
  for (const item of items) {
    if (item && typeof item === "object") {
      // shape: { projectId, sdgId, sdg: { id, name } } or { id, name }
      const name =
        item?.sdg?.name ??
        item?.name ??
        (item?.sdgId != null ? nameMap[item.sdgId] || nameMap[String(item.sdgId)] : undefined) ??
        (item?.id != null ? nameMap[item.id] || nameMap[String(item.id)] : undefined);
      if (name) out.push(String(name));
      else out.push(textify(item));
    } else if (typeof item === "number") {
      out.push(nameMap[item] || String(item));
    } else if (typeof item === "string") {
      const n = Number(item);
      if (Number.isFinite(n) && nameMap[String(n)]) out.push(nameMap[String(n)]);
      else out.push(nameMap[item] || item);
    } else {
      out.push(String(item));
    }
  }
  return out.filter(Boolean);
}

function safe(v, fallback = "N/A") {
  const s = textify(v);
  return s && s.trim().length ? s : fallback;
}

function formatDateish(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s);
  return d.toLocaleString();
}

function Chip({ label, cls }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls || "border-gray-400 text-gray-700"}`}>
      {String(label)}
    </span>
  );
}

// ---------- NEW: full detail listings ----------

function isNullish(v) {
  return v === null || v === undefined;
}

// Formats any value into a compact readable string (arrays/objects prettified).
// Special handling for the `sdgs` field to show names using the sdgNameMap.
function formatValueDetailed(key, value, sdgNameMap) {
  if (key === "sdgs") {
    const names = normalizeSdgsForDisplay(value, sdgNameMap);
    return names.length ? names.join(", ") : "—";
  }
  if (Array.isArray(value)) {
    // If it's an array of primitives/objects, pretty-print safely
    const norm = value.map(it => {
      if (it && typeof it === "object") {
        // avoid huge dumps; pick common display props if present
        const common =
          it.name ??
          it.label ??
          it.value ??
          it.title ??
          it.text ??
          it.displayName ??
          (it.id != null ? `id:${it.id}` : JSON.stringify(it));
        return String(common);
      }
      return String(it);
    });
    return norm.join(", ");
  }
  if (value && typeof value === "object") {
    // Compact JSON for objects
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// Returns arrays: [ [key, formattedVal], ... ] for non-null fields
function getNonNullEntries(project, sdgNameMap) {
  if (!project || typeof project !== "object") return [];
  const entries = Object.entries(project)
    .filter(([, v]) => !isNullish(v))
    .map(([k, v]) => [k, formatValueDetailed(k, v, sdgNameMap)]);
  // Sort keys alphabetically for stable display
  entries.sort(([a], [b]) => a.localeCompare(b));
  return entries;
}

// Returns array of keys whose values are null or undefined
function getNullKeys(project) {
  if (!project || typeof project !== "object") return [];
  return Object.keys(project)
    .filter(k => isNullish(project[k]))
    .sort((a, b) => a.localeCompare(b));
}

function makeProjectKey(project, idx) {
  const raw =
    project?.id ??
    project?.uniqueId ??
    project?.projectId ??
    project?.project_id ??
    project?.projectName ??
    project?.name ??
    idx;
  return String(raw);
}

function extractCardDescription(p) {
  const s = v => (typeof v === "string" && v.trim().length ? v.trim() : null);

  const direct = s(p?.description);
  if (direct) return direct;

  const pd = p?.projectDescription;
  const pdet = p?.project_details;

  const g132 =
    (pd && typeof pd === "object" ? s(pd?.G132) : null) ??
    (pdet && typeof pdet === "object" ? s(pdet?.G132) : null);
  if (g132) return g132.length > 300 ? g132.slice(0, 300) + "..." : g132;

  const standardsDesc =
    (p?.standards && typeof p.standards === "object" ? s(p.standards?.description) : null) ??
    s(p?.vcs_project_description) ??
    s(p?.summary) ??
    s(p?.["Project Description"]);
  if (standardsDesc) return standardsDesc.length > 300 ? standardsDesc.slice(0, 300) + "..." : standardsDesc;

  const bits = [p?.primarySector, p?.project_types, p?.standards].map(textify).map(x => String(x).trim()).filter(Boolean);
  if (bits.length) return bits.join(" ").slice(0, 300) + (bits.join(" ").length > 300 ? "..." : "");

  return "Project details available";
}
