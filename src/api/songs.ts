import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Song {
  _id: string;
  title: string;
  projectId: string;
  author: string;
  key?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Query-key helpers
// ---------------------------------------------------------------------------

const songKeys = {
  all: ['songs'] as const,
  list: (projectId: string) => ['songs', { projectId }] as const,
  detail: (id: string) => ['songs', id] as const,
};

// ---------------------------------------------------------------------------
// Hooks — Queries
// ---------------------------------------------------------------------------

/** Fetch all songs for a project. */
export function useSongs(projectId: string) {
  return useQuery({
    queryKey: songKeys.list(projectId),
    queryFn: async () => {
      const { data } = await apiClient.get<Song[]>(
        `/api/projects/${projectId}/songs`,
      );
      return data;
    },
    enabled: !!projectId,
  });
}

/** Fetch a single song by ID. */
export function useSong(id: string) {
  return useQuery({
    queryKey: songKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Song>(`/api/songs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Hooks — Mutations
// ---------------------------------------------------------------------------

/** Create a new song within a project. */
export function useCreateSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      projectId: string;
      title: string;
      author: string;
      key?: string;
    }) => {
      const { projectId, ...body } = vars;
      const { data } = await apiClient.post<Song>(
        `/api/projects/${projectId}/songs`,
        body,
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: songKeys.list(vars.projectId),
      });
    },
  });
}

/** Update an existing song. */
export function useUpdateSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      id: string;
      title?: string;
      author?: string;
      key?: string;
    }) => {
      const { id, ...body } = vars;
      const { data } = await apiClient.put<Song>(`/api/songs/${id}`, body);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
      queryClient.invalidateQueries({ queryKey: songKeys.detail(data._id) });
    },
  });
}

/** Delete a song (cascades to files). */
export function useDeleteSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/songs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: songKeys.all });
    },
  });
}
