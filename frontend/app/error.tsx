"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center">
      <div className="text-center w-full max-w-md px-4">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-28 h-28">
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle className="w-28 h-28 text-red-500 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          Oops! Something went wrong
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>

        {/* Error Details */}
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-8">
          <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
            💡 What you can do:
          </p>
          <ul className="list-disc list-inside space-y-1 text-left text-red-700 dark:text-red-300 text-sm">
            <li>Try refreshing the page</li>
            <li>Clear your browser cache</li>
            <li>Check your internet connection</li>
            <li>Try again later if the problem persists</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300"
          >
            <RotateCcw size={20} />
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-gray-200 dark:border-gray-700"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
