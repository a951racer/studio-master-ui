import { useState } from 'react';
import {
  useLookupEntries,
  useCreateLookupEntry,
  useUpdateLookupEntry,
  useDeleteLookupEntry,
  useReorderWorkflowStages,
} from '../../api/lookup';
import type { LookupEntry } from '../../api/lookup';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LookupType = 'file-format' | 'file-type' | 'workflow-stage' | 'phone-number-type' | 'role';

interface SectionConfig {
  type: LookupType;
  label: string;
}

const SECTIONS: SectionConfig[] = [
  { type: 'file-format', label: 'File Formats' },
  { type: 'file-type', label: 'File Types' },
  { type: 'workflow-stage', label: 'Workflow Stages' },
  { type: 'phone-number-type', label: 'Phone Number Types' },
  { type: 'role', label: 'Person Roles' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LookupSection({ type, label }: SectionConfig) {
  const { data: entries = [], isLoading, error } = useLookupEntries(type);
  const createMutation = useCreateLookupEntry();
  const updateMutation = useUpdateLookupEntry();
  const deleteMutation = useDeleteLookupEntry();
  const reorderMutation = useReorderWorkflowStages();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);

  // ---- Helpers to extract API error messages ----
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

  // ---- Create ----
  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSectionError(null);
    createMutation.mutate(
      { type, name: trimmed },
      {
        onSuccess: () => setNewName(''),
        onError: (err) => setSectionError(extractErrorMessage(err)),
      },
    );
  }

  // ---- Edit ----
  function startEdit(entry: LookupEntry) {
    setEditingId(entry._id);
    setEditName(entry.name);
    setSectionError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    setSectionError(null);
    updateMutation.mutate(
      { type, id: editingId, name: trimmed },
      {
        onSuccess: () => cancelEdit(),
        onError: (err) => setSectionError(extractErrorMessage(err)),
      },
    );
  }

  // ---- Delete ----
  function handleDelete(id: string) {
    setSectionError(null);
    deleteMutation.mutate(
      { type, id },
      {
        onSuccess: () => setDeleteConfirmId(null),
        onError: (err) => {
          setDeleteConfirmId(null);
          setSectionError(extractErrorMessage(err));
        },
      },
    );
  }

  // ---- Reorder (workflow-stage only) ----
  function moveEntry(index: number, direction: 'up' | 'down') {
    const newEntries = [...entries];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newEntries.length) return;
    [newEntries[index], newEntries[swapIndex]] = [
      newEntries[swapIndex],
      newEntries[index],
    ];
    const orderedIds = newEntries.map((e) => e._id);
    setSectionError(null);
    reorderMutation.mutate(orderedIds, {
      onError: (err) => setSectionError(extractErrorMessage(err)),
    });
  }

  const isWorkflowStage = type === 'workflow-stage';

  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{label}</h2>

      {/* Error banner */}
      {sectionError && (
        <div
          className="mb-4 rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {sectionError}
        </div>
      )}

      {/* Loading / fetch error */}
      {isLoading && (
        <p className="text-sm text-gray-500">Loading…</p>
      )}
      {error && !isLoading && (
        <p className="text-sm text-red-600">
          Failed to load entries.
        </p>
      )}

      {/* Entry list */}
      {!isLoading && !error && (
        <ul className="divide-y divide-gray-100 mb-4" role="list">
          {entries.length === 0 && (
            <li className="py-3 text-sm text-gray-400">No entries yet.</li>
          )}
          {entries.map((entry, index) => (
            <li
              key={entry._id}
              className="flex items-center gap-2 py-3"
            >
              {/* Reorder arrows for workflow stages */}
              {isWorkflowStage && (
                <div className="flex flex-col gap-0.5 mr-1">
                  <button
                    type="button"
                    disabled={index === 0 || reorderMutation.isPending}
                    onClick={() => moveEntry(index, 'up')}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none"
                    aria-label={`Move ${entry.name} up`}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={
                      index === entries.length - 1 ||
                      reorderMutation.isPending
                    }
                    onClick={() => moveEntry(index, 'down')}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none"
                    aria-label={`Move ${entry.name} down`}
                  >
                    ▼
                  </button>
                </div>
              )}

              {/* Name or inline edit form */}
              {editingId === entry._id ? (
                <form
                  onSubmit={handleUpdate}
                  className="flex items-center gap-2 flex-1"
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="text-sm font-medium text-studio-orange hover:text-studio-orange-dark disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800">
                    {entry.name}
                  </span>

                  {/* Action buttons */}
                  {deleteConfirmId === entry._id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-red-600">Delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry._id)}
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
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        className="text-xs font-medium text-studio-orange hover:text-studio-orange-dark"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(entry._id)}
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </span>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`New ${label.replace(/s$/, '').toLowerCase()} name`}
          className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !newName.trim()}
          className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function LookupListPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Admin — Lookup Lists
      </h1>
      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <LookupSection key={section.type} {...section} />
        ))}
      </div>
    </div>
  );
}
