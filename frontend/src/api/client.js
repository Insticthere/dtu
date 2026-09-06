import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired/invalid on protected routes
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/verify')) {
        localStorage.removeItem('lm_token');
        localStorage.removeItem('lm_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
