export default function LoginPage() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form className="bg-white p-8 rounded shadow-md w-80">
          <div className="mb-4">
            <input className="w-full border p-2 rounded" placeholder="Username" />
          </div>
          <div className="mb-4">
            <input className="w-full border p-2 rounded" type="password" placeholder="Password" />
          </div>
          <button className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
        </form>
      </div>
    );
  }