import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useClient, useDeleteClient } from '../../api/clients';
import { getDisplayName } from '../../lib/displayName';
import ClientPersonsSection from './ClientPersonsSection';

// ---------------------------------------------------------------------------
// Types for populated person data returned by the API
// ---------------------------------------------------------------------------

interface PopulatedPerson {
  _id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  email?: string;
  phoneNumbers: { _id: string; number: string; typeId: string }[];
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading, error } = useClient(id!);
  const deleteMutation = useDeleteClient();
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
      onSuccess: () => navigate('/clients'),
      onError: (err) => {
        setShowDeleteConfirm(false);
        setDeleteError(extractErrorMessage(err));
      },
    });
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading client…</p>;
  }

  if (error || !client) {
    return <p className="text-sm text-red-600">Failed to load client.</p>;
  }

  // Find the primary person association (personId may be populated)
  const primaryAssoc = client.persons.find((p) => p.isPrimary);
  const primaryPerson = primaryAssoc
    ? (primaryAssoc.personId as unknown as PopulatedPerson)
    : null;
  // Check if personId is actually populated (object vs string)
  const isPrimaryPopulated =
    primaryPerson !== null &&
    typeof primaryPerson === 'object' &&
    '_id' in primaryPerson;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
        <div className="flex items-center gap-2">
          <Link
            to={`/clients/${id}/edit`}
            className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark"
          >
            Edit
          </Link>
          {showDeleteConfirm ? (
            <span className="flex items-center gap-2">
              <span className="text-xs text-red-600">Delete this client?</span>
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

      {/* Client info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {client.description && (
          <p className="text-sm text-gray-600 mb-4">{client.description}</p>
        )}

        {/* Primary contact */}
        {isPrimaryPopulated && primaryPerson && (
          <div className="border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Primary Contact
            </h2>
            <p className="text-base font-medium text-gray-900">
              {getDisplayName(primaryPerson)}
            </p>
            {primaryPerson.email && (
              <p className="text-sm text-gray-600 mt-1">
                {primaryPerson.email}
              </p>
            )}
            {primaryPerson.phoneNumbers.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {primaryPerson.phoneNumbers.map((phone) => (
                  <p key={phone._id} className="text-sm text-gray-600">
                    {phone.number}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Persons section */}
      <ClientPersonsSection clientId={id!} />
    </div>
  );
}
