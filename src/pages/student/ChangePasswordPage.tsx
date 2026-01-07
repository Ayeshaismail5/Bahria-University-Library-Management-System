import React, { useState } from 'react';
import api from '@/services/api.config';

const ChangePasswordPage: React.FC = () => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/users/change-password', form);
      setMessage('✅ Password changed successfully!');
    } catch (error: any) {
      setMessage('❌ Error changing password.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleChange}
          placeholder="Current Password"
          className="border p-2 w-full rounded"
        />
        <input
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
          placeholder="New Password"
          className="border p-2 w-full rounded"
        />
        <button className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700">
          Update Password
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
};

export default ChangePasswordPage;
