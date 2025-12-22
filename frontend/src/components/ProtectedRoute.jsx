// src/components/ProtectedRoute.jsx
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useMoodMap from '../state/store';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useMoodMap();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}