import React from "react";
import { cn } from "@/lib/utils";

interface HomeBannerProps {
  id: string;
  imageUrl: string;
  linkUrl?: string;
  altText: string;
  height?: number;
  mobileHeight?: number;
  maxWidth?: number;
  className?: string;
}

const HomeBanner: React.FC<HomeBannerProps> = ({
  id,
  imageUrl,
  linkUrl = "#",
  altText,
  height = 200,
  mobileHeight = 120,
  maxWidth = 1900,
  className,
}) => {
  return (
    <div 
      className={cn(
        "container mx-auto px-4",
        className
      )}
      style={{ maxWidth: `${maxWidth}px` }}
    >
      <a 
        href={linkUrl}
        id={id}
        className="block w-full overflow-hidden rounded-xl bg-muted shadow-sm transition-opacity hover:opacity-95"
        style={{ height: "auto" }}
      >
        <picture>
          <source 
            media="(max-width: 640px)" 
            srcSet={imageUrl} 
          />
          <img
            src={imageUrl}
            alt={altText}
            loading="lazy"
            className="w-full object-cover"
            style={{ 
              height: "var(--banner-height)",
              "--banner-height": `${height}px`
            } as React.CSSProperties}
          />
        </picture>
      </a>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          #${id} img {
            height: ${mobileHeight}px !important;
          }
        }
      `}} />
    </div>
  );
};

export default HomeBanner;
