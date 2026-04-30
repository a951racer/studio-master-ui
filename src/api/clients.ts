import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClientPersonAssociation {
  personId: string;
  roleId: string;
  isPrimary: boolean;
}

export interface Client {
  _id: string;
  name: string;
  description?: string;
  persons: ClientPersonAssociation[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Query-key helpers
// ---------------------------------------------------------------------------

const clientKeys = {
  all: ['clients'] as const,
  detail: (id: string) => ['clients', id] as const,
  persons: (id: string) => ['clients', id, 'persons'] as const,
};

// ---------------------------------------------------------------------------
// Hooks — Queries
// ---------------------------------------------------------------------------

/** Fetch all clients. */
export function useClients() {
  return useQuery({
    queryKey: clientKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<Client[]>('/api/clients');
      return data;
    },
  });
}

/** Fetch a single client by ID. */
export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Client>(`/api/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/** Fetch the persons array for a client (populated with person details). */
export function useClientPersons(id: string) {
  return useQuery({
    queryKey: clientKeys.persons(id),
    queryFn: async () => {
      const { data } = await apiClient.get<ClientPersonAssociation[]>(
        `/api/clients/${id}/persons`,
      );
      return data;
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Hooks — Mutations
// ---------------------------------------------------------------------------

/** Create a new client. */
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { name: string; description?: string }) => {
      const { data } = await apiClient.post<Client>('/api/clients', vars);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

/** Update an existing client. */
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      id: string;
      name?: string;
      description?: string;
    }) => {
      const { id, ...body } = vars;
      const { data } = await apiClient.put<Client>(`/api/clients/${id}`, body);
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(vars.id) });
    },
  });
}

/** Delete a client. */
export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

/** Add a person to a client. */
export function useAddPersonToClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      clientId: string;
      personId: string;
      roleId: string;
      isPrimary?: boolean;
    }) => {
      const { clientId, ...body } = vars;
      const { data } = await apiClient.post<Client>(
        `/api/clients/${clientId}/persons`,
        body,
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(vars.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: clientKeys.persons(vars.clientId),
      });
    },
  });
}

/** Update a person's role or isPrimary flag for a client. */
export function useUpdateClientPerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      clientId: string;
      personId: string;
      roleId?: string;
      isPrimary?: boolean;
    }) => {
      const { clientId, personId, ...body } = vars;
      const { data } = await apiClient.put<Client>(
        `/api/clients/${clientId}/persons/${personId}`,
        body,
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(vars.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: clientKeys.persons(vars.clientId),
      });
    },
  });
}

/** Remove a person from a client. */
export function useRemovePersonFromClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { clientId: string; personId: string }) => {
      await apiClient.delete(
        `/api/clients/${vars.clientId}/persons/${vars.personId}`,
      );
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: clientKeys.detail(vars.clientId),
      });
      queryClient.invalidateQueries({
        queryKey: clientKeys.persons(vars.clientId),
      });
    },
  });
}
