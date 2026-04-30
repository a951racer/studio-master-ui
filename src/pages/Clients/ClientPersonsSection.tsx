import { useState } from 'react';
import {
  useClientPersons,
  useAddPersonToClient,
  useUpdateClientPerson,
  useRemovePersonFromClient,
} from '../../api/clients';
import { useLookupEntries } from '../../api/lookup';
import { usePersons } from '../../api/persons';
import { getDisplayName } from '../../lib/displayName';

// ---------------------------------------------------------------------------
// Types for populated associations returned by GET /clients/:id/persons
// ---------------------------------------------------------------------------

interface PopulatedPerson {
  _id: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  email?: string;
}

interface PopulatedRole {
  _id: string;
  name: string;
}

interface PopulatedAssociation {
  personId: PopulatedPerson | string;
  roleId: PopulatedRole | string;
  isPrimary: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPersonFromAssoc(assoc: PopulatedAssociation): PopulatedPerson | null {
  if (typeof assoc.personId === 'object' && assoc.personId !== null) {
    return assoc.personId as PopulatedPerson;
  }
  return null;
}

function getRoleFromAssoc(assoc: PopulatedAssociation): PopulatedRole | null {
  if (typeof assoc.roleId === 'object' && assoc.roleId !== null) {
    return assoc.roleId as PopulatedRole;
  }
  return null;
}

function extractErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    (err as { response?: { data?: { error?: string } } }).response?.data?.error
  ) {
    return (err as { response: { data: { error: string } } }).response.data
      .error;
  }
  return 'An unexpected error occurred';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ClientPersonsSectionProps {
  clientId: string;
}

export default function ClientPersonsSection({
  clientId,
}: ClientPersonsSectionProps) {
  const {
    data: associations = [],
    isLoading,
    error,
  } = useClientPersons(clientId) as {
    data: PopulatedAssociation[] | undefined;
    isLoading: boolean;
    error: unknown;
  };

  const { data: roles = [] } = useLookupEntries('role');
  const { data: allPersons = [] } = usePersons();

  const addMutation = useAddPersonToClient();
  const updateMutation = useUpdateClientPerson();
  const removeMutation = useRemovePersonFromClient();

  const [sectionError, setSectionError] = useState<string | null>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);

  // Add person form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addPersonId, setAddPersonId] = useState('');
  const [addRoleId, setAddRoleId] = useState('');

  // Edit state
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState('');
  const [editIsPrimary, setEditIsPrimary] = useState(false);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addPersonId.trim() || !addRoleId) return;
    setSectionError(null);
    addMutation.mutate(
      { clientId, personId: addPersonId.trim(), roleId: addRoleId },
      {
        onSuccess: () => {
          setShowAddForm(false);
          setAddPersonId('');
          setAddRoleId('');
        },
        onError: (err) => setSectionError(extractErrorMessage(err)),
      },
    );
  }

  function startEdit(assoc: PopulatedAssociation) {
    const person = getPersonFromAssoc(assoc);
    const role = getRoleFromAssoc(assoc);
    if (!person) return;
    setEditingPersonId(person._id);
    setEditRoleId(role?._id ?? (typeof assoc.roleId === 'string' ? assoc.roleId : ''));
    setEditIsPrimary(assoc.isPrimary);
    setSectionError(null);
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPersonId) return;
    setSectionError(null);
    updateMutation.mutate(
      {
        clientId,
        personId: editingPersonId,
        roleId: editRoleId || undefined,
        isPrimary: editIsPrimary,
      },
      {
        onSuccess: () => setEditingPersonId(null),
        onError: (err) => setSectionError(extractErrorMessage(err)),
      },
    );
  }

  function handleRemove(personId: string) {
    setSectionError(null);
    removeMutation.mutate(
      { clientId, personId },
      {
        onSuccess: () => setRemoveConfirmId(null),
        onError: (err) => {
          setRemoveConfirmId(null);
          setSectionError(extractErrorMessage(err));
        },
      },
    );
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading persons…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Failed to load persons.</p>;
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Associated Persons
        </h2>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded bg-studio-orange px-3 py-1.5 text-xs font-medium text-white hover:bg-studio-orange-dark"
        >
          {showAddForm ? 'Cancel' : 'Add Person'}
        </button>
      </div>

      {sectionError && (
        <div
          className="mb-4 rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {sectionError}
        </div>
      )}

      {/* Add person form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="mb-4 p-4 bg-gray-50 rounded border border-gray-200 space-y-3"
        >
          <div>
            <label
              htmlFor="addPersonId"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Person
            </label>
            <select
              id="addPersonId"
              value={addPersonId}
              onChange={(e) => setAddPersonId(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
            >
              <option value="">Select a person</option>
              {allPersons.map((p) => {
                const hasPreferred = p.preferredName != null && p.preferredName.trim() !== '';
                const label = hasPreferred
                  ? `${p.lastName}, ${p.firstName} (${p.preferredName})`
                  : `${p.lastName}, ${p.firstName}`;
                return (
                  <option key={p._id} value={p._id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label
              htmlFor="addRoleId"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="addRoleId"
              value={addRoleId}
              onChange={(e) => setAddRoleId(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={addMutation.isPending || !addPersonId.trim() || !addRoleId}
            className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addMutation.isPending ? 'Adding…' : 'Add'}
          </button>
        </form>
      )}

      {/* Persons list */}
      {(associations as PopulatedAssociation[]).length === 0 ? (
        <p className="text-sm text-gray-400">No persons associated yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100" role="list">
          {(associations as PopulatedAssociation[]).map((assoc) => {
            const person = getPersonFromAssoc(assoc);
            const role = getRoleFromAssoc(assoc);
            if (!person) return null;

            const isEditing = editingPersonId === person._id;

            return (
              <li key={person._id} className="py-3">
                {isEditing ? (
                  <form
                    onSubmit={handleUpdate}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {getDisplayName(person)}
                    </span>
                    <select
                      value={editRoleId}
                      onChange={(e) => setEditRoleId(e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
                    >
                      <option value="">Select a role</option>
                      {roles.map((r) => (
                        <option key={r._id} value={r._id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={editIsPrimary}
                        onChange={(e) => setEditIsPrimary(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      Primary
                    </label>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="text-xs font-medium text-studio-orange hover:text-studio-orange-dark disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPersonId(null)}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {getDisplayName(person)}
                      </span>
                      {role && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {role.name}
                        </span>
                      )}
                      {assoc.isPrimary && (
                        <span className="inline-flex items-center rounded-full bg-studio-orange/20 px-2.5 py-0.5 text-xs font-medium text-studio-brown-dark">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(assoc)}
                        className="text-xs font-medium text-studio-orange hover:text-studio-orange-dark"
                      >
                        Edit
                      </button>
                      {removeConfirmId === person._id ? (
                        <span className="flex items-center gap-1">
                          <span className="text-xs text-red-600">Remove?</span>
                          <button
                            type="button"
                            onClick={() => handleRemove(person._id)}
                            disabled={removeMutation.isPending}
                            className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveConfirmId(null)}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setRemoveConfirmId(person._id)}
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
