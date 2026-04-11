const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:8080').replace(/\/$/, '');

export const apiBaseUrl = API_BASE_URL;

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
