import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { isAxiosError } from 'axios';

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(
      { username: data.username, password: data.password },
      {
        onSuccess: (response) => {
          setToken(response.token);
          navigate('/');
        },
      },
    );
  };

  const errorMessage = registerMutation.isError
    ? isAxiosError(registerMutation.error) &&
      registerMutation.error.response?.status === 409
      ? 'Username is already taken'
      : 'Registration failed. Please try again.'
    : null;

  return (
    <div
      className="min-h-screen flex items-center justify-end px-8 sm:px-16 lg:px-24 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      <div className="w-full max-w-sm">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white/90 backdrop-blur-sm shadow-xl rounded-lg p-6 space-y-4"
        >
          <div className="flex justify-center mb-2">
            <img src="/login-logo.png" alt="Studio Master" className="h-32" />
          </div>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange focus:border-studio-orange"
              {...register('username', {
                required: 'Username is required',
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters',
                },
              })}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange focus:border-studio-orange"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange focus:border-studio-orange"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === watch('password') || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 text-center">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-studio-orange text-white rounded py-2 text-sm font-medium hover:bg-studio-orange-dark focus:outline-none focus:ring-2 focus:ring-studio-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {registerMutation.isPending ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-sm text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-studio-orange hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
