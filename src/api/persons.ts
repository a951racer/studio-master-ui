import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PhoneNumber {
  _id?: string;
  number: string;
  typeId: string;
}

export interface Person {
  _id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  email?: string | null;
  notes?: string | null;
  phoneNumbers: PhoneNumber[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Query-key helpers
// ---------------------------------------------------------------------------

const personKeys = {
  all: ['persons'] as const,
  detail: (id: string) => ['persons', id] as const,
};

// ---------------------------------------------------------------------------
// Hooks — Queries
// ---------------------------------------------------------------------------

/** Fetch all persons. */
export function usePersons() {
  return useQuery({
    queryKey: personKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<Person[]>('/api/persons');
      return data;
    },
  });
}

/** Fetch a single person by ID. */
export function usePerson(id: string) {
  return useQuery({
    queryKey: personKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Person>(`/api/persons/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Hooks — Mutations
// ---------------------------------------------------------------------------

/** Create a new person. */
export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      firstName: string;
      lastName: string;
      preferredName?: string;
      email?: string;
      notes?: string;
      phoneNumbers?: { number: string; typeId: string }[];
    }) => {
      const { data } = await apiClient.post<Person>('/api/persons', vars);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personKeys.all });
    },
  });
}

/** Update an existing person. */
export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      id: string;
      firstName?: string;
      lastName?: string;
      preferredName?: string;
      email?: string;
      notes?: string;
    }) => {
      const { id, ...body } = vars;
      const { data } = await apiClient.put<Person>(`/api/persons/${id}`, body);
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: personKeys.all });
      queryClient.invalidateQueries({ queryKey: personKeys.detail(vars.id) });
    },
  });
}

/** Delete a person. */
export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/persons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personKeys.all });
    },
  });
}

/** Update phone numbers on a person. */
export function useUpdatePhoneNumbers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      id: string;
      phoneNumbers: { number: string; typeId: string }[];
    }) => {
      const { id, phoneNumbers } = vars;
      const { data } = await apiClient.put<Person>(
        `/api/persons/${id}/phones`,
        { phoneNumbers },
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: personKeys.all });
      queryClient.invalidateQueries({ queryKey: personKeys.detail(vars.id) });
    },
  });
}
