// Fetch projects from backend with optional filters
export async function getProjectsFromAPI(filters = {}) {
  const API_BASE = process.env.NEXT_PUBLIC_NATUREWIRED_API;
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v));
    } else if (value) {
      params.append(key, value);
    }
  });
  const url = `${API_BASE}/project${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return Array.isArray(data) ? data : data.data || [];
} 