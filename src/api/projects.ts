import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Project {
  _id: string;
  name: string;
  clientId: string;
  workflowStageId: string;
  description?: string;
  targetCompletionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilters {
  clientId?: string;
  workflowStageId?: string;
}

// ---------------------------------------------------------------------------
// Query-key helpers
// ---------------------------------------------------------------------------

const projectKeys = {
  all: ['projects'] as const,
  list: (filters?: ProjectFilters) =>
    filters ? (['projects', filters] as const) : (['projects'] as const),
  detail: (id: string) => ['projects', id] as const,
};

// ---------------------------------------------------------------------------
// Hooks — Queries
// ---------------------------------------------------------------------------

/** Fetch all projects, optionally filtered by clientId and/or workflowStageId. */
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters?.clientId) params.clientId = filters.clientId;
      if (filters?.workflowStageId)
        params.workflowStageId = filters.workflowStageId;
      const { data } = await apiClient.get<Project[]>('/api/projects', {
        params,
      });
      return data;
    },
  });
}

/** Fetch a single project by ID. */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Project>(`/api/projects/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Hooks — Mutations
// ---------------------------------------------------------------------------

/** Create a new project. */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      name: string;
      clientId: string;
      workflowStageId?: string;
      description?: string;
      targetCompletionDate?: string;
    }) => {
      const { data } = await apiClient.post<Project>('/api/projects', vars);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/** Update an existing project. */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      id: string;
      name?: string;
      clientId?: string;
      workflowStageId?: string;
      description?: string;
      targetCompletionDate?: string;
    }) => {
      const { id, ...body } = vars;
      const { data } = await apiClient.put<Project>(
        `/api/projects/${id}`,
        body,
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(vars.id) });
    },
  });
}

/** Delete a project. */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/** Update the workflow stage of a project. */
export function useUpdateWorkflowStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { id: string; workflowStageId: string }) => {
      const { data } = await apiClient.put<Project>(
        `/api/projects/${vars.id}/stage`,
        { workflowStageId: vars.workflowStageId },
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(vars.id) });
    },
  });
}
