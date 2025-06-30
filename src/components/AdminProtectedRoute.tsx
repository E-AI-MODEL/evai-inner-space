import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function AdminProtectedRoute() {
  const { isAdminAuthorized, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">Toegang controleren...</div>;
  }

  return isAdminAuthorized ? <Outlet /> : <Navigate to="/access-denied" replace />;
}
