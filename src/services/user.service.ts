import api from './api.config';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export const userService = {
  // ✅ Get user profile (works for both admin and student)
  getProfile: async (): Promise<UserProfile> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await api.get('/members/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  getAllMembers: async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const response = await api.get('/members', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
},


  // ✅ Update user profile (name, phone, etc.)
  updateProfile: async (data: {
    name?: string;
    phone?: string;
  }): Promise<UserProfile> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await api.put('/members/profile', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // ✅ Change password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');

    const response = await api.put('/members/change-password', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
