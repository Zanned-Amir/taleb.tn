"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type EntityType = "cat" | "panda";

export default function Home() {
  const t = useTranslations("LoginPage");
  const router = useRouter();
  const [entityType, setEntityType] = useState<EntityType>("cat");
  const [catX, setCatX] = useState(100);
  const [catY, setCatY] = useState(200);
  const [catDir, setCatDir] = useState(1); // 1 = right, -1 = left
  const [catLeave, setCatLeave] = useState(false);
  const [isWalking, setIsWalking] = useState(true);
  const [pettedPos, setPettedPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [currentQuote, setCurrentQuote] = useState<string | null>(null);
  const [isPermanentlyGone, setIsPermanentlyGone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Position cat at bottom on mount
  useEffect(() => {
    setCatY(window.innerHeight - 100);
  }, []);

  const quotes = [
    "You got this! 💪",
    "Every small step counts!",
    "Your effort will pay off! 🌟",
    "Focus on progress, not perfection!",
    "You're stronger than you think!",
    "Keep pushing forward! 🚀",
    "Believe in yourself! 💖",
    "Hard work brings results!",
    "You are capable of amazing things!",
    "One day at a time, you'll succeed!",
    "Your future self will thank you!",
    "Never give up on your dreams! ✨",
    "You are worthy of success!",
    "Learn something new today!",
    "Every failure is a lesson! 📚",
    "You've overcome hard things before!",
    "Your potential is unlimited!",
    "Stay positive, stay strong! 🌈",
    "Take it one chapter at a time!",
    "You deserve happiness and success!",
  ];

  // Cat walking animation
  useEffect(() => {
    if (catLeave) return;

    const interval = setInterval(() => {
      setCatX((prev) => {
        let newX = prev + catDir * 3;

        // Turn around at edges
        if (newX > window.innerWidth - 100) {
          setCatDir(-1);
          return prev;
        }
        if (newX < 50) {
          setCatDir(1);
          return prev;
        }
        return newX;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [catDir, catLeave]);

  // Cat occasionally stops and shows quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setIsWalking((prev) => !prev);

      // Show quote when stopping
      if (Math.random() > 0.5) {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setCurrentQuote(randomQuote);

        setTimeout(() => {
          setCurrentQuote(null);
        }, 3000);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handlePetCat = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setPettedPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Cat leaves after being petted
    setTimeout(() => {
      setCatLeave(true);
    }, 800);

    // Cat stays gone permanently
    setTimeout(() => {
      setPettedPos(null);
      setIsPermanentlyGone(true);
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-black font-sans overflow-hidden relative"
    >
      {/* Main Content */}
      <div className="text-center z-10">
        <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-2">
          {t("welcome")}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Ready to study? Pet the companion and start learning! 📚
        </p>

        {/* Start Session Button */}
        <button
          onClick={() => router.push("/matching")}
          className="mb-8 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300"
        >
          Find Study Partner 🚀
        </button>

        {/* Entity Selection Buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={() => {
              setEntityType("cat");
              setCatLeave(false);
              setCatX(100);
            }}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              entityType === "cat"
                ? "bg-orange-400 text-white shadow-lg scale-110"
                : "bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-white hover:scale-105"
            }`}
          >
            🐱 Cat
          </button>
          <button
            onClick={() => {
              setEntityType("panda");
              setCatLeave(false);
              setCatX(100);
            }}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${
              entityType === "panda"
                ? "bg-gray-700 text-white shadow-lg scale-110"
                : "bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-white hover:scale-105"
            }`}
          >
            🐼 Panda
          </button>
        </div>
      </div>

      {/* 2D Cat Character */}
      {!isPermanentlyGone && (
        <div
          className={`fixed transition-all duration-300 ${catLeave ? "opacity-0 -translate-y-96" : "opacity-100"}`}
          style={{
            left: `${catX}px`,
            top: `${catY}px`,
            transform: `${catLeave ? "translateY(-400px)" : ""}`,
          }}
          onClick={handlePetCat}
        >
          {/* Speech Bubble with Quote */}
          {currentQuote && !catLeave && (
            <div
              className="absolute -top-20 left-1/2 transform -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2"
              style={{
                animation: "popIn 0.3s ease-out",
              }}
            >
              {/* Speech Bubble */}
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-2 border-4 border-purple-400 dark:border-purple-500 shadow-lg whitespace-nowrap text-sm font-bold text-gray-800 dark:text-white"
                style={{
                  boxShadow:
                    "0 0 20px rgba(168, 85, 247, 0.4), 4px 4px 0 rgba(168, 85, 247, 0.3)",
                }}
              >
                {currentQuote}
              </div>
              {/* Bubble Tail */}
              <div className="absolute left-1/2 transform -translate-x-1/2 top-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-purple-400 dark:border-t-purple-500"></div>
              </div>
            </div>
          )}

          {/* Sprite-based Cat or Panda */}
          {entityType === "cat" && (
            <div
              className="text-6xl cursor-pointer hover:scale-110 transition-transform drop-shadow-lg"
              style={{
                transform: catDir === -1 ? "scaleX(-1)" : "",
              }}
            >
              🐱
            </div>
          )}

          {entityType === "panda" && (
            <div
              className="text-6xl cursor-pointer hover:scale-110 transition-transform drop-shadow-lg"
              style={{
                transform: catDir === -1 ? "scaleX(-1)" : "",
              }}
            >
              🐼
            </div>
          )}
        </div>
      )}

      {/* Pet Effect - Heart particles */}
      {pettedPos && (
        <>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="fixed pointer-events-none animate-ping"
              style={{
                left: `${pettedPos.x}px`,
                top: `${pettedPos.y}px`,
                animation: `float${i} 1s ease-out forwards`,
              }}
            >
              💕
            </div>
          ))}

          <style>{`
            @keyframes float0 {
              0% { opacity: 1; transform: translate(0, 0) scale(1); }
              100% { opacity: 0; transform: translate(15px, -30px) scale(0.5); }
            }
            @keyframes float1 {
              0% { opacity: 1; transform: translate(0, 0) scale(1); }
              100% { opacity: 0; transform: translate(-15px, -30px) scale(0.5); }
            }
            @keyframes float2 {
              0% { opacity: 1; transform: translate(0, 0) scale(1); }
              100% { opacity: 0; transform: translate(25px, -20px) scale(0.5); }
            }
            @keyframes float3 {
              0% { opacity: 1; transform: translate(0, 0) scale(1); }
              100% { opacity: 0; transform: translate(-25px, -20px) scale(0.5); }
            }
            @keyframes float4 {
              0% { opacity: 1; transform: translate(0, 0) scale(1); }
              100% { opacity: 0; transform: translate(0, -40px) scale(0.5); }
            }
            @keyframes popIn {
              0% {
                opacity: 0;
                transform: translate(-50%, 10px) scale(0.8);
              }
              100% {
                opacity: 1;
                transform: translate(-50%, 0) scale(1);
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
