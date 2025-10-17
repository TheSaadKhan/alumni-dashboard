"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function GradientText({ children }: React.PropsWithChildren) {
  return (
    <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

export const Glow: React.FC<{
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ color = "rgba(99,102,241,0.4)", size = "md", className }) => {
  const r = { sm: 200, md: 400, lg: 700 }[size];
  return (
    <div
      aria-hidden
      className={cn(
        "absolute -z-10 blur-3xl rounded-full pointer-events-none",
        className
      )}
      style={{
        background: `radial-gradient(circle at center, ${color}, transparent 70%)`,
        width: r,
        height: r,
      }}
    />
  );
};

export const GlassPanel = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    className={cn(
      "rounded-xl border border-white/20 bg-white/30 backdrop-blur-md shadow-md dark:bg-gray-900/50",
      className
    )}
  >
    {children}
  </motion.div>
);