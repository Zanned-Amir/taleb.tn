import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  showBorder?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  className?: string;
}

export function Logo({
  src = "/logo.png",
  alt = "Logo",
  size = "md",
  showBorder = true,
  borderColor = "border-white",
  backgroundColor = "bg-white",
  className,
}: LogoProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
  };

  const imageSizeClasses = {
    sm: "w-8 h-8",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-full flex items-center justify-center",
        sizeClasses[size],
        showBorder && "border-3",
        showBorder && borderColor,
        backgroundColor,
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={56}
        height={56}
        className={cn("object-contain", imageSizeClasses[size])}
      />
    </div>
  );
}
