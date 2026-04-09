import { useState, useEffect } from "react";
import { TrendingDown, RefreshCw, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type DecayingPage } from "@/data/onPageMockData";
import { useOnPageData } from "@/hooks/useSeoApi";

const statusColors: Record<string, string> = {
  flagged: "bg-destructive/20 text-destructive border-destructive/30",
  refreshing: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
};

export function ContentDecay() {
  const { data } = useOnPageData();
  const { decayingPages = [] } = data;
  const [pages, setPages] = useState<DecayingPage[]>(decayingPages);

  useEffect(() => {
    setPages(decayingPages);
  }, [decayingPages]);

  const handleAction = (id: string, action: "refreshing" | "dismissed") => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, status: action } : p)));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              Content Decay Detection
            </CardTitle>
            <CardDescription>Pages losing &gt;20% traffic month-over-month flagged for refresh</CardDescription>
          </div>
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            {pages.filter((p) => p.status === "flagged").length} flagged
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead className="text-center">Traffic</TableHead>
              <TableHead className="text-center">Change</TableHead>
              <TableHead className="text-center">Position</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium text-foreground line-clamp-1">{page.title}</p>
                    <code className="text-[11px] text-muted-foreground">{page.url}</code>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm text-muted-foreground">{page.trafficPrevious.toLocaleString()}</span>
                  <span className="text-muted-foreground mx-1">→</span>
                  <span className="text-sm font-medium text-foreground">{page.trafficCurrent.toLocaleString()}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium text-destructive">{page.changePercent}%</span>
                </TableCell>
                <TableCell className="text-center font-mono text-sm">#{page.position}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{page.lastUpdated}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={statusColors[page.status]}>{page.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {page.status === "flagged" && (
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary" onClick={() => handleAction(page.id, "refreshing")}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleAction(page.id, "dismissed")}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {page.status === "resolved" && <CheckCircle2 className="h-4 w-4 text-green-400 ml-auto" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
