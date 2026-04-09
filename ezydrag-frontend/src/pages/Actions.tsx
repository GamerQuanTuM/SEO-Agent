import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { ActionFeed } from "@/components/dashboard/ActionFeed";
import { motion } from "framer-motion";

import { useSelectedClient } from "@/context/ClientContext";
import { DashboardStateWrapper } from "@/components/layout/DashboardStateWrapper";

const Actions = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 p-6 overflow-y-auto">
            <DashboardStateWrapper>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
                <div className="mb-6">
                  <h1 className="text-2xl font-heading font-bold text-foreground">Action Plan</h1>
                  <p className="text-sm text-muted-foreground mt-1">Review and approve AI-generated tasks and outreach drafts</p>
                </div>
                <ActionFeed />
              </motion.div>
            </DashboardStateWrapper>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Actions;
