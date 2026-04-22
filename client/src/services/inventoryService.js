import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthConfig = () => {
  const user = JSON.parse(sessionStorage.getItem('user'));
  if (!user?.token) {
    throw new Error('No authentication token found');
  }
  return {
    headers: {
      Authorization: `Bearer ${user.token}`
    }
  };
};

// Auth Services
export const login = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/login`, userData);
  if (response.data) {
    sessionStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  if (response.data) {
    sessionStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = () => {
  sessionStorage.removeItem('user');
};

// Inventory Services
export const getInventory = async () => {
  const response = await axios.get(`${API_URL}/inventory`, getAuthConfig());
  return response.data;
};

export const addInventoryItem = async (itemData) => {
  const response = await axios.post(`${API_URL}/inventory`, itemData, getAuthConfig());
  return response.data;
};

export const deleteInventoryItem = async (id) => {
  const response = await axios.delete(`${API_URL}/inventory/${id}`, getAuthConfig());
  return response.data;
};

export const getInventoryStats = async () => {
  const response = await axios.get(`${API_URL}/inventory/stats`, getAuthConfig());
  return response.data;
};

// Request Services
export const createRequest = async (requestData) => {
  const response = await axios.post(`${API_URL}/requests`, requestData, getAuthConfig());
  return response.data;
};

export const getRequests = async () => {
  const response = await axios.get(`${API_URL}/requests`, getAuthConfig());
  return response.data;
};

export const confirmDelivery = async (id) => {
  const response = await axios.put(`${API_URL}/requests/${id}/confirm-delivery`, {}, getAuthConfig());
  return response.data;
};

export const updateRequestStatus = async (id, statusData) => {
  const response = await axios.put(`${API_URL}/requests/${id}`, statusData, getAuthConfig());
  return response.data;
};

// Tracking Services (Modular Extension)
export const createTrackingSession = async (sessionData) => {
  const response = await axios.post(`${API_URL}/tracking`, sessionData, getAuthConfig());
  return response.data;
};

export const updateDriverLocation = async (sessionId, location) => {
  const response = await axios.put(`${API_URL}/tracking/${sessionId}/location`, location);
  return response.data;
};

export const terminateTrackingSession = async (requestId) => {
  const response = await axios.post(`${API_URL}/tracking/${requestId}/terminate`, {}, getAuthConfig());
  return response.data;
};

export const getTrackingSession = async (requestId) => {
  const response = await axios.get(`${API_URL}/tracking/${requestId}`, getAuthConfig());
  return response.data;
};

