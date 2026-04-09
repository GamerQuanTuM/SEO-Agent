import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTechnicalData } from "@/hooks/useSeoApi";
import { Gauge, AlertCircle } from "lucide-react";

const ratingColors = {
  good: "bg-green-500/20 text-green-400 border-green-500/30",
  "needs-improvement": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  poor: "bg-red-500/20 text-red-400 border-red-500/30",
};

const ratingLabels = {
  good: "Good",
  "needs-improvement": "Needs Work",
  poor: "Poor",
};

export function CoreWebVitalsPanel() {
  const { data } = useTechnicalData();
  const coreWebVitals = data?.coreWebVitals || [];
  const passCount = coreWebVitals.filter((v: any) => v.rating === "good").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Core Web Vitals
            </CardTitle>
            <CardDescription>Google PageSpeed assessment — {passCount}/{coreWebVitals.length} passing</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {coreWebVitals.map((vital) => {
          const percent = vital.rating === "good"
            ? 100
            : vital.rating === "needs-improvement"
            ? 60
            : 30;

          return (
            <div key={vital.metric} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{vital.metric}</span>
                  <span className="text-xs text-muted-foreground">{vital.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-foreground">
                    {vital.value}{vital.unit}
                  </span>
                  <Badge variant="outline" className={ratingColors[vital.rating]}>
                    {ratingLabels[vital.rating]}
                  </Badge>
                </div>
              </div>
              <Progress value={percent} className="h-1.5" />
              {vital.culprit && (
                <div className="flex items-start gap-1.5 rounded-md bg-muted/50 border border-border px-2.5 py-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-muted-foreground">{vital.culprit}</span>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
