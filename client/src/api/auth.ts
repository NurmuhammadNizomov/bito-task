import api from '../lib/axios';

interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: { id: string; email: string; name: string; role: string };
  };
}

interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser(data: LoginInput) {
  const res = await api.post<AuthResponse>('/auth/login', data);
  return res.data.data;
}

export async function refreshTokenApi() {
  const res = await api.post<AuthResponse>('/auth/refresh');
  return res.data.data;
}

export async function logoutUser() {
  await api.post('/auth/logout');
}
