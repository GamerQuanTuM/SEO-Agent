import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { useOnPageData } from "@/hooks/useSeoApi";

const chartConfig = {
  organic: { label: "Organic Traffic", color: "hsl(var(--chart-1))" },
  target: { label: "Target", color: "hsl(var(--chart-3))" },
};

export function TrafficTrendChart() {
  const { data } = useOnPageData();
  const { trafficTrendData = [] } = data;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Organic Traffic vs Target
        </CardTitle>
        <CardDescription>6-month traffic trend with projected targets</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[220px] w-full">
          <AreaChart data={trafficTrendData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="target" stroke="var(--color-target)" fill="var(--color-target)" fillOpacity={0.1} strokeDasharray="5 5" />
            <Area type="monotone" dataKey="organic" stroke="var(--color-organic)" fill="var(--color-organic)" fillOpacity={0.2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
