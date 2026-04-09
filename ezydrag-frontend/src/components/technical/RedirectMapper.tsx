import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type BrokenPage } from "@/data/technicalMockData";
import { useTechnicalData } from "@/hooks/useSeoApi";
import { ArrowRight, Check, X, Code } from "lucide-react";

const statusBadge = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  applied: "bg-green-500/20 text-green-400 border-green-500/30",
  dismissed: "bg-muted text-muted-foreground border-border",
};

export function RedirectMapper() {
  const { data } = useTechnicalData();
  const brokenPages = data?.brokenPages || [];
  const [pages, setPages] = useState<BrokenPage[]>(brokenPages);

  const handleAction = (id: string, action: "applied" | "dismissed") => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, status: action } : p)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Auto-Redirect Mapper</CardTitle>
        <CardDescription>Broken pages with inbound links — 301 redirect code auto-generated</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Broken URL</TableHead>
              <TableHead className="text-center">Code</TableHead>
              <TableHead className="text-center">Inbound Links</TableHead>
              <TableHead>Redirect To</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell>
                  <code className="text-xs text-destructive">{page.url}</code>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">{page.statusCode}</Badge>
                </TableCell>
                <TableCell className="text-center font-medium">{page.inboundLinks}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                    <code className="text-xs text-primary">{page.suggestedRedirect}</code>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={statusBadge[page.status]}>
                    {page.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Code className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="font-heading">Redirect Code</DialogTitle>
                          <DialogDescription>Add this to your .htaccess or server config</DialogDescription>
                        </DialogHeader>
                        <pre className="rounded-lg bg-muted border border-border p-4 text-sm font-mono text-foreground overflow-x-auto">
                          {page.redirectCode}
                        </pre>
                      </DialogContent>
                    </Dialog>
                    {page.status === "pending" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-400 hover:text-green-300" onClick={() => handleAction(page.id, "applied")}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleAction(page.id, "dismissed")}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
