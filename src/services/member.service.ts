import api from './api.config';

export interface Member {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export const memberService = {
  // Get all members (Admin only)
  getAllMembers: async (): Promise<Member[]> => {
    const response = await api.get('/members');
    return response.data.map((member: any) => ({
      _id: member.id.toString(),
      name: member.name,
      email: member.email,
      studentId: member.studentid,
      phone: member.phone,
      role: member.role,
      createdAt: member.createdAt,
    }));
  },
};
