import { motion } from "framer-motion";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { ActionFeed } from "@/components/dashboard/ActionFeed";
import { DashboardStateWrapper } from "@/components/layout/DashboardStateWrapper";
import { useOffPageData, useSystemHealth } from "@/hooks/useSeoApi";
import { ShieldAlert } from "lucide-react";

const OffPage = () => {
  const { isLoading, data } = useOffPageData();
  const { data: systemHealth } = useSystemHealth();
  
  const hasNoData = !data?.kpiData?.totalBacklinks || data?.kpiData?.totalBacklinks?.value === 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 p-6 overflow-y-auto">
            <DashboardStateWrapper isLoading={isLoading}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-6">
                  <h1 className="text-2xl font-heading font-bold text-foreground">Off-Page Agent</h1>
                  <p className="text-sm text-muted-foreground mt-1">Deep-dive into proactive outreach and competitor gap analysis</p>
                </div>

                {hasNoData && systemHealth && !systemHealth.has_offpage_api && (
                  <div className="mb-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-destructive">External Integrations Required</h3>
                      <p className="text-sm text-destructive/80 mt-1">
                        No off-page data was found for this domain. Please ensure you have connected a supported Backlink API (Semrush, Ahrefs, or DataForSEO) in your backend `.env` file, and that the domain has active backlinks.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Action Feed is populated from the LLM report generation */}
                  <div className="bg-card border border-border/40 p-6 rounded-xl shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 text-card-foreground">Recommended Actions</h2>
                    <ActionFeed />
                  </div>
                </div>
              </motion.div>
            </DashboardStateWrapper>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default OffPage;
