import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Props {
  verified?: boolean | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const VerificationBadge = ({ verified, size = "md", className = "" }: Props) => {
  if (verified !== "verified" && verified !== true) return null;

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center text-blue-500 ${className}`}>
            <BadgeCheck className={`${sizeClasses[size]} text-white`} fill="currentColor" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Profissional Verificado pela SakaServ</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
