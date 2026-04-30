import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  useProject,
  useCreateProject,
  useUpdateProject,
} from '../../api/projects';
import { useClients } from '../../api/clients';
import { useLookupEntries } from '../../api/lookup';
import ErrorMessage from '../../components/ErrorMessage';

interface ProjectFormValues {
  name: string;
  clientId: string;
  workflowStageId: string;
  description: string;
  targetCompletionDate: string;
}

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existingProject, isLoading: isLoadingProject } = useProject(
    id ?? '',
  );
  const { data: clients = [], isLoading: isLoadingClients } = useClients();
  const { data: stages = [], isLoading: isLoadingStages } =
    useLookupEntries('workflow-stage');

  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const [apiError, setApiError] = useState<string | null>(null);

  // Sort stages by sequenceOrder
  const sortedStages = [...stages].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    defaultValues: {
      name: '',
      clientId: '',
      workflowStageId: '',
      description: '',
      targetCompletionDate: '',
    },
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (isEdit && existingProject) {
      reset({
        name: existingProject.name,
        clientId: existingProject.clientId,
        workflowStageId: existingProject.workflowStageId,
        description: existingProject.description ?? '',
        targetCompletionDate: existingProject.targetCompletionDate
          ? existingProject.targetCompletionDate.slice(0, 10)
          : '',
      });
    }
  }, [isEdit, existingProject, reset]);

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

  function onSubmit(values: ProjectFormValues) {
    setApiError(null);
    const payload = {
      name: values.name.trim(),
      clientId: values.clientId,
      workflowStageId: values.workflowStageId || undefined,
      description: values.description.trim() || undefined,
      targetCompletionDate: values.targetCompletionDate || undefined,
    };

    if (isEdit && id) {
      updateMutation.mutate(
        { id, ...payload },
        {
          onSuccess: () => navigate(`/projects/${id}`),
          onError: (err) => setApiError(extractErrorMessage(err)),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data) => navigate(`/projects/${data._id}`),
        onError: (err) => setApiError(extractErrorMessage(err)),
      });
    }
  }

  if (isEdit && isLoadingProject) {
    return <p className="text-sm text-gray-500">Loading project…</p>;
  }

  if (isLoadingClients || isLoadingStages) {
    return <p className="text-sm text-gray-500">Loading form data…</p>;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Project' : 'New Project'}
      </h1>

      {apiError && (
        <div
          className="mb-4 rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {apiError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4"
      >
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
          <ErrorMessage message={errors.name?.message} />
        </div>

        {/* Client */}
        <div>
          <label
            htmlFor="clientId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Client <span className="text-red-500">*</span>
          </label>
          <select
            id="clientId"
            {...register('clientId', { required: 'Client is required' })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <ErrorMessage message={errors.clientId?.message} />
        </div>

        {/* Workflow Stage */}
        <div>
          <label
            htmlFor="workflowStageId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Workflow Stage
          </label>
          <select
            id="workflowStageId"
            {...register('workflowStageId')}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          >
            <option value="">Default (first stage)</option>
            {sortedStages.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            {...register('description')}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
        </div>

        {/* Target Completion Date */}
        <div>
          <label
            htmlFor="targetCompletionDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Target Completion Date
          </label>
          <input
            id="targetCompletionDate"
            type="date"
            {...register('targetCompletionDate')}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending || isSubmitting}
            className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(isEdit ? `/projects/${id}` : '/projects')
            }
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
