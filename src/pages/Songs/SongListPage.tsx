import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSongs, useDeleteSong } from '../../api/songs';
import { useFiles } from '../../api/files';
import { useProject } from '../../api/projects';

/**
 * Small helper that fetches the file count for a single song.
 * Rendered once per row so each song gets its own query.
 */
function FileCount({ songId }: { songId: string }) {
  const { data: files = [], isLoading } = useFiles(songId);
  if (isLoading) return <span className="text-gray-400">…</span>;
  return <>{files.length}</>;
}

export default function SongListPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const { data: songs = [], isLoading, error } = useSongs(projectId ?? '');
  const { data: project } = useProject(projectId ?? '');
  const deleteMutation = useDeleteSong();

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
    return <p className="text-sm text-gray-500">Loading songs…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load songs.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Songs</h1>
          {project && (
            <p className="text-sm text-gray-500 mt-1">
              Project:{' '}
              <Link
                to={`/projects/${projectId}`}
                className="text-studio-orange hover:text-studio-orange-dark"
              >
                {project.name}
              </Link>
            </p>
          )}
        </div>
        <Link
          to={`/projects/${projectId}/songs/new`}
          className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark"
        >
          New Song
        </Link>
      </div>

      {deleteError && (
        <div
          className="mb-4 rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {deleteError}
        </div>
      )}

      {songs.length === 0 ? (
        <p className="text-sm text-gray-400">No songs yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Files
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {songs.map((song) => (
                <tr key={song._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <Link
                      to={`/songs/${song._id}`}
                      className="font-medium text-studio-orange hover:text-studio-orange-dark"
                    >
                      {song.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {song.author}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {song.key || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <FileCount songId={song._id} />
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {deleteConfirmId === song._id ? (
                      <span className="flex items-center justify-end gap-2">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(song._id)}
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
                        onClick={() => setDeleteConfirmId(song._id)}
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
