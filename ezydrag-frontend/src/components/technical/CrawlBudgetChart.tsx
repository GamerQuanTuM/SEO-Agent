import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useTechnicalData } from "@/hooks/useSeoApi";
import { AlertTriangle } from "lucide-react";

const chartConfig = {
  valuable: { label: "Valuable Crawls", color: "hsl(var(--chart-1))" },
  wasted: { label: "Wasted Crawls", color: "hsl(var(--chart-5))" },
};

export function CrawlBudgetChart() {
  const { data } = useTechnicalData();
  const { crawlTrendData, crawlBudgetStats } = data;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading">Crawl Budget Analysis</CardTitle>
            <CardDescription>7-day crawl distribution — valuable vs wasted</CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs font-medium text-destructive">{crawlBudgetStats.wastedPercent}% wasted</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart data={crawlTrendData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="day" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="valuable" fill="var(--color-valuable)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="wasted" fill="var(--color-wasted)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
        <div className="mt-4 rounded-lg bg-muted/50 border border-border p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{crawlBudgetStats.robotsTxtRules} robots.txt rules</span> recommended to block low-value paths: <code className="text-primary">/wp-admin/</code>, <code className="text-primary">/tag/</code>, <code className="text-primary">/search</code>, <code className="text-primary">/print/</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
