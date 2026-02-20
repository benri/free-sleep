import axios from 'axios';

const inDev = import.meta.env.VITE_ENV === 'dev';

if (inDev && !import.meta.env.VITE_POD_IP) {
  console.warn(
    'Missing ENV variable: VITE_POD_IP! ' +
    'If you\'d like to run the vite server locally and send API requests to your pod, you can run ' +
    '\'VITE_POD_IP=<YOUR_POD_IP> npm run dev\' ' +
    'ex: \'VITE_POD_IP=<YOUR_POD_IP> npm run dev\''
  );
}
const baseURL = inDev && import.meta.env.VITE_POD_IP ? `http://${import.meta.env.VITE_POD_IP}:3000` : `${window.location.origin}`;

const axiosInstance = axios.create({
  baseURL: `${baseURL}/api/`,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
export { baseURL };
