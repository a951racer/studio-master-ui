import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useDeleteProject } from '../../api/projects';
import { useClients } from '../../api/clients';
import { useLookupEntries } from '../../api/lookup';

export default function ProjectListPage() {
  // Filter state
  const [clientFilter, setClientFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Build filters object for the query
  const filters = {
    ...(clientFilter ? { clientId: clientFilter } : {}),
    ...(stageFilter ? { workflowStageId: stageFilter } : {}),
  };

  const {
    data: projects = [],
    isLoading,
    error,
  } = useProjects(Object.keys(filters).length > 0 ? filters : undefined);

  const { data: clients = [] } = useClients();
  const { data: stages = [] } = useLookupEntries('workflow-stage');
  const deleteMutation = useDeleteProject();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Build lookup maps for display
  const clientMap = new Map(clients.map((c) => [c._id, c.name]));
  const stageMap = new Map(stages.map((s) => [s._id, s.name]));

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
    return <p className="text-sm text-gray-500">Loading projects…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load projects.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <Link
          to="/projects/new"
          className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark"
        >
          New Project
        </Link>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label
            htmlFor="filter-client"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            Client
          </label>
          <select
            id="filter-client"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="filter-stage"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            Workflow Stage
          </label>
          <select
            id="filter-stage"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          >
            <option value="">All Stages</option>
            {stages.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
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

      {projects.length === 0 ? (
        <p className="text-sm text-gray-400">No projects found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflow Stage
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((project) => (
                <tr key={project._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <Link
                      to={`/projects/${project._id}`}
                      className="font-medium text-studio-orange hover:text-studio-orange-dark"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {clientMap.get(project.clientId) ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center rounded-full bg-studio-orange/20 px-2.5 py-0.5 text-xs font-medium text-studio-orange-dark">
                      {stageMap.get(project.workflowStageId) ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {deleteConfirmId === project._id ? (
                      <span className="flex items-center justify-end gap-2">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(project._id)}
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
                        onClick={() => setDeleteConfirmId(project._id)}
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
