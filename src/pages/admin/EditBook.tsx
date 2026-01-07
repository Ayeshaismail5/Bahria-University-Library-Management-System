import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { bookService, Book } from "@/services/book.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

const EditBook = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bookData, setBookData] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch existing book details
  useEffect(() => {
    const fetchBook = async () => {
      try {
        if (!id) return;
        const data = await bookService.getBookById(id);
        setBookData(data);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to fetch book details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, toast]);

  const handleChange = (field: keyof Book, value: string | number) => {
    setBookData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleUpdateBook = async () => {
    if (!id || !bookData) return;
    try {
      await bookService.updateBook(id, bookData);
      toast({
        title: "Success",
        description: "Book updated successfully",
      });
      navigate("/admin/books");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update book",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg">
        Loading book details...
      </div>
    );
  }

  if (!bookData) {
    return (
      <div className="flex items-center justify-center min-h-screen text-lg text-red-600">
        Book not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated userRole="admin" userName="Admin" />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-3xl mx-auto bg-card rounded-xl shadow-lg p-8 border border-border">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Edit Book</h1>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={bookData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={bookData.author}
                  onChange={(e) => handleChange("author", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={bookData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={bookData.isbn}
                  onChange={(e) => handleChange("isbn", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="totalCopies">Total Copies</Label>
                <Input
                  id="totalCopies"
                  type="number"
                  value={bookData.totalCopies}
                  onChange={(e) => handleChange("totalCopies", Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="availableCopies">Available Copies</Label>
                <Input
                  id="availableCopies"
                  type="number"
                  value={bookData.availableCopies}
                  onChange={(e) => handleChange("availableCopies", Number(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={bookData.description || ''}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>

              <Button className="w-full mt-4" onClick={handleUpdateBook}>
                Update Book
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditBook;
