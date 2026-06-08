import { useSelector } from "react-redux";
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Protects routes from unauthenticated or unauthorized access.
 * 
 * @param {string[]} allowedRoles - optional, e.g. ["teacher"] or ["student"]
 * If not provided, any logged-in user can access the route.
 */
function ProtectedRoute({ allowedRoles }) {
  const user = useSelector((state) => state.user);

  // Not logged in → redirect to login
  if (!user.loggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role → redirect to their home page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === "teacher" ? "/work" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;