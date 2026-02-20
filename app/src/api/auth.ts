import axios from './api';

export type User = {
  id: number;
  username: string;
  role: string;
  created_at: string;
};

export const login = (username: string, password: string) =>
  axios.post<{ token: string }>('/auth/login', { username, password }).then(r => r.data);

export const getUsers = () =>
  axios.get<User[]>('/auth/users').then(r => r.data);

export const createUserApi = (username: string, password: string) =>
  axios.post<User>('/auth/users', { username, password }).then(r => r.data);

export const deleteUserApi = (id: number) =>
  axios.delete(`/auth/users/${id}`);
