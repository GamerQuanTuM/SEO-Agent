import { useState, useEffect } from "react";
import { MousePointerClick, Eye, FlaskConical, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type CTROpportunity } from "@/data/onPageMockData";
import { useOnPageData } from "@/hooks/useSeoApi";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  testing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  applied: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function CTROptimizer() {
  const { data } = useOnPageData();
  const { ctrOpportunities = [] } = data;
  const [opportunities, setOpportunities] = useState<CTROpportunity[]>(ctrOpportunities);

  useEffect(() => {
    setOpportunities(ctrOpportunities);
  }, [ctrOpportunities]);

  const handleTest = (id: string) => {
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, status: "testing" } : o)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <MousePointerClick className="h-5 w-5 text-primary" />
          CTR Optimizer
        </CardTitle>
        <CardDescription>Pages ranking well but underperforming on click-through rate</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {opportunities.map((opp) => {
          const ctrGap = (opp.expectedCtr - opp.ctr).toFixed(1);
          const potentialClicks = Math.round(opp.impressions * (opp.expectedCtr / 100)) - opp.clicks;

          return (
            <div key={opp.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{opp.currentTitle}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <code>{opp.url}</code>
                    <span>·</span>
                    <span>"{opp.keyword}"</span>
                    <span>·</span>
                    <span>Pos #{opp.position}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`ml-3 shrink-0 ${statusColors[opp.status]}`}>{opp.status}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-md bg-muted/50 border border-border p-2 text-center">
                  <p className="text-lg font-bold text-foreground">{opp.ctr}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Current CTR</p>
                </div>
                <div className="rounded-md bg-muted/50 border border-border p-2 text-center">
                  <p className="text-lg font-bold text-primary">{opp.expectedCtr}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Expected CTR</p>
                </div>
                <div className="rounded-md bg-primary/10 border border-primary/20 p-2 text-center">
                  <p className="text-lg font-bold text-primary">+{potentialClicks}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Potential Clicks</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Eye className="h-3 w-3" />
                      View Alternatives
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-heading">AI-Generated Title Alternatives</DialogTitle>
                      <DialogDescription>Select one to A/B test for "{opp.keyword}" (CTR gap: {ctrGap}%)</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="rounded-md bg-muted/50 border border-border p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current</p>
                        <p className="text-sm text-foreground">{opp.currentTitle}</p>
                      </div>
                      {opp.alternatives.map((alt, i) => (
                        <div key={i} className="rounded-md border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] text-primary uppercase tracking-wider mb-1">Option {i + 1}</p>
                            <p className="text-sm text-foreground">{alt}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-primary">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                {opp.status === "pending" && (
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleTest(opp.id)}>
                    <FlaskConical className="h-3 w-3" />
                    Start A/B Test
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
