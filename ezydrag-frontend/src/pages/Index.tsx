import { Link2, ShieldAlert, Link2Off, Users } from "lucide-react";
import { motion } from "framer-motion";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { BacklinkVelocityChart } from "@/components/dashboard/BacklinkVelocityChart";
import { ToxicityRadar } from "@/components/dashboard/ToxicityRadar";
import { ActionFeed } from "@/components/dashboard/ActionFeed";
import { BacklinkTable } from "@/components/dashboard/BacklinkTable";
import { useOffPageData, useSystemHealth } from "@/hooks/useSeoApi";
import { useSelectedClient } from "@/context/ClientContext";
import { DashboardStateWrapper } from "@/components/layout/DashboardStateWrapper";

const Index = () => {
  const { selectedClientId } = useSelectedClient();
  const { data, isLoading } = useOffPageData(selectedClientId);
  const { data: systemHealth } = useSystemHealth();
  
  const kpiData = data?.kpiData || {
    totalBacklinks: { value: 0, change: 0 },
    referringDomains: { value: 0, change: 0 },
    toxicLinks: { value: 0, change: 0 },
    lostLinks: { value: 0, change: 0 },
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 p-6 overflow-y-auto">
            <DashboardStateWrapper isLoading={isLoading}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-heading font-bold text-foreground">Off-Page Agent Dashboard</h1>
                  <p className="text-sm text-muted-foreground mt-1">Network Security & PR Bot — monitoring backlinks, mentions, and competitor gaps</p>
                </div>

                {/* Missing Integration Warning */}
                {kpiData?.totalBacklinks?.value === 0 && systemHealth && !systemHealth.has_offpage_api && (
                  <div className="mb-6 p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-destructive">External Integrations Required</h3>
                      <p className="text-sm text-destructive/80 mt-1">
                        No off-page data was found for this domain. Please ensure you have connected a supported Backlink API (Semrush, Ahrefs, or DataForSEO) in your backend `.env` file, and that the domain has active backlinks. On-Page data similarly requires Google Search Console credentials.
                      </p>
                    </div>
                  </div>
                )}

                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <KpiCard title="Total Backlinks" value={kpiData?.totalBacklinks?.value || 0} change={kpiData?.totalBacklinks?.change || 0} icon={Link2} index={0} />
                  <KpiCard title="Referring Domains" value={kpiData?.referringDomains?.value || 0} change={kpiData?.referringDomains?.change || 0} icon={Users} index={1} />
                  <KpiCard title="Toxic Links" value={kpiData?.toxicLinks?.value || 0} change={kpiData?.toxicLinks?.change || 0} icon={ShieldAlert} invertColors index={2} />
                  <KpiCard title="Lost Links" value={kpiData?.lostLinks?.value || 0} change={kpiData?.lostLinks?.change || 0} icon={Link2Off} invertColors index={3} />
                </div>

                {/* Action Feed */}
                <div className="mb-6">
                  <ActionFeed />
                </div>
              </motion.div>
            </DashboardStateWrapper>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
