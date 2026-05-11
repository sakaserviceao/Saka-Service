import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Props {
  verified?: boolean | string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const VerificationBadge = ({ verified, size = "md", className = "" }: Props) => {
  if (verified !== "verified" && verified !== "ativo" && verified !== true) return null;

  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`inline-flex items-center ${className}`}>
          <svg 
            viewBox="0 0 24 24" 
            className={`${sizeClasses[size]} text-[#0095F6]`}
            style={{ color: "#1D9BF0" }} // Primary verified blue color
          >
            <path 
              fill="currentColor" 
              d="M12,22.2c-0.3,0-0.6-0.1-0.8-0.2L8.2,20c-0.2-0.1-0.4-0.1-0.6-0.1l-3.4-0.2c-0.6,0-1.1-0.5-1.1-1.1l-0.2-3.4 c0-0.2-0.1-0.4-0.1-0.6l-2-3.1c-0.3-0.5-0.3-1.1,0-1.6l2-3.1c0.1-0.2,0.1-0.4,0.1-0.6l0.2-3.4c0-0.6,0.5-1.1,1.1-1.1l3.4-0.2 c0.2,0,0.4-0.1,0.6-0.1l3.1-2c0.5-0.3,1.1-0.3,1.6,0l3.1,2c0.2,0.1,0.4,0.1,0.6,0.1l3.4,0.2c0.6,0,1.1,0.5,1.1,1.1l0.2,3.4 c0,0.2,0.1,0.4,0.1,0.6l2,3.1c0.3,0.5,0.3,1.1,0,1.6l-2,3.1c-0.1,0.2-0.1,0.4-0.1,0.6l-0.2,3.4c0,0.6-0.5,1.1-1.1,1.1l-3.4,0.2 c-0.2,0-0.4,0.1-0.6,0.1l-3.1,2C12.6,22.1,12.3,22.2,12,22.2z"
            />
            <path 
              fill="white" 
              d="M10.6,15.6c-0.2,0-0.5-0.1-0.7-0.3l-2.6-2.6c-0.4-0.4-0.4-1,0-1.4c0.4-0.4,1-0.4,1.4,0l1.9,1.9l4.5-4.5 c0.4-0.4,1-0.4,1.4,0c0.4,0.4,0.4,1,0,1.4l-5.2,5.2C11.1,15.5,10.9,15.6,10.6,15.6z"
            />
          </svg>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Profissional Verificado pela SakaServ</p>
      </TooltipContent>
    </Tooltip>
  );
};
