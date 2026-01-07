import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bookService, Book } from "@/services/book.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

const BooksManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
    totalCopies: 1,
    description: "",
  });
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const data = await bookService.getAllBooks();
      setBooks(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch books",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBook = async () => {
    try {
      await bookService.createBook(newBook);
      toast({
        title: "Success",
        description: "Book added successfully",
      });
      setIsAddDialogOpen(false);
      setNewBook({
        title: "",
        author: "",
        category: "",
        isbn: "",
        totalCopies: 1,
        description: "",
      });
      fetchBooks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add book",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      await bookService.deleteBook(id);
      toast({
        title: "Success",
        description: "Book deleted successfully",
      });
      fetchBooks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete book",
        variant: "destructive",
      });
    }
  };

  const handleOpenEditDialog = (book: Book) => {
    setEditBook({ ...book });
    setIsEditDialogOpen(true);
  };

  const handleEditBook = async () => {
    if (!editBook || !editBook._id) return;
    try {
      setIsEditLoading(true);
      await bookService.updateBook(editBook._id, editBook);
      toast({
        title: "Success",
        description: "Book updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditBook(null);
      fetchBooks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update book",
        variant: "destructive",
      });
    } finally {
      setIsEditLoading(false);
    }
  };

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated userRole="admin" userName="Admin" />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Books Management</h1>
                <p className="text-muted-foreground mt-2">
                  Manage library books and inventory
                </p>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Book
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Book</DialogTitle>
                    <DialogDescription>
                      Enter the details of the book you want to add to the library.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        placeholder="Book title" 
                        value={newBook.title}
                        onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">Author</Label>
                      <Input 
                        id="author" 
                        placeholder="Author name" 
                        value={newBook.author}
                        onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Input 
                        id="category" 
                        placeholder="Book category" 
                        value={newBook.category}
                        onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="isbn">ISBN</Label>
                      <Input 
                        id="isbn" 
                        placeholder="ISBN number" 
                        value={newBook.isbn}
                        onChange={(e) => setNewBook({...newBook, isbn: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalCopies">Quantity</Label>
                      <Input 
                        id="totalCopies" 
                        type="number"
                        min="1"
                        placeholder="Number of copies" 
                        value={newBook.totalCopies}
                        onChange={(e) => setNewBook({...newBook, totalCopies: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input 
                        id="description" 
                        placeholder="Book description (optional)" 
                        value={newBook.description}
                        onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                      />
                    </div>
                    <Button className="w-full" onClick={handleAddBook}>Add Book</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search books by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Books Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading books...</TableCell>
                    </TableRow>
                  ) : filteredBooks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No books found</TableCell>
                    </TableRow>
                  ) : (
                    filteredBooks.map((book) => (
                      <TableRow key={book._id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{book.category}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              book.availableCopies > 0
                                ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {book.availableCopies > 0 ? `${book.availableCopies} Available` : "All Issued"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
  <div className="flex justify-end gap-2">
    {/* ✏️ Edit Button */}
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleOpenEditDialog(book)}
      className="text-blue-600 hover:text-blue-800"
    >
      <Edit className="h-4 w-4" />
    </Button>

    {/* 🗑 Delete Button */}
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleDeleteBook(book._id!)}
      className="text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</TableCell>

                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Book Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>
              Update the book details below.
            </DialogDescription>
          </DialogHeader>
          {editBook && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editBook.title}
                  onChange={(e) => setEditBook({ ...editBook, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-author">Author</Label>
                <Input
                  id="edit-author"
                  value={editBook.author}
                  onChange={(e) => setEditBook({ ...editBook, author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editBook.category}
                  onChange={(e) => setEditBook({ ...editBook, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-isbn">ISBN</Label>
                <Input
                  id="edit-isbn"
                  value={editBook.isbn}
                  onChange={(e) => setEditBook({ ...editBook, isbn: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-totalCopies">Total Copies</Label>
                  <Input
                    id="edit-totalCopies"
                    type="number"
                    value={editBook.totalCopies}
                    onChange={(e) => setEditBook({ ...editBook, totalCopies: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-availableCopies">Available Copies</Label>
                  <Input
                    id="edit-availableCopies"
                    type="number"
                    value={editBook.availableCopies}
                    onChange={(e) => setEditBook({ ...editBook, availableCopies: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editBook.description || ""}
                  onChange={(e) => setEditBook({ ...editBook, description: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleEditBook} disabled={isEditLoading}>
                {isEditLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BooksManagement;
