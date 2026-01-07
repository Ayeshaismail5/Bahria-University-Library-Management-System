import { Navigate } from "react-router-dom";
import { authService } from "@/services/auth.service";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "admin" | "student";
}

const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const user = authService.getCurrentUser();

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wrong role - redirect to appropriate dashboard
  if (user.role !== allowedRole) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  // Authorized - render the component
  return <>{children}</>;
};

export default ProtectedRoute;
