"use client";

import { useState } from "react";
import { VideoGrid } from "@/components/study-room/VideoGrid";
import { ChatPanel } from "@/components/study-room/ChatPanel";
import { Whiteboard } from "@/components/study-room/Whiteboard";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PhoneOff, Layout } from "lucide-react";

export default function StudyRoom() {
  const t = useTranslations();
  const router = useRouter();
  const [showWhiteboard, setShowWhiteboard] = useState(true);

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this study session?")) {
      router.push("/");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Study Room</h1>

        {/* Header Controls */}
        <div className="flex items-center gap-3">
          {/* Whiteboard Toggle Button ( disabled for now) */}
          <button
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            className="flex dis items-center hidden gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
            title={showWhiteboard ? "Hide Whiteboard" : "Show Whiteboard"}
          >
            <Layout size={20} />
            {showWhiteboard ? "Hide" : "Show"} Whiteboard
          </button>

          {/* End Session Button */}
          <button
            onClick={handleEndSession}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition font-semibold"
            title="End Study Session"
          >
            <PhoneOff size={20} />
            End Session
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          {/* Main Content - Videos and Whiteboard */}
          <div className="lg:col-span-3 flex flex-col space-y-4 overflow-y-auto max-h-full">
            {/* Video Grid */}
            <div className="flex-shrink-0">
              <VideoGrid />
            </div>

            {/* Whiteboard - Conditional Rendering */}
            {false && (
              <div className="flex-shrink-0">
                <Whiteboard />
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="h-full overflow-hidden">
            <ChatPanel />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 bg-gray-900 text-center">
        <p className="text-sm text-gray-400">
          Powered by{" "}
          <a
            href="https://meninx.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            Meninx
          </a>
        </p>
      </div>
    </div>
  );
}
