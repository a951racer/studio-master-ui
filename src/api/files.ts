import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileRecord {
  _id: string;
  songId: string;
  name: string;
  formatId: string;
  typeId: string;
  s3Url: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresignResponse {
  uploadUrl: string;
  key: string;
}

// ---------------------------------------------------------------------------
// Query-key helpers
// ---------------------------------------------------------------------------

const fileKeys = {
  all: ['files'] as const,
  list: (songId: string) => ['files', { songId }] as const,
};

// ---------------------------------------------------------------------------
// Hooks — Queries
// ---------------------------------------------------------------------------

/** Fetch all files for a song. */
export function useFiles(songId: string) {
  return useQuery({
    queryKey: fileKeys.list(songId),
    queryFn: async () => {
      const { data } = await apiClient.get<FileRecord[]>(
        `/api/songs/${songId}/files`,
      );
      return data;
    },
    enabled: !!songId,
  });
}

// ---------------------------------------------------------------------------
// Hooks — Mutations
// ---------------------------------------------------------------------------

/** Create a file metadata record for a song. */
export function useCreateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      songId: string;
      name: string;
      formatId: string;
      typeId: string;
      s3Url: string;
    }) => {
      const { songId, ...body } = vars;
      const { data } = await apiClient.post<FileRecord>(
        `/api/songs/${songId}/files`,
        body,
      );
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: fileKeys.list(vars.songId),
      });
    },
  });
}

/** Delete a file record. */
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
    },
  });
}

/** Generate a pre-signed S3 upload URL. */
export function usePresignUrl() {
  return useMutation({
    mutationFn: async (vars: { fileName: string; format: string }) => {
      const { data } = await apiClient.post<PresignResponse>(
        '/api/s3/presign',
        vars,
      );
      return data;
    },
  });
}
