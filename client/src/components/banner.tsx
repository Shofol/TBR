import { useQuery } from "@tanstack/react-query";
import { BannerSettings } from "@shared/schema";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export default function Banner() {
  const [isDismissed, setIsDismissed] = useState(false);
  
  const { data: bannerSettings } = useQuery<BannerSettings | null>({
    queryKey: ["/api/banner-settings"],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Don't show if dismissed or no active banner
  if (isDismissed || !bannerSettings || !bannerSettings.message?.trim()) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div 
      className="relative w-full py-3 px-4 text-center font-medium shadow-lg z-50"
      style={{ 
        backgroundColor: bannerSettings.backgroundColor,
        color: bannerSettings.textColor 
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center relative">
        <div className="flex items-center justify-center space-x-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm md:text-base">
            {bannerSettings.message}
          </span>
        </div>
        
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute right-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}