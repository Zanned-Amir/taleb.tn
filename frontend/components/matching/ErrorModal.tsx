"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorModalProps {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}

export default function ErrorModal({
  message,
  onRetry,
  onBack,
}: ErrorModalProps) {
  return (
    <div className="fixed inset-0 bg-linear-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center z-50">
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
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          Oops! Something went wrong
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          {message}
        </p>

        {/* Error Details */}
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-8">
          <p className="text-sm text-red-800 dark:text-red-200">
            💡 Try the following:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-left text-red-700 dark:text-red-300 text-sm">
            <li>Select a different subject</li>
            <li>Try a different session duration</li>
            <li>Wait a few minutes and try again</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300"
          >
            <RotateCcw size={20} />
            Try Again
          </button>
          <button
            onClick={onBack}
            className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-gray-200 dark:border-gray-700"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
