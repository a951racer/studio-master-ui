import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { isAxiosError } from 'axios';

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data, {
      onSuccess: (response) => {
        setToken(response.token);
        navigate('/');
      },
    });
  };

  const errorMessage = loginMutation.isError
    ? isAxiosError(loginMutation.error) && loginMutation.error.response?.data?.error
      ? loginMutation.error.response.data.error
      : 'Login failed. Please try again.'
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
              {...register('username', { required: 'Username is required' })}
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
              autoComplete="current-password"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-studio-orange focus:border-studio-orange"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 text-center">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-studio-orange text-white rounded py-2 text-sm font-medium hover:bg-studio-orange-dark focus:outline-none focus:ring-2 focus:ring-studio-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-sm text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-studio-orange hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
