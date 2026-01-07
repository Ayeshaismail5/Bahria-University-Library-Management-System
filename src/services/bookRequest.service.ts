import api from './api.config';

export interface BookRequest {
    id: string;
    userId: string;
    userName: string;
    studentid: string;
    email: string;
    bookId: string;
    bookTitle: string;
    bookAuthor: string;
    bookCategory: string;
    bookAvailable: number;
    requestNote: string;
    status: 'pending' | 'approved' | 'rejected';
    requestDate: string;
    reviewDate?: string;
    reviewNote?: string;
    currentBorrows?: number;
}

const bookRequestService = {
    // Get all pending requests (Admin)
    getPendingRequests: async (): Promise<BookRequest[]> => {
        const response = await api.get('/book-requests/pending');
        return response.data;
    },

    // Get user's own requests (Student)
    getMyRequests: async (): Promise<BookRequest[]> => {
        const response = await api.get('/book-requests/my-requests');
        return response.data;
    },

    // Approve a request (Admin)
    approveRequest: async (requestId: string, reviewNote?: string): Promise<void> => {
        await api.post(`/book-requests/approve/${requestId}`, { reviewNote });
    },

    // Reject a request (Admin)
    rejectRequest: async (requestId: string, reviewNote?: string): Promise<void> => {
        await api.post(`/book-requests/reject/${requestId}`, { reviewNote });
    },
};

export default bookRequestService;
