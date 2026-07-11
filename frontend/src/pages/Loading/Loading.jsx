import React from "react";
import { RiLoader2Line } from "@remixicon/react";

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <RiLoader2Line className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <p className="text-lg text-gray-600 dark:text-gray-300">Loading…</p>
    </div>
  );
}

export default Loading;
