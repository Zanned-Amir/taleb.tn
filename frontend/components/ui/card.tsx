// components/ui/card.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-lg overflow-hidden", {
  variants: {
    variant: {
      default: "bg-white shadow-lg",
      gradient: "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, className }))}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
