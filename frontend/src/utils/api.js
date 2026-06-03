// src/utils/api.js
const API_BASE_URL = 'http://localhost:5000';

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token'); // หากมีระบบ Token

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }

  return data;
};