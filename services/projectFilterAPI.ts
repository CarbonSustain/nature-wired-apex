// src/services/projectFilterApi.ts
type ApiEnvelope<T = any> = {
    statusCode: number;
    message: string;
    data: T;
  };
  
  export type ProjectFilterPayload = {
    funding_target?: number[] | [number, number];
    timeframe?: string[];
    region?: (string | number)[];
    project_type?: string[];
    verification?: string[];
    sdgs?: (string | number)[];
  };

  
  const BASE_URL = (process.env.NEXT_PUBLIC_NATUREWIRED_API || "").replace(/\/+$/, "");
  
  export async function postFilterProjects<T = any>(
    payload: ProjectFilterPayload,
    init?: { signal?: AbortSignal }
  ): Promise<ApiEnvelope<T>> {
    const url = `${BASE_URL}/project/filter`;
  
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: init?.signal,
    });
  
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }
    return JSON.parse(text) as ApiEnvelope<T>;
  }
  