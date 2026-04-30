interface ErrorMessageProps {
  message?: string;
}

/**
 * Displays a field-level validation error message below a form field.
 * Compatible with React Hook Form's error objects — pass `errors.fieldName?.message`.
 */
export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <p className="mt-1 text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}
