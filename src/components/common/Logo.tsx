import React from "react";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({
  variant = "full",
  className = "",
  width,
  height,
}) => {
  if (variant === "icon") {
    return (
      <div
        className={`flex items-center justify-center bg-brand-500 rounded-lg ${className}`}
        style={{ width: width || 32, height: height || 32 }}
      >
        <span className="text-white font-bold text-xl leading-none">K</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex items-center justify-center bg-brand-500 rounded-lg"
        style={{ width: 32, height: 32 }}
      >
        <span className="text-white font-bold text-xl leading-none">K</span>
      </div>
      <div className="flex flex-col">
        <span className="text-gray-900 dark:text-white font-bold text-lg leading-tight tracking-tight">
          Kantuta
        </span>
        <span className="text-brand-500 font-medium text-xs leading-none tracking-widest uppercase">
          POS System
        </span>
      </div>
    </div>
  );
};

export default Logo;
