// src/Component/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify"; // Import toast for user feedback

const ProtectedRoute = ({ children, user, allowedRoles, handleLogout }) => {
  // If user is not logged in, redirect to login page. This is the first layer of protection.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check if the user's role is included in the list of allowed roles for this route.
  // This is the second, more specific, layer of protection.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    toast.error("You do not have permission to access this page.");
    handleLogout(); // Log them out for security
    return <Navigate to="/" replace />;
  }

  // All checks passed, render the requested component
  return children;
};

export default ProtectedRoute;