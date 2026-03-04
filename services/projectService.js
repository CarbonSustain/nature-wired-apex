// services/projectService.js

const pickList = (data, key) => (Array.isArray(data?.[key]) ? data[key] : []);

/**
 * GET /recommend-projects/filters
 * Normalizes to FE keys and shapes used by react-select.
 * Server POST keys are the same as FE keys.
 */
export async function getProjectFilters(apiBase) {
  const res = await fetch(`${apiBase}/recommend-projects/filters`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Filters fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  const data = json?.data || {};

  const normalize = arr =>
    (Array.isArray(arr) ? arr : []).map(o => ({
      value: o?.value ?? o?.name ?? o?.label,
      label: o?.label ?? o?.name ?? o?.value,
    }));

  return {
    funding_target: normalize(pickList(data, "fundingTarget")),
    timeframe: normalize(pickList(data, "timeframe")),
    region: normalize(pickList(data, "geographicLocation")),
    project_type: normalize(pickList(data, "projectType")),
    verification: normalize(pickList(data, "verificationStandard")),
    health_social_equity: normalize(pickList(data, "healthSocialEquity")),
  };
}

/**
 * GET /sdg
 * Returns options for SDG multi-select.
 * We set value = name (exact string) so we can POST names directly.
 * Label is "id – name".
 */
export async function getSdgs(apiBase) {
  const res = await fetch(`${apiBase}/sdg`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SDG fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  const arr = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  return arr.map(s => ({
    value: s?.name, // use name for POST
    label: `${s?.id} – ${s?.name}`,
  }));
}

/**
 * GET /project — used when no filters are selected (fast path)
 */
export async function getAllProjects(apiBase) {
  const res = await fetch(`${apiBase}/project`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /project failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
}

/**
 * POST /project/filter — when any filters are selected
 * Expects keys:
 * funding_target, timeframe, region, project_type, verification, sdgs, health_social_equity
 */
export async function filterProjects(apiBase, payload) {
  const res = await fetch(`${apiBase}/project/filter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /project/filter failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
}

/**
 * Project mapping for display
 */
export function mapProjectForDisplay(p = {}) {
  const name = p.projectName || p.name || p.title || p.uniqueId || `Project ${p.id ?? ""}`;

  const description =
    p.description ||
    [p.primarySector, p.project_types, p.standards].filter(Boolean).join(" ").trim() ||
    "Project details available";

  const link = p.link ?? p.url ?? p.website ?? null;

  return { ...p, name, description, link };
}
