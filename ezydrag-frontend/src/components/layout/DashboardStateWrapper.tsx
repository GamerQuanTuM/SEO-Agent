import React from "react";
import { Loader2, PlusCircle, Bot, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanies, useAuditCompletionWatcher } from "@/hooks/useSeoApi";
import { useSelectedClient } from "@/context/ClientContext";
import { useQueryClient } from "@tanstack/react-query";
import { deleteCompany } from "@/lib/api";

interface DashboardStateWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function DashboardStateWrapper({ children, isLoading }: DashboardStateWrapperProps) {
  const { data: companies = [], isLoading: loadingCompanies, isError } = useCompanies();
  const { selectedClientId, setSelectedClientId } = useSelectedClient();
  const queryClient = useQueryClient();

  // Watch for audit completion and auto-refetch dashboard data
  useAuditCompletionWatcher();

  // 1. Initial Loading
  if (loadingCompanies) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-500">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
        <div className="space-y-1">
          <h2 className="text-xl font-heading font-bold">Initializing Agents</h2>
          <p className="text-sm text-muted-foreground">Connecting to intelligence core...</p>
        </div>
      </div>
    );
  }

  // 2. Error or No Companies Added
  if (isError || !companies || companies.length === 0) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
          <Bot className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-heading font-bold">{isError ? "Connection Sync Failed" : "No SEO targets found"}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {isError 
              ? "Unable to reach your SEO agents. Please ensure the backend is running and CORS is configured." 
              : "Your AI agents are standing by. Add a company domain to begin the deep SEO audit and autonomous intelligence gathering."}
          </p>
        </div>
        {!isError && (
          <Button size="lg" className="gap-2 shadow-lg shadow-primary/20" onClick={() => (document.querySelector('[title="Add Company"]') as HTMLElement)?.click()}>
            <PlusCircle className="h-5 w-5" />
            Add First Company
          </Button>
        )}
      </div>
    );
  }

  // 3. Resolve current company — gracefully handle transition states
  const currentCompany = companies.find((c: any) => c.id === selectedClientId);

  // 4. Audit in progress check - MUST take priority over regular data loading
  if (currentCompany?.status === "running") {
    return (
      <div className="fixed inset-0 z-[9998] bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-3xl">
          <AuditProgressBanner company={currentCompany} />
          <p className="text-center text-sm text-primary/60 mt-8 animate-pulse font-medium tracking-wide">
            SYSTEM LOCKED UNTIL AUDIT COMPLETION
          </p>
        </div>
      </div>
    );
  }

  // 5. Regular Data Loading Spinner (only show if NOT auditing)
  if (isLoading) {
    return (
       <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
        <p className="text-sm font-medium text-muted-foreground">Fetching latest reports...</p>
      </div>
    )
  }

  // 6. Render dashboard normally when no audit is running and data is loaded
  return (
    <>
      {/* Block with Error Modal if Audit Failed */}
      {currentCompany?.status === "error" && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl">
          <div className="max-w-md w-full bg-card border border-destructive/30 rounded-2xl shadow-2xl p-6 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Audit Failed</h2>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              {currentCompany.current_step || "An unexpected error interrupted the intelligence gathering."}
            </p>
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={async () => {
                try {
                  await deleteCompany(currentCompany.id);
                  queryClient.invalidateQueries({ queryKey: ["companies"] });
                  setSelectedClientId("");
                } catch {
                  setSelectedClientId("");
                }
              }}
            >
              Discard & Reset
            </Button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}


// ── Dedicated Visual Loading Screen ─────────────────────────────────────

interface AuditProgressBannerProps {
  company: any;
}

function AuditProgressBanner({ company }: AuditProgressBannerProps) {
  const step = company.current_step || "Initializing Agents";
  
  const steps = [
    { name: "Technical Agent", icon: "🔧", desc: "Analyzing Crawl & CWV", active: step.includes("Technical") },
    { name: "On-Page Agent", icon: "📄", desc: "Auditing Content & Keywords", active: step.includes("On-Page") || step.includes("Strategy") },
    { name: "Off-Page Agent", icon: "🌐", desc: "Checking Backlink Toxicity", active: step.includes("Off-Page") || step.includes("Backlink") },
    { name: "Content Agent", icon: "✍️", desc: "Discovering Content Gaps", active: step.includes("Content") || step.includes("Discovery") },
    { name: "Synthesis Engine", icon: "🧠", desc: "Generating Master Strategy", active: step.includes("Synthesis") || step.includes("Multi-Agent") },
    { name: "Data Builder", icon: "📊", desc: "Structuring Dashboard APIs", active: step.includes("Dashboard") || step.includes("Building") },
    { name: "Storage Agent", icon: "💾", desc: "Persisting Audit Details", active: step.includes("Saving") || step.includes("Finished") },
  ];

  // Calculate progress percentage
  let activeIndex = -1;
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].active) { activeIndex = i; break; }
  }
  const progressPct = activeIndex >= 0 ? Math.round(((activeIndex + 1) / steps.length) * 100) : 5;

  return (
    <div className="mb-6 animate-in slide-in-from-top-4 fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-primary/5 shadow-lg shadow-primary/5">
        {/* Shimmer effect on border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer" />
        
        <div className="p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full animate-pulse" />
                <div className="relative w-10 h-10 rounded-xl bg-card border border-primary/20 flex items-center justify-center shadow-md ring-2 ring-primary/10">
                  <Bot className="h-5 w-5 text-primary animate-bounce-slight" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Auditing {company.name}</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Live
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stage: <span className="text-foreground font-medium">{step}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary tabular-nums">{progressPct}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-primary via-primary to-emerald-500 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPct}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Agent step indicators */}
          <div className="flex items-center justify-between gap-1">
            {steps.map((s, i) => {
              const isCompleted = i < activeIndex;
              const isCurrent = i === activeIndex;

              return (
                <div 
                  key={s.name}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all duration-500 ${
                    isCurrent 
                      ? "bg-primary/10 shadow-inner scale-110 border border-primary/20" 
                      : isCompleted 
                        ? "opacity-80" 
                        : "opacity-30 grayscale"
                  }`}
                >
                  <span className={`text-xl transition-transform duration-500 ${isCurrent ? "scale-125 mb-1" : ""}`}>
                    {isCompleted ? "✅" : s.icon}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider text-center leading-tight ${isCurrent ? "text-primary" : "text-foreground"}`}>
                    {s.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] text-muted-foreground text-center animate-pulse">
                      {s.desc}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-muted-foreground/50 text-center mt-2 italic">
        Data will auto-refresh when the audit completes. You can browse the dashboard while agents work.
      </p>
    </div>
  );
}
