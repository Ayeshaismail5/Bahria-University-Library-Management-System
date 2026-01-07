const API_URL = "http://localhost:5000/api/auth";

export const authService = {
  register: async (data: any) => {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to create account");
    }

    return res.json();
  },

  login: async (data: any) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return res.json();
  },

  saveUser: (userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
    // Also save token separately for API calls
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        // Return the user object, handling both { user: {...} } and direct user formats
        const user = userData.user || userData;
        // Normalize id field - backend uses 'id', frontend expects '_id'
        if (user && user.id && !user._id) {
          user._id = user.id.toString();
        }
        return user;
      } catch {
        return null;
      }
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  saveToken: (token: string) => {
    localStorage.setItem('token', token);
  },
};
