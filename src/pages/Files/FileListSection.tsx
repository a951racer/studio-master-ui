import { useState } from 'react';
import { useFiles, useDeleteFile } from '../../api/files';
import { useLookupEntries } from '../../api/lookup';

interface FileListSectionProps {
  songId: string;
}

export default function FileListSection({ songId }: FileListSectionProps) {
  const { data: files = [], isLoading, error } = useFiles(songId);
  const { data: fileTypes = [] } = useLookupEntries('file-type');
  const { data: fileFormats = [] } = useLookupEntries('file-format');
  const deleteMutation = useDeleteFile();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function extractErrorMessage(err: unknown): string {
    if (
      err &&
      typeof err === 'object' &&
      'response' in err &&
      (err as { response?: { data?: { error?: string } } }).response?.data
        ?.error
    ) {
      return (err as { response: { data: { error: string } } }).response.data
        .error;
    }
    return 'An unexpected error occurred';
  }

  function getTypeName(typeId: string): string {
    return fileTypes.find((t) => t._id === typeId)?.name ?? '—';
  }

  function getFormatName(formatId: string): string {
    return fileFormats.find((f) => f._id === formatId)?.name ?? '—';
  }

  function handleDelete(id: string) {
    setDeleteError(null);
    deleteMutation.mutate(id, {
      onSuccess: () => setDeleteConfirmId(null),
      onError: (err) => {
        setDeleteConfirmId(null);
        setDeleteError(extractErrorMessage(err));
      },
    });
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading files…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load files.</p>;
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Files
      </h2>

      {deleteError && (
        <div
          className="mb-4 rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {deleteError}
        </div>
      )}

      {files.length === 0 ? (
        <p className="text-sm text-gray-400">No files yet.</p>
      ) : (
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {files.map((file) => (
                <tr key={file._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <a
                      href={file.s3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-studio-orange hover:text-studio-orange-dark"
                    >
                      {file.name}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {getFormatName(file.formatId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {getTypeName(file.typeId)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {deleteConfirmId === file._id ? (
                      <span className="flex items-center justify-end gap-2">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(file._id)}
                          disabled={deleteMutation.isPending}
                          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(file._id)}
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
