"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Users, BookOpen, Clock, Zap, Loader } from "lucide-react";
import ErrorModal from "@/components/matching/ErrorModal";
import PermissionCheck from "@/components/matching/PermissionCheck";

export default function Matching() {
  const t = useTranslations();
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [showPermissionCheck, setShowPermissionCheck] = useState(false);

  const subjects = [
    { id: "math", name: "📐 Mathematics", icon: "📐" },
    { id: "science", name: "🔬 Science", icon: "🔬" },
    { id: "language", name: "🌍 Languages", icon: "🌍" },
    { id: "programming", name: "💻 Programming", icon: "💻" },
    { id: "history", name: "📚 History", icon: "📚" },
    { id: "art", name: "🎨 Arts", icon: "🎨" },
  ];

  const durations = [
    { id: "30min", label: "30 mins", time: 30 },
    { id: "60min", label: "1 hour", time: 60 },
    { id: "90min", label: "1.5 hours", time: 90 },
    { id: "unlimited", label: "No limit", time: null },
  ];

  const handleStartSession = () => {
    // Show permission check first
    setShowPermissionCheck(true);
  };

  const handlePermissionCheckContinue = () => {
    setShowPermissionCheck(false);
    // Start matching animation
    setIsMatching(true);
    setMatchError(null);
    setMatchProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setMatchProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 30;
      });
    }, 500);

    // Simulate random failure (20% chance) or success
    const timeoutId = setTimeout(() => {
      clearInterval(interval);

      const random = Math.random();
      if (random < 0.2) {
        // 20% chance of failure
        setIsMatching(false);
        setMatchError(
          "No study partners available right now. Please try again later.",
        );
      } else {
        // 80% chance of success
        setMatchProgress(100);
        setTimeout(() => {
          const params = new URLSearchParams();
          if (selectedSubject) params.append("subject", selectedSubject);
          if (selectedDuration) params.append("duration", selectedDuration);
          router.push(`/study-room?${params.toString()}`);
        }, 500);
      }
    }, 500);
  };

  const handleRetryMatch = () => {
    setMatchError(null);
    handlePermissionCheckContinue();
  };

  // Permission Check Modal
  if (showPermissionCheck) {
    return (
      <PermissionCheck
        onContinue={handlePermissionCheckContinue}
        onCancel={() => setShowPermissionCheck(false)}
      />
    );
  }

  // Matching loader overlay
  if (isMatching) {
    return (
      <div className="fixed inset-0 bg-linear-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center z-50">
        <div className="text-center w-full max-w-lg px-4">
          {/* Spinner */}
          <div className="mb-12 flex justify-center">
            <div className="relative w-28 h-28">
              <Loader className="w-28 h-28 text-purple-600 dark:text-purple-400 animate-spin" />
            </div>
          </div>

          {/* Progress Bar - Centered and Full Width */}
          <div className="w-full mx-auto px-8 mb-10">
            <div className="w-full h-3 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${matchProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Status Messages */}
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Finding Your Study Partner...
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12 h-16 flex items-center justify-center">
            {matchProgress < 33
              ? "🔍 Searching for available students..."
              : matchProgress < 66
                ? "👥 Checking compatibility..."
                : matchProgress < 90
                  ? "⚡ Preparing study room..."
                  : "✅ Almost there..."}
          </p>

          {/* Tips */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p className="font-semibold mb-4">💡 Tips while waiting:</p>
            <ul className="list-disc list-inside space-y-2 text-left inline-block">
              <li>Keep your camera and microphone ready</li>
              <li>Have your learning materials nearby</li>
              <li>Check your internet connection</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (matchError) {
    return (
      <ErrorModal
        message={matchError}
        onRetry={handleRetryMatch}
        onBack={() => {
          setMatchError(null);
          setIsMatching(false);
        }}
      />
    );
  }

  const isReady = selectedSubject && selectedDuration;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black">
      {/* Header */}
      <div className="text-center pt-12 px-4">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-4">
          Find Your Study Partner
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Choose a subject and session duration to get started
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Subjects Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Select a Subject
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`p-4 rounded-xl transition-all duration-300 font-semibold ${
                  selectedSubject === subject.id
                    ? "bg-linear-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:shadow-md hover:scale-102"
                } border-2 ${
                  selectedSubject === subject.id
                    ? "border-purple-600"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="text-3xl mb-2">{subject.icon}</div>
                <div className="text-sm">{subject.name.split(" ")[1]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Session Duration
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {durations.map((duration) => (
              <button
                key={duration.id}
                onClick={() => setSelectedDuration(duration.id)}
                className={`p-4 rounded-xl transition-all duration-300 font-semibold ${
                  selectedDuration === duration.id
                    ? "bg-linear-to-br from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                    : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:shadow-md"
                } border-2 ${
                  selectedDuration === duration.id
                    ? "border-blue-600"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="text-2xl mb-2">⏱️</div>
                <div className="text-sm">{duration.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Active Users
            </p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              2,456
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <Zap className="w-8 h-8 text-yellow-500 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sessions Today
            </p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              847
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Avg. Session
            </p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">
              45 min
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleStartSession}
            disabled={!isReady}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
              isReady
                ? "bg-linear-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-105 cursor-pointer"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }`}
          >
            Start Study Session 🚀
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:shadow-lg transition-all duration-300 border-2 border-gray-200 dark:border-gray-700"
          >
            Back Home
          </button>
        </div>
      </div>
    </div>
  );
}
