import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSong, useDeleteSong } from '../../api/songs';
import FileListSection from '../Files/FileListSection';
import FileUploadForm from '../Files/FileUploadForm';

export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: song, isLoading, error } = useSong(id!);
  const deleteMutation = useDeleteSong();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  function handleDelete() {
    if (!id) return;
    setDeleteError(null);
    deleteMutation.mutate(id, {
      onSuccess: () => {
        if (song?.projectId) {
          navigate(`/projects/${song.projectId}`);
        } else {
          navigate('/projects');
        }
      },
      onError: (err) => {
        setShowDeleteConfirm(false);
        setDeleteError(extractErrorMessage(err));
      },
    });
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading song…</p>;
  }

  if (error || !song) {
    return <p className="text-sm text-red-600">Failed to load song.</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{song.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            <Link
              to={`/projects/${song.projectId}`}
              className="text-studio-orange hover:text-studio-orange-dark"
            >
              ← Back to Project
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/songs/${id}/edit`}
            className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark"
          >
            Edit
          </Link>
          {showDeleteConfirm ? (
            <span className="flex items-center gap-2">
              <span className="text-xs text-red-600">Delete this song?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {deleteError && (
        <div
          className="mb-4 rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {deleteError}
        </div>
      )}

      {/* Song info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Author</dt>
            <dd className="mt-1 text-gray-900">{song.author}</dd>
          </div>
          {song.key && (
            <div>
              <dt className="font-medium text-gray-500">Key</dt>
              <dd className="mt-1 text-gray-900">{song.key}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-gray-500">Portfolio</dt>
            <dd className="mt-1">
              {song.canPortfolio ? (
                <span className="inline-flex items-center rounded-full bg-studio-olive/20 px-2.5 py-0.5 text-xs font-medium text-studio-olive">
                  Approved for portfolio
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                  Not in portfolio
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Files section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <FileListSection songId={id!} />
      </div>

      {/* Upload form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <FileUploadForm songId={id!} />
      </div>
    </div>
  );
}
