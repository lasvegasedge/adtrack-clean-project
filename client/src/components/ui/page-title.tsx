import { ReactNode } from "react";

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function PageTitle({ title, subtitle, icon }: PageTitleProps) {
  return (
    <div className="flex items-center space-x-3">
      {icon && <div className="text-primary">{icon}</div>}
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}