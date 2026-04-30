import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { usePresignUrl, useCreateFile } from '../../api/files';
import { useLookupEntries } from '../../api/lookup';
import ErrorMessage from '../../components/ErrorMessage';

interface FileUploadFormProps {
  songId: string;
}

interface FormValues {
  name: string;
  formatId: string;
  typeId: string;
}

type UploadStatus = 'idle' | 'presigning' | 'uploading' | 'saving' | 'done' | 'error';

export default function FileUploadForm({ songId }: FileUploadFormProps) {
  const { data: fileFormats = [] } = useLookupEntries('file-format');
  const { data: fileTypes = [] } = useLookupEntries('file-type');
  const presignMutation = usePresignUrl();
  const createFileMutation = useCreateFile();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: '', formatId: '', typeId: '' },
  });

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  async function onSubmit(values: FormValues) {
    if (!selectedFile) return;

    setApiError(null);
    setUploadProgress(0);

    // Resolve the format name for the presign request
    const formatEntry = fileFormats.find((f) => f._id === values.formatId);
    const formatName = formatEntry?.name ?? 'other';

    try {
      // Step 1: Get pre-signed URL
      setUploadStatus('presigning');
      const { uploadUrl } = await presignMutation.mutateAsync({
        fileName: selectedFile.name,
        format: formatName,
      });

      // Step 2: Upload file directly to S3
      setUploadStatus('uploading');
      await axios.put(uploadUrl, selectedFile, {
        headers: { 'Content-Type': selectedFile.type || 'application/octet-stream' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(
              Math.round((progressEvent.loaded * 100) / progressEvent.total),
            );
          }
        },
      });

      // Step 3: Create file metadata record
      const s3Url = uploadUrl.split('?')[0];

      setUploadStatus('saving');
      await createFileMutation.mutateAsync({
        songId,
        name: values.name.trim(),
        formatId: values.formatId,
        typeId: values.typeId,
        s3Url,
      });

      // Success — reset form
      setUploadStatus('done');
      reset({ name: '', formatId: '', typeId: '' });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reset status after a brief delay
      setTimeout(() => setUploadStatus('idle'), 2000);
    } catch (err) {
      setUploadStatus('error');
      setApiError(extractErrorMessage(err));
    }
  }

  const isProcessing =
    uploadStatus === 'presigning' ||
    uploadStatus === 'uploading' ||
    uploadStatus === 'saving';

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Upload File
      </h2>

      {apiError && (
        <div
          className="mb-4 rounded bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {apiError}
        </div>
      )}

      {uploadStatus === 'done' && (
        <div
          className="mb-4 rounded bg-studio-olive/10 border border-studio-olive/30 px-4 py-3 text-sm text-studio-olive"
          role="status"
        >
          File uploaded successfully.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* File input */}
        <div>
          <label
            htmlFor="file-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            File <span className="text-red-500">*</span>
          </label>
          <input
            id="file-input"
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-studio-cream file:text-studio-brown-dark hover:file:bg-studio-orange/20"
          />
          {!selectedFile && (
            <p className="mt-1 text-xs text-gray-400">Select a file to upload</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label
            htmlFor="file-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="file-name"
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          />
          <ErrorMessage message={errors.name?.message} />
        </div>

        {/* Format (from file-format lookup list) */}
        <div>
          <label
            htmlFor="file-format"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Format <span className="text-red-500">*</span>
          </label>
          <select
            id="file-format"
            {...register('formatId', { required: 'Format is required' })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          >
            <option value="">Select a format…</option>
            {fileFormats.map((fmt) => (
              <option key={fmt._id} value={fmt._id}>
                {fmt.name}
              </option>
            ))}
          </select>
          <ErrorMessage message={errors.formatId?.message} />
        </div>

        {/* Type (from file-type lookup list) */}
        <div>
          <label
            htmlFor="file-type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="file-type"
            {...register('typeId', { required: 'Type is required' })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange"
          >
            <option value="">Select a type…</option>
            {fileTypes.map((ft) => (
              <option key={ft._id} value={ft._id}>
                {ft.name}
              </option>
            ))}
          </select>
          <ErrorMessage message={errors.typeId?.message} />
        </div>

        {/* Upload progress */}
        {isProcessing && (
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>
                {uploadStatus === 'presigning' && 'Preparing upload…'}
                {uploadStatus === 'uploading' && `Uploading… ${uploadProgress}%`}
                {uploadStatus === 'saving' && 'Saving file record…'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-studio-orange h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    uploadStatus === 'presigning'
                      ? 10
                      : uploadStatus === 'uploading'
                        ? Math.max(10, uploadProgress * 0.8)
                        : 90
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isProcessing || !selectedFile}
          className="rounded bg-studio-orange px-4 py-2 text-sm font-medium text-white hover:bg-studio-orange-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Uploading…' : 'Upload'}
        </button>
      </form>
    </div>
  );
}
