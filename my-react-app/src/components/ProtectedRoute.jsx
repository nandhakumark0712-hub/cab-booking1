import React from "react";
import { Navigate } from "react-router-dom";

// Maps each role to its correct home dashboard
const ROLE_DASHBOARD = {
    driver: "/driver/dashboard",
    admin: "/admin/dashboard",
    rider: "/rider/dashboard",
};

/**
 * ProtectedRoute
 * - If NOT logged in (no token) → redirect to "/" (login page)
 * - If logged in but WRONG role for this route → redirect to the user's correct dashboard
 * - If logged in with the CORRECT role → render children as-is (stays on current page on refresh)
 */
function ProtectedRoute({ allowedRole, children }) {
    const token = sessionStorage.getItem("authToken");
    const role = sessionStorage.getItem("role");

    // Not logged in at all
    if (!token || !role) {
        return <Navigate to="/" replace />;
    }

    // Logged in but this route requires a different role → send to login
    if (role !== allowedRole) {
        return <Navigate to="/" replace />;
    }

    // Correct role — render the page normally
    return children;
}

export default ProtectedRoute;
