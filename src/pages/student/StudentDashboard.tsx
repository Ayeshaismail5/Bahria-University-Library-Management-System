import { useEffect, useState } from "react";
import { BookOpen, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { bookService } from "@/services/book.service";
import { transactionService } from "@/services/transaction.service";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, format } from "date-fns";

const StudentDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    booksAvailable: 0,
    currentlyBorrowed: 0,
    booksReturned: 0,
    readingProgress: 0,
  });
  const [borrowedBooks, setBorrowedBooks] = useState<any[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const [books, transactions] = await Promise.all([
        bookService.getAllBooks(),
        transactionService.getMyTransactions(),
      ]);

      // Transactions are already filtered for current user
      const borrowed = transactions.filter(t => t.status === 'active' || t.status === 'overdue');
      const returned = transactions.filter(t => t.status === 'returned');
      
      // Get book IDs that are in cooldown (returned within last 2 days)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const cooldownBookIds = new Set(
        returned
          .filter(t => new Date(t.returnDate) > twoDaysAgo)
          .map(t => t.bookId?._id || t.bookId)
      );
      
      // Get currently borrowed book IDs
      const borrowedBookIds = new Set(borrowed.map(t => t.bookId?._id || t.bookId));
      
      // Calculate truly available books for this student
      const availableBooksForStudent = books.filter(book => 
        book.availableCopies > 0 && 
        !borrowedBookIds.has(book._id) && 
        !cooldownBookIds.has(book._id)
      ).length;

      const totalBooks = borrowed.length + returned.length;
      const progress = totalBooks > 0 ? Math.round((returned.length / totalBooks) * 100) : 0;

      setStats({
        booksAvailable: availableBooksForStudent,
        currentlyBorrowed: borrowed.length,
        booksReturned: returned.length,
        readingProgress: progress,
      });

      // Currently borrowed books (max 2 for dashboard)
      const currentBorrowed = borrowed.slice(0, 2).map(t => {
        const dueDate = new Date(t.dueDate);
        const today = new Date();
        const daysLeft = differenceInDays(dueDate, today);
        return {
          id: t._id,
          title: t.bookId?.title || 'Unknown Book',
          author: t.bookId?.author || 'Unknown Author',
          dueDate: format(dueDate, 'yyyy-MM-dd'),
          daysLeft,
        };
      });
      setBorrowedBooks(currentBorrowed);

      // Recommended books (max 3) - exclude borrowed and cooldown books
      const recommended = books
        .filter(book => 
          book.availableCopies > 0 && 
          !borrowedBookIds.has(book._id) && 
          !cooldownBookIds.has(book._id)
        )
        .slice(0, 3)
        .map(book => ({
          id: book._id,
          title: book.title,
          author: book.author,
          category: book.category,
        }));
      setRecommendedBooks(recommended);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statsConfig = [
    { title: "Available to Borrow", value: isLoading ? "..." : stats.booksAvailable.toString(), icon: BookOpen, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Currently Borrowed", value: isLoading ? "..." : stats.currentlyBorrowed.toString(), icon: Clock, color: "text-accent", bgColor: "bg-accent/10" },
    { title: "Books Returned", value: isLoading ? "..." : stats.booksReturned.toString(), icon: CheckCircle2, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Reading Progress", value: isLoading ? "..." : `${stats.readingProgress}%`, icon: TrendingUp, color: "text-accent", bgColor: "bg-accent/10" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated userRole="student" userName="Student" />
      <div className="flex">
        <Sidebar userRole="student" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Student Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back! Here's your library activity overview
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statsConfig.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Currently Borrowed */}
              <Card>
                <CardHeader><CardTitle>Currently Borrowed</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? <p className="text-muted-foreground text-center py-8">Loading...</p> :
                      borrowedBooks.length === 0 ? <p className="text-muted-foreground text-center py-8">No borrowed books</p> :
                      borrowedBooks.map((book) => (
                        <div key={book.id} className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                          <h3 className="font-semibold text-foreground">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                          <div className="flex justify-between items-center mt-3">
                            <p className="text-xs text-muted-foreground">Due: {book.dueDate}</p>
                            <span className={`text-xs font-medium ${book.daysLeft < 0 ? 'text-destructive' : 'text-accent'}`}>
                              {book.daysLeft < 0 ? `${Math.abs(book.daysLeft)} days overdue` : `${book.daysLeft} days left`}
                            </span>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                  <Button className="w-full mt-4" variant="outline" asChild>
                    <Link to="/student/borrowed">View All Borrowed Books</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Recommended Books */}
              <Card>
                <CardHeader><CardTitle>Recommended for You</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isLoading ? <p className="text-muted-foreground text-center py-8">Loading...</p> :
                      recommendedBooks.length === 0 ? <p className="text-muted-foreground text-center py-8">No books available</p> :
                      recommendedBooks.map((book) => (
                        <div key={book.id} className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                          <h3 className="font-semibold text-foreground">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">{book.author}</p>
                          <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">{book.category}</span>
                        </div>
                      ))
                    }
                  </div>
                  <Button className="w-full mt-4" asChild>
                    <Link to="/student/books">Browse All Books</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
