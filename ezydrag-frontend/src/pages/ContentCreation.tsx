import { motion } from "framer-motion";
import { Search, FileText, Send, BarChart3 } from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DraftEditor } from "@/components/content/DraftEditor";
import { CMSIntegration } from "@/components/content/CMSIntegration";
import { ContentPipeline } from "@/components/content/ContentPipeline";
import { useContentData } from "@/hooks/useSeoApi";

import { DashboardStateWrapper } from "@/components/layout/DashboardStateWrapper";

const ContentCreation = () => {
  const { data, isLoading } = useContentData();

  const { contentKpis } = data || {};
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
                  <h1 className="text-2xl font-heading font-bold text-foreground">Content Creation Agent</h1>
                  <p className="text-sm text-muted-foreground mt-1">The AI Publisher — topic discovery, autonomous drafting & CMS publishing</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <KpiCard title="Topics Discovered" value={contentKpis?.topicsDiscovered?.value || 0} change={contentKpis?.topicsDiscovered?.change || 0} icon={Search} />
                  <KpiCard title="Drafts Generated" value={contentKpis?.draftsGenerated?.value || 0} change={contentKpis?.draftsGenerated?.change || 0} icon={FileText} />
                  <KpiCard title="Posts Published" value={contentKpis?.postsPublished?.value || 0} change={contentKpis?.postsPublished?.change || 0} icon={Send} />
                  <KpiCard title="Avg SEO Score" value={contentKpis?.avgSeoScore?.value || 0} change={contentKpis?.avgSeoScore?.change || 0} icon={BarChart3} />
                </div>

                <div className="grid grid-cols-1 gap-6 mb-6">
                  <ContentPipeline />
                </div>

                <div className="space-y-6">
                  <DraftEditor />
                  <CMSIntegration />
                </div>
              </motion.div>
            </DashboardStateWrapper>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ContentCreation;
