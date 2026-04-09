import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  suffix?: string;
  invertColors?: boolean;
  index?: number;
}

export function KpiCard({ title, value, change, icon: Icon, suffix, invertColors, index = 0 }: KpiCardProps) {
  const isPositive = invertColors ? change < 0 : change > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="bg-card border-border hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div className={cn(
              "flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5",
              isPositive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
            )}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change)}%
            </div>
          </div>
          <div className="text-2xl font-heading font-bold text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{title}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
