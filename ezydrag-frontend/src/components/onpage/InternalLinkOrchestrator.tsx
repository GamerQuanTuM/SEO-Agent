import { useState, useEffect } from "react";
import { Unlink, Link2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type OrphanedPage } from "@/data/onPageMockData";
import { useOnPageData } from "@/hooks/useSeoApi";

export function InternalLinkOrchestrator() {
  const { data } = useOnPageData();
  const { orphanedPages = [] } = data;
  const [pages, setPages] = useState<OrphanedPage[]>(orphanedPages);

  useEffect(() => {
    setPages(orphanedPages);
  }, [orphanedPages]);

  const handleLink = (id: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, status: "linked" } : p)));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading flex items-center gap-2">
              <Unlink className="h-5 w-5 text-yellow-400" />
              Internal Link Orchestrator
            </CardTitle>
            <CardDescription>Orphaned pages with no inbound internal links — connect them to your site network</CardDescription>
          </div>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            {pages.filter((p) => p.status === "orphaned").length} orphaned
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pages.map((page) => (
          <div key={page.id} className={`rounded-lg border p-4 space-y-3 ${page.status === "linked" ? "border-green-500/30 bg-green-500/5" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{page.title}</p>
                <code className="text-[11px] text-muted-foreground">{page.url}</code>
              </div>
              <div className="flex items-center gap-2">
                {page.status === "linked" ? (
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">linked</Badge>
                ) : (
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleLink(page.id)}>
                    <Link2 className="h-3 w-3" />
                    Apply Links
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Links in: <strong className="text-foreground">{page.internalLinksTo}</strong></span>
              <span>Links out: <strong className="text-foreground">{page.internalLinksFrom}</strong></span>
              <span>Traffic: <strong className="text-foreground">{page.traffic}/mo</strong></span>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Suggested internal links</p>
              {page.suggestedLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2 text-xs rounded-md bg-muted/50 border border-border px-2.5 py-1.5">
                  <span className="text-muted-foreground truncate">{link.fromTitle}</span>
                  <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-primary font-medium">"{link.anchorText}"</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
