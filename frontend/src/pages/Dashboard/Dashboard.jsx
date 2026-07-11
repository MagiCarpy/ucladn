import React from "react";
import MapScreen from "../Map/Map";
import { useAuth } from "../../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="w-full h-[calc(100vh-3.5rem)]">
      <MapScreen />
    </div>
  );
}

export default Dashboard;
