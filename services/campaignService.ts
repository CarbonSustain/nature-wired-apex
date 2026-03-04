import {
  Campaign,
  GetCampaignsResponse,
  GetCampaignResponse,
} from "../types/campaign";

/** Backend base */
const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
const CAMPAIGN_URL = `${API_BASE}/campaign`;

/** Server-allowed voting values */
const ALLOWED_VOTING = ["TOKEN_BASED", "STORY_FEATURE", "THEMED_BADGES"] as const;
type VotingStyle = (typeof ALLOWED_VOTING)[number];

function normalizeVotingStyle(v: unknown): VotingStyle {
  const up = String(v ?? "").toUpperCase();
  if ((ALLOWED_VOTING as readonly string[]).includes(up)) return up as VotingStyle;
  if (up === "SINGLE" || up === "SINGLE_CHOICE") return "TOKEN_BASED";
  if (up === "MULTI" || up === "MULTI_CHOICE") return "STORY_FEATURE";
  return "TOKEN_BASED";
}

function isHttpUrl(s: unknown): s is string {
  try {
    const u = new URL(String(s));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function parseMaybeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function ensureArrayOfPositiveNumbers(a: unknown): number[] {
  const arr = Array.isArray(a) ? a : [];
  return arr
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/** Minimal server DTO for creating a campaign. */
export type CreateCampaignDTO = {
  name: string;
  emailSubject: string;
  emailBody: string;
  votingStyle: VotingStyle | string; // we normalize
  startDate: string; // ISO expected by server
  endDate: string; // ISO expected by server
  departmentIds: number[] | string[]; // coerced to numbers > 0
  /** If provided (and no file), server expects a direct URL to the branding asset. */
  url?: string;
  // NOTE: do NOT send "branding" — schema no longer accepts it.
};

export class CampaignService {
  /**
   * Get all campaigns
   */
  static async getAllCampaigns(): Promise<Campaign[]> {
    if (!API_BASE) throw new Error("NEXT_PUBLIC_NATUREWIRED_API is not set");
    const response = await fetch(CAMPAIGN_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result: GetCampaignsResponse = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || `GET ${CAMPAIGN_URL} failed: ${response.status}`);
    }
    if (!Array.isArray(result?.data)) {
      throw new Error("Invalid campaigns data received from server");
    }
    return result.data;
  }

  /**
   * Get campaign by ID
   */
  static async getCampaignById(id: number): Promise<Campaign> {
    if (!API_BASE) throw new Error("NEXT_PUBLIC_NATUREWIRED_API is not set");
    const url = `${CAMPAIGN_URL}/${id}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result: GetCampaignResponse = await response.json();
    if (!response.ok) {
      throw new Error(result?.message || `GET ${url} failed: ${response.status}`);
    }
    if (!result?.data) {
      throw new Error("Campaign not found");
    }
    return result.data;
  }

  /**
   * Create campaign.
   * - If `file` is provided (File/Blob), sends multipart/form-data with field name **"file"**.
   * - Else, if `payload.url` is provided (http/https), sends JSON with { url }.
   * - Never sends the deprecated `branding` field (backend schema rejects it).
   */
  static async createCampaign(
    payload: CreateCampaignDTO,
    opts?: { file?: Blob | File | null }
  ): Promise<Campaign> {
    if (!API_BASE) throw new Error("NEXT_PUBLIC_NATUREWIRED_API is not set");

    const url = CAMPAIGN_URL;

    // Normalize fields to match server expectations
    const departmentIds = ensureArrayOfPositiveNumbers(payload.departmentIds);
    const votingStyle = normalizeVotingStyle(payload.votingStyle);

    // Build a clean JSON payload (no "branding")
    const jsonBody: Record<string, unknown> = {
      name: payload.name,
      emailSubject: payload.emailSubject,
      emailBody: payload.emailBody,
      votingStyle,
      startDate: payload.startDate,
      endDate: payload.endDate,
      departmentIds,
    };

    // Only include url if present & valid AND there is no file
    const hasFile = !!opts?.file;
    if (!hasFile && isHttpUrl(payload.url)) {
      jsonBody.url = payload.url;
    }

    let res: Response;

    if (hasFile) {
      // multipart/form-data
      const fd = new FormData();
      fd.append("file", opts!.file as Blob, (opts!.file as File)?.name || "branding.jpg");
      Object.entries(jsonBody).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        // stringify arrays/objects
        if (typeof v === "object") {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, String(v));
        }
      });

      res = await fetch(url, { method: "POST", body: fd });
    } else {
      // application/json
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonBody),
      });
    }

    if (!res.ok) {
      const body = await parseMaybeJson(res);
      throw new Error(
        `POST ${url} failed: ${res.status} ${res.statusText} — ${typeof body === "object" ? JSON.stringify(body) : String(body)
        }`
      );
    }

    const data = await parseMaybeJson(res);
    const campaign: Campaign = (data?.data ?? data) as Campaign;
    return campaign;
  }

  /**
   * Attach projects to a campaign
   * POST /campaign/:id/projects { projectIds: number[] }
   */
  static async attachProjects(campaignId: number, projectIds: number[]): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!API_BASE) throw new Error("NEXT_PUBLIC_NATUREWIRED_API is not set");
    const url = `${CAMPAIGN_URL}/${encodeURIComponent(campaignId)}/projects`;

    const ids = ensureArrayOfPositiveNumbers(projectIds);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectIds: ids }),
    });

    if (!res.ok) {
      const body = await parseMaybeJson(res);
      return {
        ok: false,
        error:
          typeof body === "object"
            ? JSON.stringify(body)
            : `POST ${url} failed: ${res.status} ${res.statusText}`,
      };
    }

    return { ok: true };
  }
}
