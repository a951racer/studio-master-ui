import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LookupEntry {
  _id: string;
  listType: 'file-format' | 'file-type' | 'workflow-stage' | 'phone-number-type' | 'role';
  clientId?: string | null;
  name: string;
  sequenceOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Query-key helpers
// ---------------------------------------------------------------------------

function lookupKeys(type: string) {
  return ['lookup', type];
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchLookupEntries(
  type: string,
): Promise<LookupEntry[]> {
  const { data } = await apiClient.get<LookupEntry[]>(`/api/lookup/${type}`);
  return data;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch lookup entries for a given type.
 */
export function useLookupEntries(type: string) {
  return useQuery({
    queryKey: lookupKeys(type),
    queryFn: () => fetchLookupEntries(type),
  });
}

/**
 * Create a new lookup entry.
 */
export function useCreateLookupEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      type: string;
      name: string;
    }) => {
      const { data } = await apiClient.post<LookupEntry>(`/api/lookup/${vars.type}`, {
        name: vars.name,
      });
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: lookupKeys(vars.type),
      });
    },
  });
}

/**
 * Update an existing lookup entry's name.
 */
export function useUpdateLookupEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      type: string;
      id: string;
      name: string;
    }) => {
      const { data } = await apiClient.put<LookupEntry>(
        `/api/lookup/${vars.type}/${vars.id}`,
        { name: vars.name },
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: lookupKeys(vars.type),
      });
    },
  });
}

/**
 * Delete a lookup entry.
 */
export function useDeleteLookupEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      type: string;
      id: string;
    }) => {
      await apiClient.delete(`/api/lookup/${vars.type}/${vars.id}`);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: lookupKeys(vars.type),
      });
    },
  });
}

/**
 * Reorder workflow stages by sending the full ordered list of IDs.
 */
export function useReorderWorkflowStages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await apiClient.put('/api/lookup/workflow-stages/order', { orderedIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lookup', 'workflow-stage'] });
    },
  });
}
