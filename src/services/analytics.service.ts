import apiClient from './api.config';

// ============================================
// SQL VIEWS API CALLS
// ============================================

export const getBookInventory = async () => {
  const response = await apiClient.get('/analytics/views/book-inventory');
  return response.data;
};

export const getActiveTransactions = async () => {
  const response = await apiClient.get('/analytics/views/active-transactions');
  return response.data;
};

export const getUserStats = async () => {
  const response = await apiClient.get('/analytics/views/user-stats');
  return response.data;
};

export const getPopularBooks = async () => {
  const response = await apiClient.get('/analytics/views/popular-books');
  return response.data;
};

export const getCategoryStats = async () => {
  const response = await apiClient.get('/analytics/views/category-stats');
  return response.data;
};

export const getOverdueTransactions = async () => {
  const response = await apiClient.get('/analytics/views/overdue-transactions');
  return response.data;
};

// ============================================
// STORED PROCEDURES API CALLS
// ============================================

export const borrowBookProcedure = async (userId: number, bookId: number, dueDate: string) => {
  const response = await apiClient.post('/analytics/procedures/borrow-book', {
    userId,
    bookId,
    dueDate
  });
  return response.data;
};

export const returnBookProcedure = async (transactionId: number) => {
  const response = await apiClient.post('/analytics/procedures/return-book', {
    transactionId
  });
  return response.data;
};

export const getUserDashboard = async (userId: number) => {
  const response = await apiClient.get(`/analytics/procedures/user-dashboard/${userId}`);
  return response.data;
};

export const getAdminDashboard = async () => {
  const response = await apiClient.get('/analytics/procedures/admin-dashboard');
  return response.data;
};

export const searchBooks = async (searchTerm?: string, category?: string, availableOnly?: boolean) => {
  const params = new URLSearchParams();
  if (searchTerm) params.append('searchTerm', searchTerm);
  if (category) params.append('category', category);
  if (availableOnly) params.append('availableOnly', 'true');
  
  const response = await apiClient.get(`/analytics/procedures/search-books?${params}`);
  return response.data;
};
