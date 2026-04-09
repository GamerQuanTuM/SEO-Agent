import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTechnicalData } from "@/hooks/useSeoApi";
import { Code2, AlertTriangle, CheckCircle2 } from "lucide-react";

export function SchemaHealer() {
  const { data } = useTechnicalData();
  const { schemaIssues } = data;
  const openIssues = schemaIssues.filter((i: any) => i.status === "open");
  const fixedIssues = schemaIssues.filter((i: any) => i.status === "fixed");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          Schema Markup Healer
        </CardTitle>
        <CardDescription>{openIssues.length} issues found — {fixedIssues.length} resolved</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {schemaIssues.map((issue) => (
          <div
            key={issue.id}
            className={`rounded-lg border p-3 space-y-2 ${
              issue.status === "fixed" ? "border-border/50 opacity-60" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {issue.status === "fixed" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : issue.severity === "error" ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                )}
                <code className="text-xs text-muted-foreground">{issue.pageUrl}</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">{issue.schemaType}</Badge>
                <Badge
                  variant="outline"
                  className={
                    issue.severity === "error"
                      ? "bg-destructive/10 text-destructive border-destructive/30"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                  }
                >
                  {issue.severity}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-foreground">{issue.issue}</p>
            <pre className="rounded bg-muted/50 border border-border px-2.5 py-1.5 text-[11px] font-mono text-primary overflow-x-auto">
              {issue.fix}
            </pre>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
