import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NavLinkProps extends React.HTMLAttributes<HTMLDivElement> {
  href: string;
  active?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export function NavLink({ 
  href, 
  active = false, 
  icon, 
  children, 
  className, 
  onClick,
  ...props 
}: NavLinkProps) {
  const [, setLocation] = useLocation();
  
  // Handle admin tabs differently to avoid page reload and ensure state updates correctly
  const isAdminTab = href.startsWith('/admin');
  
  const handleClick = (e: React.MouseEvent) => {
    // If there's a custom onClick handler, call it first
    if (onClick) {
      onClick(e);
    }
    
    // For admin tabs, use special handling to update URL without reloading
    if (isAdminTab) {
      e.preventDefault();
      console.log('NavLink clicked - Admin tab:', href);
      setLocation(href);
      return;
    }
  };
  
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex flex-col items-center p-2 flex-1 cursor-pointer min-w-[70px]",
          active 
            ? "text-primary" 
            : "text-gray-600 hover:text-gray-900",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {icon}
        <span className="text-xs mt-1 truncate w-full text-center">{children}</span>
      </div>
    </Link>
  );
}
