import { useEffect, useState } from 'react';
import { getProjectsFromAPI } from '../../services/getProjectsFromAPI';
import { postFormToAPI } from '../../services/postFormToAPI';
import ProjectResultCard from '../../components/ProjectResultCard';

export default function FormDemoPage() {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ subject: '', body: '', logo: '' });
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProjectsFromAPI().then(setProjects);
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.body.trim()) errs.body = 'Body is required';
    if (!form.logo) errs.logo = 'Logo is required';
    return errs;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    const res = await postFormToAPI(form);
    setResults(res);
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Project Search Form</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <div>
          <label className="block font-medium mb-1">Subject</label>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          {errors.subject && <div className="text-red-600 text-sm">{errors.subject}</div>}
        </div>
        <div>
          <label className="block font-medium mb-1">Body</label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            rows={3}
          />
          {errors.body && <div className="text-red-600 text-sm">{errors.body}</div>}
        </div>
        <div>
          <label className="block font-medium mb-1">Logo</label>
          <select
            name="logo"
            value={form.logo}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="">Select a logo</option>
            {projects.map(p => (
              <option key={p.id} value={p.logo}>{p.name}</option>
            ))}
          </select>
          {errors.logo && <div className="text-red-600 text-sm">{errors.logo}</div>}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Submit'}
        </button>
      </form>
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Matching Projects</h2>
          {results.map(project => (
            <ProjectResultCard key={project.id} project={project} />
          ))}
        </div>
      )}
      {results.length === 0 && !loading && (
        <div className="mt-8 text-gray-500">No matching projects found.</div>
      )}
    </div>
  );
} 