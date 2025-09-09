interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: "primary" | "accent" | "destructive" | "emerald";
  subtitle?: string;
}

export default function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "primary":
        return "bg-primary/20 text-primary";
      case "accent":
        return "bg-accent/20 text-accent";
      case "destructive":
        return "bg-destructive/20 text-destructive";
      case "emerald":
        return "bg-emerald-500/20 text-emerald-500";
      default:
        return "bg-primary/20 text-primary";
    }
  };

  return (
    <div className="stat-card rounded-lg p-6" data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm" data-testid={`text-stat-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${getColorClasses(color)} rounded-lg flex items-center justify-center`}>
          <i className={`${icon}`}></i>
        </div>
      </div>
    </div>
  );
}
