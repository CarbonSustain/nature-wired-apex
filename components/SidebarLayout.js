import Sidebar from './Sidebar';
import ProtectedRoute from './ProtectedRoute';

export default function SidebarLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="flex">
        <Sidebar />
        <main className="ml-64 w-full min-h-screen bg-gray-50">{children}</main>
      </div>
    </ProtectedRoute>
  );
}