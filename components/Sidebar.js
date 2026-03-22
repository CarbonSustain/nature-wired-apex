import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import { clearGoogleUser } from '../utils/googleAuth';
import { clearBackendAuth } from '../utils/backendAuth';

const PAGES = [
  { path: '/admin/dashboard', title: 'Dashboard' },
  { path: '/admin/create', title: 'Create Campaign' },
  { path: '/admin/active', title: 'Campaigns' },
  // { path: '/admin/voting', title: 'Voting Management' },
  // { path: '/admin/pending', title: 'Pending Votes' },
  { path: '/admin/export', title: 'Export Data' },
  { path: '/admin/recommended-projects', title: 'Recommended Projects' },
  { path: '/admin/launch-voting-campaign', title: 'Launch Voting Campaign' },
  { path: '/admin/approved-campaigns', title: 'Approved Campaigns' },
  { path: '/admin/rewards', title: 'Rewards' },
  { path: '/admin/funding-milestones', title: 'Funding Milestones' },
  { path: '/', title: 'Home' },
];

export default function Sidebar() {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const filtered = search.trim()
    ? PAGES.filter(
        p =>
          p.title.toLowerCase().includes(search.trim().toLowerCase()) ||
          p.path.toLowerCase().includes(search.trim().toLowerCase())
      )
    : [];

  const handleInput = (e) => {
    setSearch(e.target.value);
    setShowDropdown(!!e.target.value);
  };

  const handleSelect = (path) => {
    setShowDropdown(false);
    setSearch('');
    router.push(path);
  };

  const handleSignOut = async () => {
    // Clear Google user data from localStorage
    clearGoogleUser();
    // Clear backend authentication data
    clearBackendAuth();
    await signOut({ callbackUrl: '/auth/signin' });
  };

  return (
    <nav className="w-64 bg-gray-800 text-white h-screen fixed">
      <div className="p-4 font-bold text-lg">Nature Backers Admin</div>
      
      {/* User Info */}
      {session && (
        <div className="px-4 mb-4 pb-4 border-b border-gray-700">
          <div className="text-sm text-gray-300 mb-1">Signed in as:</div>
          <div className="text-sm font-medium truncate">{session.user?.email}</div>
        </div>
      )}
      
      <div className="px-4 mb-4 relative">
        <input
          type="text"
          value={search}
          onChange={handleInput}
          onFocus={() => setShowDropdown(!!search)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Search projects..."
          className="w-full p-2 rounded bg-gray-700 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {showDropdown && filtered.length > 0 && (
          <ul className="absolute left-0 right-0 bg-white text-gray-900 rounded shadow z-20 mt-1 max-h-60 overflow-auto border">
            {filtered.map(page => (
              <li
                key={page.path}
                className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                onMouseDown={() => handleSelect(page.path)}
              >
                <span className="font-semibold text-blue-700">{page.title}</span>
                <span className="ml-2 text-xs text-gray-500">{page.path}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ul className="space-y-2 mt-4">
        <li><Link href="/admin/dashboard" className="block p-2 hover:bg-gray-700 rounded">Dashboard</Link></li>
        <li><Link href="/admin/create" className="block p-2 hover:bg-gray-700 rounded">Create Campaign</Link></li>
        <li><Link href="/admin/active" className="block p-2 hover:bg-gray-700 rounded">Campaigns</Link></li>
        {/* <li><Link href="/admin/voting" className="block p-2 hover:bg-gray-700 rounded">Voting Management</Link></li>
        <li><Link href="/admin/pending" className="block p-2 hover:bg-gray-700 rounded">Pending Votes</Link></li> */}
        <li><Link href="/admin/export" className="block p-2 hover:bg-gray-700 rounded">Export Data</Link></li>
        <li><Link href="/admin/approved-campaigns" className="block p-2 hover:bg-gray-700 rounded">Approved Campaigns</Link></li>
        <li><Link href="/admin/rewards" className="block p-2 hover:bg-gray-700 rounded">Rewards</Link></li>
        <li><Link href="/admin/funding-milestones" className="block p-2 hover:bg-gray-700 rounded">Funding Milestones</Link></li>
      </ul>
      
      {/* Sign Out Button */}
      {session && (
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleSignOut}
            className="w-full p-2 text-left text-red-400 hover:bg-gray-700 rounded hover:text-red-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}