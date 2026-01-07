import api from "./api.config";

export interface Book {
  _id?: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  totalCopies: number;
  availableCopies: number;
  description?: string;
}

// ✅ All book API calls
export const bookService = {
  // Get all books
  getAllBooks: async (): Promise<Book[]> => {
    const res = await api.get("/books");
    return res.data.map((book: any) => ({
      _id: book.id.toString(),
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      totalCopies: book.quantity || 0,
      availableCopies: book.available || 0,
      description: book.description,
      createdAt: book.createdAt,
    }));
  },

  // Get single book by ID
  getBookById: async (id: string): Promise<Book> => {
    const res = await api.get(`/books/${id}`);
    const book = res.data;
    return {
      _id: book.id.toString(),
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      totalCopies: book.quantity || 0,
      availableCopies: book.available || 0,
      description: book.description,
    };
  },

  // Add new book (map frontend fields to backend fields)
  createBook: async (book: Partial<Book>) => {
    const payload = {
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      quantity: book.totalCopies || 1,
      description: book.description || '',
    };
    const res = await api.post("/books", payload);
    return res.data;
  },

  // Update existing book (map frontend fields to backend fields)
  updateBook: async (id: string, book: Partial<Book>) => {
    const payload = {
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      quantity: book.totalCopies,
      available: book.availableCopies,
      description: book.description || '',
    };
    const res = await api.put(`/books/${id}`, payload);
    return res.data;
  },

  // Delete a book
  deleteBook: async (id: string) => {
    const res = await api.delete(`/books/${id}`);
    return res.data;
  },
};
