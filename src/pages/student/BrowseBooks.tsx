import { useState, useEffect } from "react";
import { Search, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bookService, Book } from "@/services/book.service";
import { transactionService, Transaction } from "@/services/transaction.service";
import bookRequestService, { BookRequest } from "@/services/bookRequest.service";
import { authService } from "@/services/auth.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

const BrowseBooks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowedBookIds, setBorrowedBookIds] = useState<Set<string>>(new Set());
  const [pendingRequestBookIds, setPendingRequestBookIds] = useState<Set<string>>(new Set());
  const [recentlyReturnedBookIds, setRecentlyReturnedBookIds] = useState<Set<string>>(new Set());
  const [currentBorrowCount, setCurrentBorrowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [requestNote, setRequestNote] = useState("");
  const { toast } = useToast();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchBooks();
    fetchBorrowedBooks();
    fetchPendingRequests();
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

  const fetchBorrowedBooks = async () => {
    try {
      const transactions = await transactionService.getMyTransactions();
      const activeBorrows = transactions
        .filter((t: Transaction) => t.status === 'active' || t.status === 'overdue')
        .map((t: Transaction) => t.bookId?._id || t.bookId)
        .filter(Boolean);
      setBorrowedBookIds(new Set(activeBorrows));
      setCurrentBorrowCount(activeBorrows.length);
      
      // Track recently returned books (within 2 days)
      const recentReturns = transactions
        .filter((t: Transaction) => {
          if (t.status !== 'returned' || !t.returnDate) return false;
          const returnDate = new Date(t.returnDate);
          const daysSinceReturn = Math.floor((Date.now() - returnDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysSinceReturn < 2;
        })
        .map((t: Transaction) => t.bookId?._id || t.bookId)
        .filter(Boolean);
      setRecentlyReturnedBookIds(new Set(recentReturns));
    } catch (error) {
      console.error('Failed to fetch borrowed books:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const requests = await bookRequestService.getMyRequests();
      const pendingIds = requests
        .filter((r: BookRequest) => r.status === 'pending')
        .map((r: BookRequest) => r.bookId)
        .filter(Boolean);
      setPendingRequestBookIds(new Set(pendingIds));
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    }
  };

  // Borrow a book (Student)
  const handleBorrow = async (book: Book) => {
    try {
      if (!currentUser?._id) {
        toast({
          title: "Login Required",
          description: "Please log in to borrow a book",
          variant: "destructive",
        });
        return;
      }

      // If user has 2+ books, show request dialog
      if (currentBorrowCount >= 2) {
        setSelectedBook(book);
        setShowRequestDialog(true);
        return;
      }

      // Direct borrow for <2 books
      await transactionService.createTransaction({ bookId: book._id });

      toast({
        title: "Success",
        description: "Book borrowed successfully!",
      });

      fetchBooks();
      fetchBorrowedBooks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to borrow book",
        variant: "destructive",
      });
    }
  };

  // Submit book request with note
  const handleSubmitRequest = async () => {
    try {
      if (!selectedBook) return;

      const response = await transactionService.createTransaction({ 
        bookId: selectedBook._id,
        requestNote 
      });

      toast({
        title: "Request Submitted",
        description: "Your request has been sent to admin for approval. You currently have 2 books borrowed.",
      });

      setShowRequestDialog(false);
      setRequestNote("");
      setSelectedBook(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit request",
        variant: "destructive",
      });
    }
  };

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated userRole="student" userName="Student" />
      <div className="flex">
        <Sidebar userRole="student" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Browse Books</h1>
              <p className="text-muted-foreground mt-2">
                Discover and borrow books from our collection
              </p>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search books by title, author, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-full text-center py-8">Loading books...</div>
              ) : filteredBooks.length === 0 ? (
                <div className="col-span-full text-center py-8">No books found</div>
              ) : (
                filteredBooks.map((book) => {
                  const isAlreadyBorrowed = borrowedBookIds.has(book._id);
                  const isPendingRequest = pendingRequestBookIds.has(book._id);
                  const isRecentlyReturned = recentlyReturnedBookIds.has(book._id);
                  const isAvailable = book.availableCopies > 0;
                  const canBorrow = isAvailable && !isAlreadyBorrowed && !isRecentlyReturned && !isPendingRequest;
                  
                  let buttonText = "Borrow Book";
                  let buttonVariant: "default" | "secondary" = "default";
                  
                  if (isAlreadyBorrowed) {
                    buttonText = "Already Borrowed";
                    buttonVariant = "secondary";
                  } else if (isPendingRequest) {
                    buttonText = "Request Pending";
                    buttonVariant = "secondary";
                  } else if (isRecentlyReturned) {
                    buttonText = "Recently Returned (2-day cooldown)";
                    buttonVariant = "secondary";
                  } else if (!isAvailable) {
                    buttonText = "Not Available";
                    buttonVariant = "secondary";
                  }
                  
                  return (
                    <Card key={book._id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                          <BookOpen className="h-6 w-6 text-accent" />
                        </div>
                        <CardTitle className="text-lg">{book.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <span className="inline-block text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {book.category}
                          </span>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm font-medium ${
                                isAvailable
                                  ? "text-accent"
                                  : "text-destructive"
                              }`}
                            >
                              {isAvailable
                                ? `${book.availableCopies} Available`
                                : "All Issued"}
                            </span>

                            <Button
                              size="sm"
                              disabled={!canBorrow}
                              onClick={() => handleBorrow(book)}
                              variant={buttonVariant}
                              className="text-xs"
                            >
                              {buttonText}
                            </Button>
                          </div>
                          {isRecentlyReturned && (
                            <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                              ⏳ You can borrow this book again in 2 days
                            </div>
                          )}
                          {isPendingRequest && (
                            <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              ⏳ Waiting for admin approval
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Request Dialog for 3rd Book */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request 3rd Book Approval</DialogTitle>
            <DialogDescription>
              You currently have {currentBorrowCount} books borrowed. To borrow a 3rd book, please submit a request with a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Book: {selectedBook?.title}</Label>
              <Label className="text-sm text-muted-foreground">by {selectedBook?.author}</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestNote">Reason for Request</Label>
              <Textarea
                id="requestNote"
                placeholder="Please explain why you need this book urgently..."
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => {
              setShowRequestDialog(false);
              setRequestNote("");
              setSelectedBook(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrowseBooks;
