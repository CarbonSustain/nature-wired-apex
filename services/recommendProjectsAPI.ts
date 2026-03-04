// src/services/recommendProjectsApi.ts

export type InputParams = {
    funding_target: number[] | [number, number];   // [min, max] or a list
    timeframe: string[];                           // ["2025-Q4","2026-Q2"]
    region: string[];                              // ["Buena Vista"]
    project_type: string[];                        // ["RST"]
    verification: string[];                        // ["Gold Standard"]
    sdgs: string[];                                // ["no poverty"] or ["1"]
  };
  
  type ApiEnvelope<T = any> = {
    statusCode: number;
    message: string;
    data: T;
  };
  
  const BASE_URL = (process.env.NEXT_PUBLIC_NATUREWIRED_API || "").replace(/\/+$/, "");
  
  // Optional: map SDG free text to canonical names or ids if your backend expects a specific form.
  const sdgIdToName: Record<string | number, string> = {
    1: "no poverty",
    2: "zero hunger",
    3: "good health and well-being",
    4: "quality education",
    5: "gender equality",
    6: "clean water and sanitation",
    7: "affordable and clean energy",
    8: "decent work and economic growth",
    9: "industry, innovation and infrastructure",
    10: "reduced inequalities",
    11: "sustainable cities and communities",
    12: "responsible consumption and production",
    13: "climate action",
  };
  
  function normalizeSdgs(sdgs: (string | number)[]): string[] {
    return (sdgs || []).map(s => {
      const key = String(s).trim().toLowerCase();
  
      // If numeric return mapped name
      if (sdgIdToName[s]) return sdgIdToName[s];
  
      // If string matches a name (like "no poverty"), return as-is
      const found = Object.values(sdgIdToName).find(
        name => name.toLowerCase() === key
      );
      return found ?? key;
    });
  }
  
  // Map frontend keys to backend keys
  function toBackendPayload(p: InputParams) {
    return {
      funding_target: p.funding_target,
      timeframe: p.timeframe,
      region : p.region,
      project_type: p.project_type,
      verification: p.verification,
      sdgs: normalizeSdgs(p.sdgs),
    };
  }
  
  export async function postFinalRecommendations<T = any>(
    params: InputParams,
    init?: { signal?: AbortSignal }
  ): Promise<ApiEnvelope<T>> {
    const url = `${BASE_URL}/recommend-projects/final-recommendations`;
  
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toBackendPayload(params)),
      signal: init?.signal,
    });
  
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }
    return JSON.parse(text) as ApiEnvelope<T>;
  }
  