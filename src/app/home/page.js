"use client";

import React, { useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import AdminSidebar from "../../components/AdminSidebar";
import GeneralPage from "../../components/pages/GeneralPage";
import OnboardingPage from "../../components/pages/OnboardingPage";
import AnnouncementsPage from "../../components/pages/AnnouncementsPage";
import FeesCollectionPage from "../../components/pages/FeesCollectionPage";

export default function HomePage() {
  const [activePage, setActivePage] = useState("general");

  const renderPage = () => {
    switch (activePage) {
      case "general":
        return <GeneralPage />;
      case "onboarding":
        return <OnboardingPage />;
      case "announcements":
        return <AnnouncementsPage />;
      case "fees":
        return <FeesCollectionPage />;
      default:
        return <GeneralPage />;
    }
  };

  return (
    <ProtectedRoute>
      <AdminSidebar activePage={activePage} onPageChange={setActivePage}>
        {renderPage()}
      </AdminSidebar>
    </ProtectedRoute>
  );
}
