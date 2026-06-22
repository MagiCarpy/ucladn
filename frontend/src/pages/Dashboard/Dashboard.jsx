import React from "react";
import MapScreen from "../Map/Map";
import { useAuth } from "../../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col w-full h-full">
      {/* WELCOME BANNER */}
      {user && (
        <div className="w-full px-6 py-4 bg-muted/40 border-b border-border text-sm">
          <span className="text-gray-800 dark:text-gray-200">
            Welcome back,{" "}
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              {user.username}
            </span>{" "}
            — ready to deliver or request something today?
          </span>
        </div>
      )}

      {!user && (
        <div className="w-full px-6 py-4 bg-muted/40 border-b border-border text-sm">
          <span className="text-gray-800 dark:text-gray-200">
            Sign in to request deliveries or help other Bruins!
          </span>
        </div>
      )}

      {/* MAP */}
      <div className="flex-grow">
        <MapScreen />
      </div>
    </div>
  );
}

export default Dashboard;
