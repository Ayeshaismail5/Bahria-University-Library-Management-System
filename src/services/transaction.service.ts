import api from './api.config';
import { authService } from './auth.service';

export interface Transaction {
  _id?: string;
  bookId: any;
  userId: any;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue';
  fine: number;
}

export interface IssueBookData {
  bookId: string;
  userId?: string; // optional, backend uses JWT
  dueDate?: string;
  requestNote?: string; // For 3rd book request
}

export const transactionService = {
  // Get all transactions (Admin only)
  getAllTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get('/transactions');
    return response.data.map((transaction: any) => ({
      _id: transaction.id.toString(),
      userId: {
        _id: (transaction.userId || transaction.userid)?.toString(),
        name: transaction.userName || 'Unknown Student',
        studentId: transaction.userStudentId || transaction.userstudentid,
      },
      bookId: {
        _id: transaction.bookId?.toString() || transaction.bookid?.toString(),
        title: transaction.bookTitle,
        author: transaction.bookAuthor,
        category: transaction.bookCategory,
      },
      issueDate: transaction.transactionDate || transaction.transactiondate,
      dueDate: transaction.dueDate || transaction.duedate,
      returnDate: transaction.returnDate || transaction.returndate,
      status: transaction.status,
      fine: 0,
    }));
  },

  // Get current user's transactions (Student)
  getMyTransactions: async (): Promise<Transaction[]> => {
    const token = localStorage.getItem('token');
    const response = await api.get('/transactions/my', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.map((transaction: any) => ({
      _id: transaction.id.toString(),
      userId: transaction.userId || transaction.userid,
      bookId: {
        _id: transaction.bookId?.toString() || transaction.bookid?.toString(),
        title: transaction.bookTitle,
        author: transaction.bookAuthor,
        category: transaction.bookCategory,
      },
      issueDate: transaction.transactionDate || transaction.transactiondate,
      dueDate: transaction.dueDate || transaction.duedate,
      returnDate: transaction.returnDate || transaction.returndate,
      status: transaction.status,
      fine: 0,
    }));
  },

  // Issue book (Admin only)
  issueBook: async (data: IssueBookData): Promise<Transaction> => {
    const token = localStorage.getItem('token');
    const response = await api.post('/transactions/issue', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Return book (Admin only)
  returnBook: async (id: string): Promise<Transaction> => {
    const token = localStorage.getItem('token');
    const response = await api.put(`/transactions/return/${id}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Student borrows book
  createTransaction: async (data: { bookId: string; requestNote?: string }): Promise<any> => {
    const token = localStorage.getItem('token');
    const response = await api.post('/transactions', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Student returns book
  studentReturnBook: async (transactionId: string): Promise<{ message: string; fine: number }> => {
    const token = localStorage.getItem('token');
    const response = await api.put(`/transactions/return/${transactionId}`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};
