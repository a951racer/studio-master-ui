import { useMutation } from '@tanstack/react-query';
import apiClient from './client';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', {
    username,
    password,
  });
  return response.data;
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data.username, data.password),
  });
}

interface RegisterRequest {
  username: string;
  password: string;
}

interface RegisterResponse {
  token: string;
}

export async function register(username: string, password: string): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/api/auth/register', {
    username,
    password,
  });
  return response.data;
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data.username, data.password),
  });
}
