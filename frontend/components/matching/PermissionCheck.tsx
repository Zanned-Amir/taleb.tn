"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, Video, Check, X, Eye, EyeOff, Volume2 } from "lucide-react";

interface PermissionCheckProps {
  onContinue: () => void;
  onCancel: () => void;
}

export default function PermissionCheck({
  onContinue,
  onCancel,
}: PermissionCheckProps) {
  const [cameraStatus, setCameraStatus] = useState<
    "checking" | "allowed" | "denied"
  >("checking");
  const [micStatus, setMicStatus] = useState<"checking" | "allowed" | "denied">(
    "checking",
  );
  const [allPermissionsGranted, setAllPermissionsGranted] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [testingMicrophone, setTestingMicrophone] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check camera permission by enumerating devices
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasCamera = devices.some(
            (device) => device.kind === "videoinput",
          );
          setCameraStatus(hasCamera ? "allowed" : "denied");
        } catch (error) {
          console.error("Camera check error:", error);
          setCameraStatus("denied");
        }

        // Check microphone permission by enumerating devices
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasMic = devices.some((device) => device.kind === "audioinput");
          setMicStatus(hasMic ? "allowed" : "denied");
        } catch (error) {
          console.error("Microphone check error:", error);
          setMicStatus("denied");
        }
      } catch (error) {
        console.error("Permission check error:", error);
        setCameraStatus("denied");
        setMicStatus("denied");
      }
    };

    checkPermissions();
  }, []);

  useEffect(() => {
    if (cameraStatus !== "checking" && micStatus !== "checking") {
      const granted = cameraStatus === "allowed" && micStatus === "allowed";
      setAllPermissionsGranted(granted);
    }
  }, [cameraStatus, micStatus]);

  const handleVideoPreviewToggle = async () => {
    if (showVideoPreview) {
      // Stop video preview
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setShowVideoPreview(false);
      setPreviewError(null);
    } else {
      // Start video preview
      try {
        setPreviewError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        streamRef.current = stream;
        setShowVideoPreview(true);

        // Use a small timeout to ensure state updates before setting srcObject
        setTimeout(() => {
          if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch((err) => {
              console.error("Error playing video:", err);
              setPreviewError("Failed to play video. Please try again.");
            });
          }
        }, 50);
      } catch (error: any) {
        console.error("Error accessing camera for preview:", error);
        let errorMsg = "Unable to access camera. ";
        if (error.name === "NotAllowedError") {
          errorMsg += "Please grant camera permissions.";
        } else if (error.name === "NotFoundError") {
          errorMsg += "No camera device found.";
        } else if (error.name === "NotReadableError") {
          errorMsg += "Camera is already in use.";
        } else {
          errorMsg += error.message;
        }
        setPreviewError(errorMsg);
      }
    }
  };

  const handleMicrophoneTest = async () => {
    if (testingMicrophone) {
      // Stop microphone test
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      setTestingMicrophone(false);
      setMicLevel(0);
      setIsSpeaking(false);
      setMicError(null);
    } else {
      // Start microphone test
      try {
        setMicError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
          },
          video: false,
        });

        micStreamRef.current = stream;

        // Create AudioContext with proper typing
        const AudioContextConstructor =
          window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextConstructor) {
          throw new Error("AudioContext is not supported in this browser");
        }

        const audioContext = new AudioContextConstructor();

        // Resume audio context if suspended (required in modern browsers)
        if (audioContext.state === "suspended") {
          await audioContext.resume();
        }

        audioContextRef.current = audioContext;

        // Create analyser
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        // Create microphone source and connect to analyser
        try {
          const microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(analyser);
        } catch (sourceError: any) {
          console.error("Error creating media stream source:", sourceError);
          throw new Error("Failed to connect microphone to audio system");
        }

        setTestingMicrophone(true);

        // Analyze audio levels
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          const level = Math.min(100, (average / 256) * 100 * 3); // Scale to 0-100
          setMicLevel(level);

          // Detect if user is speaking (threshold of 20%)
          setIsSpeaking(level > 20);

          animationFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (error: any) {
        console.error("Error accessing microphone:", error);
        let errorMsg = "Unable to access microphone. ";
        if (error.name === "NotAllowedError") {
          errorMsg += "Please grant microphone permissions.";
        } else if (error.name === "NotFoundError") {
          errorMsg += "No microphone device found.";
        } else if (error.name === "NotReadableError") {
          errorMsg += "Microphone is already in use.";
        } else {
          errorMsg += error.message;
        }
        setMicError(errorMsg);

        // Cleanup on error
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
        }
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-linear-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center z-50">
      <div className="text-center w-full max-w-2xl px-4">
        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Verify Your Setup
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Let's make sure your camera and microphone are ready
        </p>

        {/* Video Preview */}
        {cameraStatus === "allowed" && (
          <div className="mb-8">
            {showVideoPreview ? (
              <div className="bg-black rounded-xl overflow-hidden shadow-lg mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full block bg-black"
                  style={{ minHeight: "250px", maxHeight: "400px" }}
                />
              </div>
            ) : (
              <div className="bg-gray-300 dark:bg-gray-700 rounded-xl h-64 flex items-center justify-center mb-4 shadow-lg">
                <p className="text-gray-600 dark:text-gray-400">
                  Click "Test Camera" to see your video preview
                </p>
              </div>
            )}

            {/* Error message */}
            {previewError && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {previewError}
                </p>
              </div>
            )}

            <button
              onClick={handleVideoPreviewToggle}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300"
            >
              {showVideoPreview ? (
                <>
                  <EyeOff size={20} />
                  Stop Preview
                </>
              ) : (
                <>
                  <Eye size={20} />
                  Test Camera
                </>
              )}
            </button>
          </div>
        )}

        {/* Microphone Test */}
        {micStatus === "allowed" && (
          <div className="mb-8">
            {testingMicrophone ? (
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-6 h-6 text-white animate-pulse" />
                    <p className="text-white font-semibold">
                      Microphone Testing
                    </p>

                    {/* Speaking Indicator */}
                    {isSpeaking && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-300 text-xs font-semibold">
                          Detecting voice...
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-white text-sm font-semibold">
                    {Math.round(micLevel)}%
                  </div>
                </div>

                {/* Speaking Badge */}
                {isSpeaking && (
                  <div className="mb-4 inline-block bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    🎤 You are speaking
                  </div>
                )}
                {/* Audio Level Bars */}
                <div className="space-y-2">
                  {/* Level bar */}
                  <div className="h-2 bg-blue-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-blue-300 transition-all duration-100"
                      style={{ width: `${micLevel}%` }}
                    ></div>
                  </div>

                  {/* Visual feedback dots */}
                  <div className="flex gap-1 h-8 items-center">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded transition-all duration-100 ${
                          i < micLevel / 10
                            ? "bg-green-400 h-full"
                            : "bg-blue-900 h-2"
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>

                <p className="text-blue-100 text-sm mt-4">
                  💬 Speak now to test your microphone
                </p>
              </div>
            ) : (
              <div className="bg-gray-300 dark:bg-gray-700 rounded-xl p-6 flex items-center justify-center mb-4 shadow-lg">
                <p className="text-gray-600 dark:text-gray-400">
                  Click "Test Microphone" to check your audio
                </p>
              </div>
            )}

            {/* Error message */}
            {micError && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {micError}
                </p>
              </div>
            )}

            <button
              onClick={handleMicrophoneTest}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 relative"
            >
              {testingMicrophone ? (
                <>
                  <div className="relative">
                    <Mic
                      size={20}
                      className={isSpeaking ? "animate-pulse" : ""}
                    />

                    {/* Speaking indicator ring around mic */}
                    {isSpeaking && (
                      <>
                        <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-green-400"></div>
                      </>
                    )}
                  </div>
                  <span
                    className={isSpeaking ? "text-green-300 font-bold" : ""}
                  >
                    {isSpeaking ? "Speaking..." : "Stop Testing"}
                  </span>
                </>
              ) : (
                <>
                  <Mic size={20} />
                  Test Microphone
                </>
              )}
            </button>
          </div>
        )}

        {/* Permission Checks */}
        <div className="space-y-4 mb-8">
          {/* Camera Check */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-4">
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Video size={20} className="text-blue-600 dark:text-blue-400" />
                Camera
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {cameraStatus === "checking"
                  ? "Checking..."
                  : cameraStatus === "allowed"
                    ? "Ready"
                    : "Not available"}
              </p>
            </div>
            <div>
              {cameraStatus === "checking" && (
                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
              {cameraStatus === "allowed" && (
                <Check size={24} className="text-green-500" />
              )}
              {cameraStatus === "denied" && (
                <X size={24} className="text-red-500" />
              )}
            </div>
          </div>

          {/* Microphone Check */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center gap-4">
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Mic size={20} className="text-blue-600 dark:text-blue-400" />
                Microphone
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {micStatus === "checking"
                  ? "Checking..."
                  : micStatus === "allowed"
                    ? "Ready"
                    : "Not available"}
              </p>
            </div>
            <div>
              {micStatus === "checking" && (
                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
              {micStatus === "allowed" && (
                <Check size={24} className="text-green-500" />
              )}
              {micStatus === "denied" && (
                <X size={24} className="text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        {!allPermissionsGranted && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-8">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Please enable camera and microphone permissions in your browser
              settings to continue with the study session.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 border-2 border-gray-200 dark:border-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            disabled={
              !allPermissionsGranted ||
              cameraStatus === "checking" ||
              micStatus === "checking"
            }
            className="flex-1 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cameraStatus === "checking" || micStatus === "checking"
              ? "Checking..."
              : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
