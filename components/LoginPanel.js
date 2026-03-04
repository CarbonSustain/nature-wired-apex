// components/LoginPanel.js
import { useState } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'

export default function LoginPanel() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

const handleLogin = async (e) => {
  e.preventDefault();
  localStorage.setItem('userRole', 'admin');
  // Fetch campaign statuses after login
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_NATUREWIRED_API}/campaign-status`);
    const data = await res.json();
    localStorage.setItem('campaignStatuses', JSON.stringify(data.data || []));
  } catch (err) {
    // Optionally handle error (fallback, etc.)
    console.error('Failed to fetch campaign statuses:', err);
  }
  router.push('/admin/dashboard');
}



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-80">
        {/* ✅ Nature Backers Logo */}
        <div className="flex justify-center mb-6">
          <Image
  src="/naturewired-logo.png"
  alt="Nature Backers Logo"
  width={240} 
  height={80} 
/>

        </div>

        <h2 className="text-xl font-bold mb-4 text-center">Admin Login</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  )
}
