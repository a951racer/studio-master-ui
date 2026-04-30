import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSong, useCreateSong, useUpdateSong } from '../../api/songs';
import ErrorMessage from '../../components/ErrorMessage';

interface SongFormValues {
  title: string;
  author: string;
  key: string;
}

export default function SongFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Determine mode: if the route is /songs/:id/edit we're editing,
  // if /projects/:id/songs/new we're creating.
  // For create mode, the projectId comes from the URL.
  const isEdit = Boolean(id) && window.location.pathname.includes('/edit');
  const projectId = isEdit ? undefined : id;

  const { data: existingSong, isLoading: isLoadingSong } = useSong(
    isEdit ? id! : '',
  );
  const createMutation = useCreateSong();
  const updateMutation = useUpdateSong();

  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SongFormValues>({
    defaultValues: { title: '', author: '', key: '' },
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (isEdit && existingSong) {
      reset({
        title: existingSong.title,
        author: existingSong.author,
        key: existingSong.key ?? '',
      });
    }
  }, [isEdit, existingSong, reset]);

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

  function onSubmit(values: SongFormValues) {
    setApiError(null);

    if (isEdit && id) {
      updateMutation.mutate(
        {
          id,
          title: values.title.trim(),
          author: values.author.trim(),
          key: values.key.trim() || undefined,
        },
        {
          onSuccess: () => navigate(`/songs/${id}`),
          onError: (err) => setApiError(extractErrorMessage(err)),
        },
      );
    } else if (projectId) {
      createMutation.mutate(
        {
          projectId,
          title: values.title.trim(),
          author: values.author.trim(),
          key: values.key.trim() || undefined,
        },
        {
          onSuccess: (data) => navigate(`/songs/${data._id}`),
          onError: (err) => setApiError(extractErrorMessage(err)),
        },
      );
    }
  }

  if (isEdit && isLoadingSong) {
    return <p className="text-sm text-gray-500">Loading song…</p>;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Song' : 'New Song'}
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
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            {...register('title', { required: 'Title is required' })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
          <ErrorMessage message={errors.title?.message} />
        </div>

        {/* Author */}
        <div>
          <label
            htmlFor="author"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Author <span className="text-red-500">*</span>
          </label>
          <input
            id="author"
            type="text"
            {...register('author', { required: 'Author is required' })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
          <ErrorMessage message={errors.author?.message} />
        </div>

        {/* Key */}
        <div>
          <label
            htmlFor="key"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Key
          </label>
          <input
            id="key"
            type="text"
            placeholder="e.g. C major, A minor"
            {...register('key')}
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
            onClick={() => {
              if (isEdit) {
                navigate(`/songs/${id}`);
              } else {
                navigate(`/projects/${projectId}/songs`);
              }
            }}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
