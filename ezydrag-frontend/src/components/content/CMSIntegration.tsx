import { Globe, RefreshCw, Unplug, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useContentData } from "@/hooks/useSeoApi";

const platformIcons: Record<string, string> = {
  wordpress: "WP",
  webflow: "WF",
  shopify: "SH",
  custom: "API",
};

const statusConfig = {
  connected: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", label: "Connected" },
  disconnected: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Disconnected" },
  error: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Error" },
};

export function CMSIntegration() {
  const { data } = useContentData();
  const { cmsConnections = [] } = data;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          CMS Integrations
        </CardTitle>
        <CardDescription>Push approved drafts directly to your client's CMS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {cmsConnections.map((cms) => {
          const statusCfg = statusConfig[cms.status];
          const StatusIcon = statusCfg.icon;

          return (
            <div key={cms.id} className="rounded-lg border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {platformIcons[cms.platform]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{cms.label}</span>
                    <Badge variant="outline" className={`${statusCfg.bg} ${statusCfg.color} border-transparent`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusCfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cms.siteUrl} · {cms.postsPublished} posts published
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Last synced: {new Date(cms.lastSync).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cms.status === "connected" ? (
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <RefreshCw className="h-3 w-3" />
                    Sync
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <Unplug className="h-3 w-3" />
                    Connect
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
