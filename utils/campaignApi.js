// utils/campaignApi.js

const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
const CAMPAIGN_URL = `${API_BASE}/campaign`;

/** Safely parse JSON, fallback to text */
async function parseMaybeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Convert dataURL string → Blob (async, using fetch for reliability) */
export async function dataURLtoBlob(dataURL) {
  if (!dataURL || typeof dataURL !== "string") return null;
  const res = await fetch(dataURL);
  return res.blob();
}

/**
 * Create Campaign.
 * If `brandingFile` is provided (File or { dataURL, fileName }), POST multipart with field 'file'.
 * Otherwise POST JSON.
 *
 * @param {{
 *   name: string,
 *   votingStyle: "TOKEN_BASED"|"STORY_FEATURE"|"THEMED_BADGES",
 *   startDate: string, // ISO UTC
 *   endDate: string,   // ISO UTC
 *   emailSubject?: string,
 *   emailBody?: string,
 *   departmentIds: number[],
 *   url?: string
 * }} payload
 * @param {File | { dataURL: string, fileName?: string } | null} brandingFile
 */
export async function handleCreateCampaign(payload, brandingFile = null) {
  // --- normalize departmentIds in-memory first ---
  const normDeptIds = Array.isArray(payload?.departmentIds)
    ? payload.departmentIds.map(x => Number(x)).filter(n => Number.isFinite(n))
    : [];

  const normalized = {
    ...payload,
    departmentIds: normDeptIds,
  };

  let res;

  if (brandingFile) {
    // multipart/form-data path → backend expects departmentIds as a JSON array string
    const form = new FormData();

    for (const [k, v] of Object.entries(normalized)) {
      if (v === undefined || v === null) continue;

      if (k === "departmentIds") {
        form.append("departmentIds", JSON.stringify(v)); // <-- the key fix
      } else if (v instanceof Date) {
        form.append(k, v.toISOString());
      } else if (typeof v === "object" && !Array.isArray(v)) {
        form.append(k, JSON.stringify(v));
      } else {
        form.append(k, String(v));
      }
    }

    // append file
    if (brandingFile instanceof File) {
      form.append("file", brandingFile, brandingFile.name || "branding.bin");
    } else if (brandingFile?.dataURL) {
      const blob = await dataURLtoBlob(brandingFile.dataURL);
      form.append("file", blob, brandingFile.fileName || "branding.bin");
    }

    res = await fetch(CAMPAIGN_URL, { method: "POST", body: form });
  } else {
    // application/json path → send as a real array
    res = await fetch(CAMPAIGN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    });
  }

  if (!res.ok) {
    const body = await parseMaybeJson(res);
    throw new Error(
      `POST ${CAMPAIGN_URL} failed: ${res.status} ${res.statusText} — ${
        typeof body === "object" ? JSON.stringify(body) : String(body)
      }`
    );
  }
  return await res.json();
}

export async function handleAddProjectsToCampaign(campaignId, projectIds) {
  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;

  const cid = Number(campaignId);
  const ids = Array.from(new Set((projectIds || []).map(Number))).filter(n => Number.isFinite(n) && n > 0);

  if (!Number.isFinite(cid) || ids.length === 0) {
    return { ok: false, status: 400, body: { message: "Invalid campaignId or projectIds" } };
  }

  const response = await fetch(`${API_BASE}/campaign-project/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaignId: cid, projectIds: ids }),
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return { ok: response.ok, status: response.status, body };
}

/** Get all campaigns (used by Active page) */
export async function handleGetallCampaign() {
  const res = await fetch(`${API_BASE}/campaign`, { method: "GET" });
  const body = await parseMaybeJson(res);
  if (!res.ok) throw new Error(body?.message || "Failed to fetch campaigns");
  return body;
}
