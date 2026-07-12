import React from "react";
import MapScreen from "../Map/Map";
import { useAuth } from "../../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="w-full h-[calc(100vh-57px)] p-2 md:p-6 bg-muted/20">
      <div className="w-full h-full rounded shadow-xl overflow-hidden border border-border bg-card">
        <MapScreen />
      </div>
    </div>
  );
}

export default Dashboard;
