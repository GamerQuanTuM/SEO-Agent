import React, { createContext, useContext, useState, useEffect } from "react";

interface ClientContextType {
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  // Default to a known ID or the first one from DB (handled in useCompanies usually)
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return localStorage.getItem("selectedClientId") || "client-1";
  });

  useEffect(() => {
    localStorage.setItem("selectedClientId", selectedClientId);
  }, [selectedClientId]);

  return (
    <ClientContext.Provider value={{ selectedClientId, setSelectedClientId }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useSelectedClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error("useSelectedClient must be used within a ClientProvider");
  }
  return context;
}
