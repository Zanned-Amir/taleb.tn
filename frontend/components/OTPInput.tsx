"use client";

import { useRef, useState } from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function OTPInput({ value, onChange, error }: OTPInputProps) {
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, digit: string) => {
    // Only allow digits
    const cleanDigit = digit.replace(/\D/g, "");

    if (cleanDigit.length > 1) {
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanDigit;
    setOtpDigits(newDigits);

    // Update form value
    const fullOtp = newDigits.join("");
    onChange(fullOtp);

    // Move to next input if filled
    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      } else if (e.key === "Backspace") {
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
        onChange(newDigits.join(""));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData.length > 0) {
      const newDigits = pastedData
        .split("")
        .concat(Array(6 - pastedData.length).fill(""));
      setOtpDigits(newDigits);
      onChange(newDigits.join(""));

      // Focus last filled input
      const lastFilledIndex = Math.min(pastedData.length - 1, 5);
      otpInputRefs.current[lastFilledIndex]?.focus();
    }
  };

  return (
    <div>
      {/* 6 OTP Input Fields */}
      <div className="flex gap-2 justify-between mb-4">
        {otpDigits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              otpInputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            autoComplete="one-time-code"
            className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none transition text-black"
            style={{ color: "#000000" }}
          />
        ))}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
