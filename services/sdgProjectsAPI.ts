// services/sdgProjectsAPI.ts
// Fetch projects from the Hedera mainnet indexer, grouped by SDG.
// Uses the same search strategy as the mainnet explorer UI ("SDG 13" full-text)
// combined with all elsevier + auckland keywords for each SDG.

export type SdgProjectResult = {
  sdg: number;
  projects: any[];
};

type ApiEnvelope<T = any> = {
  success: boolean;
  data: T;
};

const BASE_URL = (process.env.NEXT_PUBLIC_NATUREWIRED_API || '').replace(/\/+$/, '');

/**
 * Fetch projects for one or more SDG numbers (1–17).
 * Defaults to SDGs 1–13.
 *
 * Each entry in the returned array has:
 *   { sdg: number, projects: ProjectResponse[] }
 */
export async function fetchProjectsBySDGs(
  sdgNumbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  init?: { signal?: AbortSignal }
): Promise<SdgProjectResult[]> {
  const url = `${BASE_URL}/indexer/projects-by-sdg?sdgs=${sdgNumbers.join(',')}`;

  const res = await fetch(url, { signal: init?.signal });
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  const json: ApiEnvelope<SdgProjectResult[]> = JSON.parse(text);
  return json.data ?? (json as any);
}

/**
 * Flatten the SDG result array into a deduplicated list of projects,
 * each tagged with the SDG numbers it matched.
 */
export function flattenSdgResults(
  sdgResults: SdgProjectResult[]
): Array<any & { matchedSdgs: number[] }> {
  const seen = new Map<string, any & { matchedSdgs: number[] }>();

  for (const { sdg, projects } of sdgResults) {
    for (const p of projects) {
      const key = p.uuid || p.consensusTimestamp;
      if (!key) continue;
      if (seen.has(key)) {
        seen.get(key)!.matchedSdgs.push(sdg);
      } else {
        seen.set(key, { ...p, matchedSdgs: [sdg] });
      }
    }
  }

  return Array.from(seen.values());
}
