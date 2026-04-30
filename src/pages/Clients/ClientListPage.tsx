import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useClients, useDeleteClient } from '../../api/clients';

export default function ClientListPage() {
  const { data: clients = [], isLoading, error } = useClients();
  const deleteMutation = useDeleteClient();
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
    return <p className="text-sm text-gray-500">Loading clients…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load clients.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Link
          to="/clients/new"
          className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark"
        >
          New Client
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

      {clients.length === 0 ? (
        <p className="text-sm text-gray-400">No clients yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Persons
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <Link
                      to={`/clients/${client._id}`}
                      className="font-medium text-studio-orange hover:text-studio-orange-dark"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {client.persons.length}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {deleteConfirmId === client._id ? (
                      <span className="flex items-center justify-end gap-2">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(client._id)}
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
                        onClick={() => setDeleteConfirmId(client._id)}
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
