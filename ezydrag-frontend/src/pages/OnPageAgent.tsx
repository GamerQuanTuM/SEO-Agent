import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { InternalLinkOrchestrator } from "@/components/onpage/InternalLinkOrchestrator";
import { useOnPageData, useSystemHealth } from "@/hooks/useSeoApi";
import { motion } from "framer-motion";
import { TrendingDown, Copy, MousePointerClick, Unlink, AlertCircle } from "lucide-react";

import { DashboardStateWrapper } from "@/components/layout/DashboardStateWrapper";

const OnPage = () => {
  const { data, isLoading, isError } = useOnPageData();
  const { data: systemHealth } = useSystemHealth();
  
  const { onPageKpis } = data || {};
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 p-6 overflow-y-auto">
            <DashboardStateWrapper isLoading={isLoading}>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-heading font-bold text-foreground">On-Page Agent</h1>
                  <p className="text-sm text-muted-foreground mt-1">The Content Strategist — traffic protection, cannibalization guard & CTR optimization</p>
                </div>

                {/* Missing Integration Warning */}
                {onPageKpis?.decayingPages?.value === 0 && onPageKpis?.cannibalizationIssues?.value === 0 && systemHealth && !systemHealth.has_onpage_api && (
                  <div className="mb-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-destructive">Google Search Console Integration Missing</h3>
                      <p className="text-sm text-destructive/80 mt-1">
                        To discover Content Decay, Cannibalization Issues, and low CTR opportunities, you need to connect your Google Search Console via `credentials.json` on the backend. Currently, this dashboard only shows fallback/empty layout placeholders.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <KpiCard title="Decaying Pages" value={onPageKpis?.decayingPages?.value || 0} change={onPageKpis?.decayingPages?.change || 0} icon={TrendingDown} invertColors />
                  <KpiCard title="Cannibalization Issues" value={onPageKpis?.cannibalizationIssues?.value || 0} change={onPageKpis?.cannibalizationIssues?.change || 0} icon={Copy} />
                  <KpiCard title="CTR Gap (avg)" value={`${onPageKpis?.ctrGap?.value || 0}%`} change={onPageKpis?.ctrGap?.change || 0} icon={MousePointerClick} />
                  <KpiCard title="Orphaned Pages" value={onPageKpis?.orphanedPages?.value || 0} change={onPageKpis?.orphanedPages?.change || 0} icon={Unlink} invertColors />
                </div>

                <div className="space-y-6">
                  <InternalLinkOrchestrator />
                </div>
              </motion.div>
            </DashboardStateWrapper>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OnPage;
