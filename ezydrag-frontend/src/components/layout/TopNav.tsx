import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar, Bell, Settings, Plus, Trash2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCompanies } from "@/hooks/useSeoApi";
import { useSelectedClient } from "@/context/ClientContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCompany, deleteCompany } from "@/lib/api";

export interface TopNavProps {
  selectedClient?: string;
  onClientChange?: (clientId: string) => void;
}

export function TopNav() {
  const { selectedClientId: selectedClient, setSelectedClientId: onClientChange } = useSelectedClient();
  const { data: companies = [] } = useCompanies();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", domain: "", competitors: "" });

  useEffect(() => {
    // Only auto-select first company if nothing is selected at all,
    // or if the selected ID doesn't exist AND has never existed (not just mid-refetch)
    if (companies.length > 0 && !selectedClient) {
      onClientChange(companies[0].id);
    }
  }, [companies, selectedClient, onClientChange]);

  const handleAddCompany = async () => {
    if (!form.name || !form.domain) {
      toast.error("Name and domain are required");
      return;
    }
    setLoading(true);
    try {
      const comps = form.competitors ? form.competitors.split(",").map(c => c.trim()) : [];
      const newComp = await addCompany({ name: form.name, domain: form.domain, competitors: comps });
      
      // Optimistically update React Query cache so the DashboardStateWrapper 
      // instantly finds the new company with status === "running"
      queryClient.setQueryData(['companies'], (oldData: any[]) => {
        return oldData ? [...oldData, newComp] : [newComp];
      });

      // Set the new company as selected instantly
      onClientChange(newComp.id);
      
      // Close modal FIRST so they see the overlay appear smoothly behind it
      setOpen(false);
      setForm({ name: "", domain: "", competitors: "" });
      toast.success("Company added and audit started!");

      // Sync with server in background
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setForm({ name: "", domain: "", competitors: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error adding company");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this company?")) return;
    try {
      await deleteCompany(id);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success("Company deleted");
      if (selectedClient === id) {
        onClientChange(companies.length > 1 ? companies.find((c: any) => c.id !== id)?.id : "");
      }
    } catch (err: any) {
      toast.error("Error deleting company");
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="h-6 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          {companies.length > 0 ? (
            <Select value={selectedClient} onValueChange={onClientChange}>
              <SelectTrigger className="w-[200px] bg-secondary border-border">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((client: any) => (
                  <SelectItem key={client.id} value={client.id}>
                    <span className="flex flex-1 items-center justify-between w-full">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                          {client.logo || client.name[0]}
                        </span>
                        {client.name}
                      </span>
                      <Trash2 
                        className="w-3 h-3 text-muted-foreground hover:text-destructive cursor-pointer ml-3" 
                        onClick={(e) => handleDelete(e, client.id)}
                      />
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/50 border border-border/50 text-xs text-muted-foreground italic">
               No companies added
             </div>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9" title="Add Company">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a Company for SEO</DialogTitle>
                <DialogDescription>
                  Enter details to start a full SEO audit. <br />
                  <span className="text-amber-500 font-medium">
                    Disclaimer: Only use the 'Competitors' field if you have an API key (Semrush, Ahrefs, DataForSEO) configured in the backend .env!
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Name</Label>
                  <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="col-span-3" placeholder="Acme Corp" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Domain</Label>
                  <Input value={form.domain} onChange={e => setForm({...form, domain: e.target.value})} className="col-span-3" placeholder="acme.com" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Competitors</Label>
                  <Input value={form.competitors} onChange={e => setForm({...form, competitors: e.target.value})} className="col-span-3" placeholder="comp1.com, comp2.com (optional)" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCompany} disabled={loading}>{loading ? "Saving..." : "Save & Audit"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Calendar className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
