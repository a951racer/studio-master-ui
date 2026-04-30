import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  useProject,
  useDeleteProject,
  useUpdateWorkflowStage,
} from '../../api/projects';
import { useClients } from '../../api/clients';
import { useLookupEntries } from '../../api/lookup';
import { useSongs, useDeleteSong } from '../../api/songs';
import { useFiles } from '../../api/files';

/**
 * Small helper that fetches the file count for a single song.
 */
function FileCount({ songId }: { songId: string }) {
  const { data: files = [], isLoading } = useFiles(songId);
  if (isLoading) return <span className="text-gray-400">…</span>;
  return <>{files.length}</>;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading, error } = useProject(id!);
  const { data: clients = [] } = useClients();
  const { data: stages = [] } = useLookupEntries('workflow-stage');
  const { data: songs = [], isLoading: songsLoading } = useSongs(id ?? '');
  const deleteMutation = useDeleteProject();
  const stageMutation = useUpdateWorkflowStage();
  const deleteSongMutation = useDeleteSong();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);
  const [songDeleteConfirmId, setSongDeleteConfirmId] = useState<string | null>(null);
  const [songDeleteError, setSongDeleteError] = useState<string | null>(null);

  // Sort stages by sequenceOrder for the stepper
  const sortedStages = [...stages].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );

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
      onSuccess: () => navigate('/projects'),
      onError: (err) => {
        setShowDeleteConfirm(false);
        setDeleteError(extractErrorMessage(err));
      },
    });
  }

  function handleNextStage() {
    if (!id || !project) return;
    const currentIdx = sortedStages.findIndex(
      (s) => s._id === project.workflowStageId,
    );
    if (currentIdx < 0 || currentIdx >= sortedStages.length - 1) return;
    const nextStage = sortedStages[currentIdx + 1];
    setStageError(null);
    stageMutation.mutate(
      { id, workflowStageId: nextStage._id },
      {
        onError: (err) => setStageError(extractErrorMessage(err)),
      },
    );
  }

  function handleSetStage(stageId: string) {
    if (!id || !stageId) return;
    setStageError(null);
    stageMutation.mutate(
      { id, workflowStageId: stageId },
      {
        onError: (err) => setStageError(extractErrorMessage(err)),
      },
    );
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading project…</p>;
  }

  if (error || !project) {
    return <p className="text-sm text-red-600">Failed to load project.</p>;
  }

  const clientName =
    clients.find((c) => c._id === project.clientId)?.name ?? '—';
  const currentStageIdx = sortedStages.findIndex(
    (s) => s._id === project.workflowStageId,
  );
  const isLastStage = currentStageIdx === sortedStages.length - 1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${id}/edit`}
            className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark"
          >
            Edit
          </Link>
          {showDeleteConfirm ? (
            <span className="flex items-center gap-2">
              <span className="text-xs text-red-600">
                Delete this project?
              </span>
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

      {stageError && (
        <div
          className="mb-4 rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {stageError}
        </div>
      )}

      {/* Project info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Client</dt>
            <dd className="mt-1 text-gray-900">
              <Link
                to={`/clients/${project.clientId}`}
                className="text-studio-orange hover:text-studio-orange-dark"
              >
                {clientName}
              </Link>
            </dd>
          </div>
          {project.description && (
            <div className="sm:col-span-2">
              <dt className="font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-gray-900">{project.description}</dd>
            </div>
          )}
          {project.targetCompletionDate && (
            <div>
              <dt className="font-medium text-gray-500">
                Target Completion Date
              </dt>
              <dd className="mt-1 text-gray-900">
                {new Date(project.targetCompletionDate).toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Workflow Stage stepper */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Workflow Progress
        </h2>

        {/* Stepper */}
        {sortedStages.length > 0 && (
          <div className="flex items-center gap-1 mb-6 overflow-x-auto">
            {sortedStages.map((stage, idx) => {
              const isCurrent = stage._id === project.workflowStageId;
              const isPast = idx < currentStageIdx;
              return (
                <div key={stage._id} className="flex items-center">
                  {idx > 0 && (
                    <div
                      className={`h-0.5 w-6 ${
                        isPast || isCurrent ? 'bg-studio-orange' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  <div
                    className={`flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                      isCurrent
                        ? 'bg-studio-orange text-white ring-2 ring-studio-orange-light'
                        : isPast
                          ? 'bg-studio-orange/20 text-studio-orange-dark'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {stage.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stage controls */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleNextStage}
            disabled={isLastStage || stageMutation.isPending}
            className="rounded bg-studio-olive px-4 py-2 text-sm font-medium text-white hover:bg-studio-olive-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stageMutation.isPending ? 'Updating…' : 'Next Stage'}
          </button>

          <div className="flex items-center gap-2">
            <label
              htmlFor="set-stage"
              className="text-sm text-gray-600"
            >
              Set stage:
            </label>
            <select
              id="set-stage"
              value={project.workflowStageId}
              onChange={(e) => handleSetStage(e.target.value)}
              disabled={stageMutation.isPending}
              className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange disabled:opacity-50"
            >
              {sortedStages.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Songs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Songs
          </h2>
          <Link
            to={`/projects/${id}/songs/new`}
            className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark"
          >
            New Song
          </Link>
        </div>

        {songDeleteError && (
          <div
            className="mb-4 rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {songDeleteError}
          </div>
        )}

        {songsLoading && (
          <p className="text-sm text-gray-500">Loading songs…</p>
        )}

        {!songsLoading && songs.length === 0 && (
          <p className="text-sm text-gray-400">No songs yet.</p>
        )}

        {!songsLoading && songs.length > 0 && (
          <div className="overflow-hidden">
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
                      {songDeleteConfirmId === song._id ? (
                        <span className="flex items-center justify-end gap-2">
                          <span className="text-xs text-red-600">Delete?</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSongDeleteError(null);
                              deleteSongMutation.mutate(song._id, {
                                onSuccess: () => setSongDeleteConfirmId(null),
                                onError: (err) => {
                                  setSongDeleteConfirmId(null);
                                  setSongDeleteError(extractErrorMessage(err));
                                },
                              });
                            }}
                            disabled={deleteSongMutation.isPending}
                            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setSongDeleteConfirmId(null)}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSongDeleteConfirmId(song._id)}
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
    </div>
  );
}
