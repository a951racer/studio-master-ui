import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  usePerson,
  useCreatePerson,
  useUpdatePerson,
  useUpdatePhoneNumbers,
} from '../../api/persons';
import { useLookupEntries } from '../../api/lookup';
import ErrorMessage from '../../components/ErrorMessage';

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

interface PhoneNumberField {
  number: string;
  typeId: string;
}

interface PersonFormValues {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  notes: string;
  phoneNumbers: PhoneNumberField[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

export default function PersonFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existingPerson, isLoading: isLoadingPerson } = usePerson(
    id ?? '',
  );
  const { data: phoneTypes = [] } = useLookupEntries('phone-number-type');

  const createMutation = useCreatePerson();
  const updateMutation = useUpdatePerson();
  const phonesMutation = useUpdatePhoneNumbers();

  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      preferredName: '',
      email: '',
      notes: '',
      phoneNumbers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phoneNumbers',
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (isEdit && existingPerson) {
      reset({
        firstName: existingPerson.firstName,
        lastName: existingPerson.lastName,
        preferredName: existingPerson.preferredName ?? '',
        email: existingPerson.email ?? '',
        notes: existingPerson.notes ?? '',
        phoneNumbers: existingPerson.phoneNumbers.map((p) => ({
          number: p.number,
          typeId: p.typeId,
        })),
      });
    }
  }, [isEdit, existingPerson, reset]);

  function onSubmit(values: PersonFormValues) {
    setApiError(null);

    const personPayload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      preferredName: values.preferredName.trim() || undefined,
      email: values.email.trim() || undefined,
      notes: values.notes.trim() || undefined,
    };

    const phones = values.phoneNumbers
      .filter((p) => p.number.trim() && p.typeId)
      .map((p) => ({ number: p.number.trim(), typeId: p.typeId }));

    if (isEdit && id) {
      // Update person fields first, then update phone numbers
      updateMutation.mutate(
        { id, ...personPayload },
        {
          onSuccess: () => {
            phonesMutation.mutate(
              { id, phoneNumbers: phones },
              {
                onSuccess: () => navigate('/persons'),
                onError: (err) => setApiError(extractErrorMessage(err)),
              },
            );
          },
          onError: (err) => setApiError(extractErrorMessage(err)),
        },
      );
    } else {
      createMutation.mutate(
        { ...personPayload, phoneNumbers: phones },
        {
          onSuccess: () => navigate('/persons'),
          onError: (err) => setApiError(extractErrorMessage(err)),
        },
      );
    }
  }

  if (isEdit && isLoadingPerson) {
    return <p className="text-sm text-gray-500">Loading person…</p>;
  }

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    phonesMutation.isPending;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Person' : 'New Person'}
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
        {/* First Name */}
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            {...register('firstName', { required: 'First name is required' })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
          <ErrorMessage message={errors.firstName?.message} />
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            {...register('lastName', { required: 'Last name is required' })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
          <ErrorMessage message={errors.lastName?.message} />
        </div>

        {/* Preferred Name */}
        <div>
          <label
            htmlFor="preferredName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Preferred Name
          </label>
          <input
            id="preferredName"
            type="text"
            {...register('preferredName')}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register('notes')}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
        </div>

        {/* Phone Numbers */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-gray-700">
            Phone Numbers
          </legend>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-2 p-3 bg-gray-50 rounded border border-gray-200"
            >
              <div className="flex-1">
                <label
                  htmlFor={`phoneNumbers.${index}.number`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Number
                </label>
                <input
                  id={`phoneNumbers.${index}.number`}
                  type="text"
                  {...register(`phoneNumbers.${index}.number` as const, {
                    required: 'Phone number is required',
                  })}
                  placeholder="Phone number"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
                />
                <ErrorMessage
                  message={errors.phoneNumbers?.[index]?.number?.message}
                />
              </div>

              <div className="w-40">
                <label
                  htmlFor={`phoneNumbers.${index}.typeId`}
                  className="block text-xs font-medium text-gray-600 mb-1"
                >
                  Type
                </label>
                <select
                  id={`phoneNumbers.${index}.typeId`}
                  {...register(`phoneNumbers.${index}.typeId` as const, {
                    required: 'Type is required',
                  })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
                >
                  <option value="">Select type</option>
                  {phoneTypes.map((pt) => (
                    <option key={pt._id} value={pt._id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
                <ErrorMessage
                  message={errors.phoneNumbers?.[index]?.typeId?.message}
                />
              </div>

              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-5 rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                aria-label={`Remove phone number ${index + 1}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => append({ number: '', typeId: '' })}
            className="rounded border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800"
          >
            + Add Phone Number
          </button>
        </fieldset>

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
            onClick={() => navigate('/persons')}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
