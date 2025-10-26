"use client";

import React, { useState, useEffect } from "react";
import { Building2, Loader2 } from "lucide-react";
import api from "../../config/api";

export default function GeneralPage() {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await api.get("/users/organization");
        setOrganization(response.data.organization);
      } catch (error) {
        setError(error.response?.data?.error || "Failed to fetch organization");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-gray-600">Loading organization details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">General</h2>
          <p className="text-gray-600">Organization overview</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Organization Information
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-500">
              Organization Name
            </span>
            <span className="text-sm text-gray-900 font-semibold">
              {organization?.name || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-500">
              Organization ID
            </span>
            <span className="text-sm text-gray-900 font-mono">
              {organization?.id || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-500">Status</span>
            <span
              className={`text-sm font-medium ${
                organization?.is_active ? "text-green-600" : "text-red-600"
              }`}
            >
              {organization?.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
