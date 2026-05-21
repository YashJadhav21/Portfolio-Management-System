"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="text-center p-8 glass-card rounded-2xl max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-6">
          {error?.message || "An unexpected error occurred while loading the page."}
        </p>
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
