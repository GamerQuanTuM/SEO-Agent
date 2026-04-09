import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';
import { useSelectedClient } from "../context/ClientContext";

export function useCompanies() {
  const query = useQuery({
    queryKey: ['companies'],
    queryFn: api.fetchCompanies,
    refetchInterval: (query) => {
      // Poll every 3s while any company audit is running
      const data = query.state.data as any[];
      if (data?.some((c: any) => c.status === 'running')) return 3000;
      return false; // Stop polling when no audits are running
    },
  });
  return query;
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: api.fetchHealth,
    staleTime: 60000, // cache for 1 min
  });
}

/**
 * Watches the selected company's audit status. When it transitions from
 * "running" → "completed", invalidates all dashboard data queries so
 * charts and tables auto-refresh with the newly available data.
 */
export function useAuditCompletionWatcher() {
  const queryClient = useQueryClient();
  const { selectedClientId } = useSelectedClient();
  const { data: companies = [] } = useCompanies();

  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const current = companies.find((c: any) => c.id === selectedClientId);
    const currentStatus = current?.status || null;
    const prevStatus = prevStatusRef.current;

    // Detect transition: running → completed (or error)
    if (prevStatus === 'running' && currentStatus !== 'running' && currentStatus) {
      // Invalidate all dashboard data queries to force a refetch
      queryClient.invalidateQueries({ queryKey: ['technicalData', selectedClientId] });
      queryClient.invalidateQueries({ queryKey: ['onPageData', selectedClientId] });
      queryClient.invalidateQueries({ queryKey: ['offPageData', selectedClientId] });
      queryClient.invalidateQueries({ queryKey: ['contentData', selectedClientId] });
    }

    prevStatusRef.current = currentStatus;
  }, [companies, selectedClientId, queryClient]);
}

export function useTechnicalData(companyId?: string) {
  const { selectedClientId } = useSelectedClient();
  const cid = companyId || selectedClientId;
  return useQuery({
    queryKey: ['technicalData', cid],
    queryFn: () => api.fetchTechnicalData(cid)
  });
}

export function useOnPageData(companyId?: string) {
  const { selectedClientId } = useSelectedClient();
  const cid = companyId || selectedClientId;
  return useQuery({
    queryKey: ['onPageData', cid],
    queryFn: () => api.fetchOnPageData(cid)
  });
}

export function useOffPageData(companyId?: string) {
  const { selectedClientId } = useSelectedClient();
  const cid = companyId || selectedClientId;
  return useQuery({
    queryKey: ['offPageData', cid],
    queryFn: () => api.fetchOffPageData(cid)
  });
}

export function useContentData(companyId?: string) {
  const { selectedClientId } = useSelectedClient();
  const cid = companyId || selectedClientId;
  return useQuery({
    queryKey: ['contentData', cid],
    queryFn: () => api.fetchContentData(cid)
  });
}
