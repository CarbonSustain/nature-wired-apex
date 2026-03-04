import { getProjectsFromAPI } from './getProjectsFromAPI';

// Simulate a POST call to filter projects
export async function postFormToAPI(formData) {
  const projects = await getProjectsFromAPI();
  const { subject = '', body = '' } = formData;
  const search = (subject + ' ' + body).toLowerCase();
  // Filter projects if their name appears in subject or body
  const filtered = projects.filter(p => search.includes(p.name.toLowerCase()));
  return Promise.resolve(filtered);
} 