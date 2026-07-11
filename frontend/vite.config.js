import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          map: ["leaflet", "react-leaflet", "react-leaflet-cluster"],
          ui: ["framer-motion", "@remixicon/react", "emoji-picker-react"],
        },
      },
    },
  },
});
