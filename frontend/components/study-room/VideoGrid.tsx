"use client";

import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  ScreenShare,
  Settings,
  Users,
} from "lucide-react";
import hark from "hark";

export function VideoGrid() {
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const harkRef = useRef<any>(null);

  // Initialize camera on mount
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isCameraOff
            ? false
            : {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
          audio: true,
        });
        streamRef.current = stream;
        if (videoRef.current && !isCameraOff) {
          videoRef.current.srcObject = stream;
        }
        // Apply mute state to audio tracks
        stream.getAudioTracks().forEach((track) => {
          track.enabled = !isLocalMuted;
        });
        setCameraError(null);

        // Setup voice activity detection using hark.js
        try {
          const speechEvents = hark(stream);
          harkRef.current = speechEvents;

          speechEvents.on("speaking", () => {
            if (!isLocalMuted) {
              setIsSpeaking(true);
              console.log("User is speaking");
            }
          });

          speechEvents.on("stopped_speaking", () => {
            setIsSpeaking(false);
            console.log("User stopped speaking");
          });
        } catch (audioError) {
          console.error("Voice detection setup error:", audioError);
        }
      } catch (error) {
        console.error("Camera access denied:", error);
        setCameraError("Camera access denied. Please check your permissions.");
      }
    };

    startCamera();

    return () => {
      if (harkRef.current) {
        harkRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOff, isLocalMuted]);

  // Update audio track when mute/unmute
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isLocalMuted;
      });
    }
  }, [isLocalMuted]);

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden flex flex-col h-full">
      {/* Video Grid - 2 cameras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 flex-1">
        {/* Local Camera */}
        <div
          className={`relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center group transition-all border-2 ${
            isSpeaking && !isLocalMuted
              ? "border-green-500"
              : "border-transparent"
          }`}
        >
          {isCameraOff ? (
            <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-300 font-semibold">Your Camera</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90">
                  <div className="text-center text-red-400">
                    <p className="font-semibold">Camera Error</p>
                    <p className="text-sm mt-2">{cameraError}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Camera Controls - Always Visible */}
          <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-100 transition-opacity">
            <button
              onClick={() => setIsLocalMuted(!isLocalMuted)}
              className={`p-2.5 rounded-full transition relative ${
                isLocalMuted
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
              title={isLocalMuted ? "Unmute" : "Mute"}
            >
              <div
                className={`relative border-2 rounded-full p-2 transition-all ${
                  isSpeaking && !isLocalMuted
                    ? "bg-green-500 border-green-400 text-white"
                    : "border-gray-500 text-gray-300"
                }`}
              >
                <Mic size={20} />

                {/* Speaking indicator - pulsing rings like Discord */}
                {isSpeaking && !isLocalMuted && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-green-400"></div>
                  </>
                )}
              </div>
            </button>

            <button
              onClick={() => setIsCameraOff(!isCameraOff)}
              className={`p-2.5 rounded-full transition ${
                isCameraOff
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
              title={isCameraOff ? "Turn on camera" : "Turn off camera"}
            >
              {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          </div>
        </div>

        {/* Remote Camera */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center border-2 border-gray-700">
          <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-400 font-semibold">
              Waiting for participant...
            </p>
          </div>

          {/* Name Badge */}
          <div className="absolute top-3 left-3 bg-gray-900 bg-opacity-75 px-3 py-1.5 rounded-full text-sm font-semibold text-gray-300">
            Participant
          </div>

          {/* Status Indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-xs text-yellow-500 font-medium">
              Connecting...
            </span>
          </div>
        </div>
      </div>

      {/* Interests & Action Buttons */}
      <div className="px-4 py-4 border-t border-gray-700 bg-gray-900">
        {/* Interests Section */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">
            Interests
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-900 text-blue-200 text-sm rounded-full">
              Mathematics
            </span>
            <span className="px-3 py-1 bg-purple-900 text-purple-200 text-sm rounded-full">
              Physics
            </span>
            <span className="px-3 py-1 bg-green-900 text-green-200 text-sm rounded-full">
              Programming
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
            <Users size={18} /> Add Friend
          </button>
          <button className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2">
            <span>→</span> Next
          </button>
        </div>
      </div>
    </div>
  );
}
