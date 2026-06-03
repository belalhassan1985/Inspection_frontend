import axios from 'axios';

const BASE_URL = 'http://localhost:3001';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  },
);

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = options.body ? JSON.parse(options.body as string) : undefined;

  // Decide response type based on endpoint
  const responseType = (endpoint.includes('/pdf') || endpoint.includes('/word')) ? 'blob' : 'json';

  try {
    const response = await api({
      url: endpoint,
      method: method as any,
      headers: headers as any,
      data: body,
      responseType,
    });
    return response.data;
  } catch (error: any) {
    let message = 'حدث خطأ أثناء معالجة الطلب';
    if (error.response && error.response.data) {
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errJson = JSON.parse(text);
          message = Array.isArray(errJson.message)
            ? errJson.message.join(' | ')
            : errJson.message || message;
        } catch (e) { }
      } else {
        message = Array.isArray(error.response.data.message)
          ? error.response.data.message.join(' | ')
          : error.response.data.message || message;
      }
    } else if (error.message) {
      message = error.message;
    }
    throw new Error(message);
  }
}
