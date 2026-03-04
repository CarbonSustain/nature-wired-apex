import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// List of pages to search (add more as needed)
const PAGES = [
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/admin/create', title: 'Create Campaign' },
  { path: '/admin/active', title: 'Active Campaigns' },
  // { path: '/admin/pending', title: 'Pending Votes' },
  // { path: '/admin/export', title: 'Export Data' },
  { path: '/admin/recommended-projects', title: 'Recommended Projects' },
  { path: '/admin/launch-voting-campaign', title: 'Launch Voting Campaign' },
  { path: '/', title: 'Home' },
];

export default function SearchPage() {
  const router = useRouter();
  const { keyword = '' } = router.query;
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (typeof keyword === 'string') {
      const kw = keyword.trim().toLowerCase();
      setResults(
        PAGES.filter(
          p =>
            p.title.toLowerCase().includes(kw) ||
            p.path.toLowerCase().includes(kw)
        )
      );
    }
  }, [keyword]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Search Results</h1>
        <div className="mb-4 text-gray-600">Keyword: <span className="font-semibold text-blue-700">{keyword}</span></div>
        {results.length === 0 ? (
          <div className="text-gray-500">No matching pages found.</div>
        ) : (
          <ul className="space-y-3">
            {results.map(page => (
              <li key={page.path}>
                <Link href={page.path} className="block p-4 border rounded hover:bg-blue-50">
                  <div className="font-semibold text-lg text-blue-700">{page.title}</div>
                  <div className="text-sm text-gray-500">{page.path}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 