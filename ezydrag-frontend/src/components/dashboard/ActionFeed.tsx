import { useState, useEffect } from "react";
import { Shield, Link2Off, AtSign, Target, Mail, CheckCircle2, XCircle, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ActionItem } from "@/data/mockData";
import { useOffPageData } from "@/hooks/useSeoApi";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const agentIcons: Record<ActionItem["agentType"], typeof Shield> = {
  "toxic-link": Shield,
  "lost-link": Link2Off,
  "unlinked-mention": AtSign,
  "competitor-gap": Target,
  outreach: Mail,
};

const agentLabels: Record<ActionItem["agentType"], string> = {
  "toxic-link": "Toxic Link Defender",
  "lost-link": "Lost Link Recovery",
  "unlinked-mention": "Unlinked Mention",
  "competitor-gap": "Competitor Gap",
  outreach: "Outreach Opportunity",
};

const severityColors: Record<ActionItem["severity"], string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  low: "bg-muted text-muted-foreground border-border",
};

export function ActionFeed() {
  const { data } = useOffPageData();
  const actionItems = data?.actionItems || [];
  const [items, setItems] = useState<ActionItem[]>(actionItems);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<ActionItem | null>(null);

  useEffect(() => {
    setItems(actionItems);
  }, [actionItems]);

  const updateStatus = (id: string, status: ActionItem["status"]) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const pendingItems = items.filter((i) => i.status === "pending");
  const resolvedItems = items.filter((i) => i.status !== "pending");

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Action Plan Feed</CardTitle>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              {pendingItems.length} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {pendingItems.map((item) => {
              const Icon = agentIcons[item.agentType];
              const isExpanded = expandedId === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="border border-border rounded-lg p-3 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", severityColors[item.severity])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider border", severityColors[item.severity])}>
                          {item.severity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {agentLabels[item.agentType]}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-foreground leading-snug">{item.title}</h4>
                      
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1.5 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isExpanded ? "Less" : "Details"}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{item.description}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => updateStatus(item.id, "approved")}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        {item.draftEmail && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedEmail(item);
                              setEmailDialogOpen(true);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Email
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => updateStatus(item.id, "dismissed")}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {pendingItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary/40" />
              All caught up! No pending actions.
            </div>
          )}

          {resolvedItems.length > 0 && (
            <div className="border-t border-border pt-3 mt-4">
              <p className="text-xs text-muted-foreground mb-2">{resolvedItems.length} resolved</p>
              {resolvedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 py-1.5 opacity-50">
                  {item.status === "approved" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground line-through">{item.title}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-heading">Draft Outreach Email</DialogTitle>
            <DialogDescription className="text-xs">
              Auto-generated by the Off-Page Agent. Review and personalize before sending.
            </DialogDescription>
          </DialogHeader>
          {selectedEmail?.draftEmail && (
            <div className="bg-secondary rounded-lg p-4 font-mono text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {selectedEmail.draftEmail}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(false)}>Close</Button>
            <Button size="sm" className="bg-primary text-primary-foreground">Copy to Clipboard</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
