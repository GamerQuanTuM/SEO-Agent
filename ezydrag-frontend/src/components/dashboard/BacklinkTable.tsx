import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useOffPageData } from "@/hooks/useSeoApi";
import { cn } from "@/lib/utils";

const statusStyles = {
  active: "bg-success/10 text-success border-success/20",
  lost: "bg-warning/10 text-warning border-warning/20",
  toxic: "bg-destructive/10 text-destructive border-destructive/20",
};

export function BacklinkTable() {
  const { data } = useOffPageData();
  const backlinks = data?.backlinks || [];
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">Backlink Profile</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Source Domain</TableHead>
                <TableHead className="text-xs text-muted-foreground">DA</TableHead>
                <TableHead className="text-xs text-muted-foreground">Anchor Text</TableHead>
                <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs text-muted-foreground">Spam</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backlinks.map((link) => (
                <TableRow key={link.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="text-sm">
                    <a href="#" className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors">
                      {link.sourceDomain}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-sm font-mono font-medium",
                      link.domainAuthority >= 80 ? "text-success" :
                      link.domainAuthority >= 40 ? "text-foreground" : "text-destructive"
                    )}>
                      {link.domainAuthority}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {link.anchorText}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] uppercase", statusStyles[link.status])}>
                      {link.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", link.spamScore > 60 ? "bg-destructive" : link.spamScore > 30 ? "bg-warning" : "bg-success")}
                          style={{ width: `${link.spamScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{link.spamScore}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
