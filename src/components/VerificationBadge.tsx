import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Props {
  verified?: boolean | string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const VerificationBadge = ({ verified, size = "md", className = "" }: Props) => {
  if (verified !== "verified" && verified !== "ativo" && verified !== true) return null;

  const sizeClasses = {
    xs: "h-2.5 w-2.5",
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center ${className}`}>
            <BadgeCheck className={`${sizeClasses[size]} text-blue-500`} fill="currentColor" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Profissional Verificado pela SakaServ</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
