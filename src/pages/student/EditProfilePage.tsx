import React, { useState, useEffect } from 'react';
import { userService } from '@/services/user.service';

const EditProfilePage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    userService.getProfile().then((data) => {
      setForm({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
      });
      setLoading(false);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.updateProfile({ name: form.name, phone: form.phone });
      setMessage('✅ Profile updated successfully!');
    } catch (error: any) {
      setMessage('❌ Error updating profile.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          placeholder="Full Name"
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          placeholder="Email"
        />
        <input
          type="text"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          placeholder="Phone"
        />
        <button className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700">
          Save Changes
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
};

export default EditProfilePage;
