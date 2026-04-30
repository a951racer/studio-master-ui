import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useClient, useCreateClient, useUpdateClient } from '../../api/clients';
import ErrorMessage from '../../components/ErrorMessage';

interface ClientFormValues {
  name: string;
  description: string;
}

export default function ClientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existingClient, isLoading: isLoadingClient } = useClient(
    id ?? '',
  );
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    defaultValues: { name: '', description: '' },
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (isEdit && existingClient) {
      reset({
        name: existingClient.name,
        description: existingClient.description ?? '',
      });
    }
  }, [isEdit, existingClient, reset]);

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

  function onSubmit(values: ClientFormValues) {
    setApiError(null);
    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
    };

    if (isEdit && id) {
      updateMutation.mutate(
        { id, ...payload },
        {
          onSuccess: () => navigate(`/clients/${id}`),
          onError: (err) => setApiError(extractErrorMessage(err)),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data) => navigate(`/clients/${data._id}`),
        onError: (err) => setApiError(extractErrorMessage(err)),
      });
    }
  }

  if (isEdit && isLoadingClient) {
    return <p className="text-sm text-gray-500">Loading client…</p>;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Client' : 'New Client'}
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
            onClick={() => navigate(isEdit ? `/clients/${id}` : '/clients')}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
