import { Zap, AlertTriangle, Timer, Code2 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { CrawlBudgetChart } from "@/components/technical/CrawlBudgetChart";
import { CoreWebVitalsPanel } from "@/components/technical/CoreWebVitalsPanel";
import { RedirectMapper } from "@/components/technical/RedirectMapper";
import { SchemaHealer } from "@/components/technical/SchemaHealer";
import { useTechnicalData } from "@/hooks/useSeoApi";
import { motion } from "framer-motion";

import { DashboardStateWrapper } from "@/components/layout/DashboardStateWrapper";

const Technical = () => {
  const { data, isLoading } = useTechnicalData();

  const technicalKpis = data?.technicalKpis;
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
                  <h1 className="text-2xl font-heading font-bold text-foreground">Technical Agent</h1>
                  <p className="text-sm text-muted-foreground mt-1">The DevOps Bot — crawl budget, Core Web Vitals, redirects & schema health</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <KpiCard title="Crawl Efficiency" value={`${technicalKpis?.crawlEfficiency?.value || 0}%`} change={technicalKpis?.crawlEfficiency?.change || 0} icon={Zap} />
                  <KpiCard title="Broken Pages" value={technicalKpis?.brokenPages?.value || 0} change={technicalKpis?.brokenPages?.change || 0} icon={AlertTriangle} invertColors />
                  <KpiCard title="Avg Page Speed" value={`${technicalKpis?.avgPageSpeed?.value || 0}s`} change={technicalKpis?.avgPageSpeed?.change || 0} icon={Timer} />
                  <KpiCard title="Schema Errors" value={technicalKpis?.schemaErrors?.value || 0} change={technicalKpis?.schemaErrors?.change || 0} icon={Code2} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <CrawlBudgetChart />
                  <CoreWebVitalsPanel />
                </div>

                <div className="space-y-6">
                  <RedirectMapper />
                  <SchemaHealer />
                </div>
              </motion.div>
            </DashboardStateWrapper>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Technical;
