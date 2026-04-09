import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { FileText, Eye, Check, Link2, Clock, Hash } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { type ContentDraft } from "@/data/contentMockData";
import { useContentData } from "@/hooks/useSeoApi";

const statusColors: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  review: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  published: "bg-primary/20 text-primary border-primary/30",
};

export function DraftEditor() {
  const { data } = useContentData();
  const { contentDrafts = [] } = data;
  const [drafts, setDrafts] = useState<ContentDraft[]>(contentDrafts);

  useEffect(() => {
    setDrafts(contentDrafts);
  }, [contentDrafts]);

  const handleApprove = (id: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status: "approved" } : d)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Autonomous Drafts
        </CardTitle>
        <CardDescription>AI-generated blog posts ready for review and approval</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {drafts.map((draft) => (
          <div key={draft.id} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground leading-tight">{draft.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{draft.excerpt}</p>
              </div>
              <Badge variant="outline" className={`ml-3 shrink-0 ${statusColors[draft.status]}`}>
                {draft.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{draft.wordCount} words</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{draft.readingTime} min read</span>
              <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />{draft.internalLinks.length} internal links</span>
              <span>KW density: {draft.keywordDensity}%</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">SEO Score</span>
                  <span className="text-[11px] font-medium text-foreground">{draft.seoScore}/100</span>
                </div>
                <Progress value={draft.seoScore} className="h-1.5" />
              </div>

              <div className="flex items-center gap-1">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Eye className="h-3 w-3" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-heading">{draft.title}</DialogTitle>
                      <DialogDescription>/{draft.slug} · {draft.wordCount} words · SEO {draft.seoScore}/100</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Outline</h4>
                        <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1">
                          {draft.headings.map((h, i) => (
                            <p key={i} className={`text-xs ${h.startsWith("H1") ? "font-bold text-foreground" : h.startsWith("H2") ? "font-medium text-foreground pl-2" : "text-muted-foreground pl-4"}`}>
                              {h}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Content Preview</h4>
                        <div className="prose prose-sm prose-invert max-w-none rounded-lg bg-muted/30 border border-border p-4">
                          <ReactMarkdown>{draft.body}</ReactMarkdown>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Auto Internal Links</h4>
                        <div className="space-y-1.5">
                          {draft.internalLinks.map((link, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <Link2 className="h-3 w-3 text-primary shrink-0" />
                              <span className="text-primary font-medium">{link.anchorText}</span>
                              <span className="text-muted-foreground">→</span>
                              <code className="text-muted-foreground">{link.targetUrl}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {draft.status !== "approved" && draft.status !== "published" && (
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleApprove(draft.id)}>
                    <Check className="h-3 w-3" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
