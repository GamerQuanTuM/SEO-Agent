import { Copy, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOnPageData } from "@/hooks/useSeoApi";

const severityColors = {
  high: "bg-destructive/20 text-destructive border-destructive/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export function CannibalizationGuard() {
  const { data } = useOnPageData();
  const { cannibalizationPairs = [] } = data;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Copy className="h-5 w-5 text-yellow-400" />
          Cannibalization Guard
        </CardTitle>
        <CardDescription>Pages competing for the same keyword — splitting ranking power</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {cannibalizationPairs.map((pair) => (
          <div key={pair.id} className={`rounded-lg border p-4 space-y-3 ${pair.status === "resolved" ? "border-border/50 opacity-60" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {pair.status === "resolved" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                )}
                <span className="text-sm font-medium text-foreground">"{pair.keyword}"</span>
                <span className="text-xs text-muted-foreground">{pair.searchVolume.toLocaleString()} vol/mo</span>
              </div>
              <Badge variant="outline" className={severityColors[pair.severity]}>{pair.severity}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pair.pages.map((page, i) => (
                <div key={i} className="rounded-md bg-muted/50 border border-border px-3 py-2">
                  <p className="text-xs font-medium text-foreground line-clamp-1">{page.title}</p>
                  <code className="text-[10px] text-muted-foreground">{page.url}</code>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span>Pos: <strong className="text-foreground">#{page.position}</strong></span>
                    <span>Traffic: <strong className="text-foreground">{page.traffic}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-primary">Suggested: </span>{pair.suggestedAction}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
