import { useState, useEffect } from "react";
import { Calendar, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { transactionService, Transaction } from "@/services/transaction.service";
import { authService } from "@/services/auth.service";
import { format, differenceInDays } from "date-fns";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

const BorrowedBooks = () => {
  const [borrowedBooks, setBorrowedBooks] = useState<Transaction[]>([]);
  const [returnedBooks, setReturnedBooks] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [returningIds, setReturningIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleReturnBook = async (transactionId: string, bookTitle: string) => {
    try {
      setReturningIds(prev => new Set(prev).add(transactionId));
      
      const result = await transactionService.studentReturnBook(transactionId);
      
      toast({
        title: "Book Returned Successfully",
        description: result.fine > 0 
          ? `Fine: Rs ${result.fine} for late return. ${result.message}`
          : result.message,
        variant: result.fine > 0 ? "default" : "default"
      });
      
      // Refresh the transactions list
      await fetchTransactions();
    } catch (error: any) {
      toast({
        title: "Return Failed",
        description: error.response?.data?.message || "Failed to return book",
        variant: "destructive"
      });
    } finally {
      setReturningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await transactionService.getMyTransactions();

      // Filter by status - 'active' means currently borrowed
      const borrowed = data.filter(
        (trans) => trans.status === "active" || trans.status === "overdue"
      );
      const returned = data.filter(
        (trans) => trans.status === "returned"
      );

      setBorrowedBooks(borrowed);
      setReturnedBooks(returned);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch borrowed books",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysLeft = (dueDate: string) => differenceInDays(new Date(dueDate), new Date());

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated userRole="student" userName="Student" />
      <div className="flex">
        <Sidebar userRole="student" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">My Borrowed Books</h1>
              <p className="text-muted-foreground mt-2">
                Track your borrowed books and return history
              </p>
            </div>

            {/* Currently Borrowed */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Currently Borrowed</h2>
              {isLoading ? (
                <div className="text-center py-8">Loading borrowed books...</div>
              ) : borrowedBooks.length === 0 ? (
                <div className="text-center py-8">No borrowed books</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {borrowedBooks.map((trans) => {
                    const daysLeft = getDaysLeft(trans.dueDate);
                    const isOverdue = daysLeft < 0;
                    const daysOverdue = Math.abs(daysLeft);
                    const gracePeriod = 2;
                    const isInGracePeriod = isOverdue && daysOverdue <= gracePeriod;
                    const willHaveFine = isOverdue && daysOverdue > gracePeriod;
                    
                    return (
                      <Card key={trans._id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                                <BookOpen className="h-6 w-6 text-accent" />
                              </div>
                              <CardTitle className="text-lg">
                                {trans.bookId?.title || "Deleted Book"}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {trans.bookId?.author || "Unknown Author"}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <span className="inline-block text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {trans.bookId?.category || "N/A"}
                            </span>
                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-2" />
                                Issued: {format(new Date(trans.issueDate), "MMM dd, yyyy")}
                              </div>
                              <div className="flex items-center text-sm">
                                <Calendar className="h-4 w-4 mr-2 text-accent" />
                                <span className={`font-medium ${
                                  willHaveFine ? "text-destructive" : 
                                  isInGracePeriod ? "text-yellow-600" : 
                                  "text-accent"
                                }`}>
                                  Due: {format(new Date(trans.dueDate), "MMM dd, yyyy")} 
                                  ({isOverdue ? `${daysOverdue} days overdue` : `${daysLeft} days left`})
                                </span>
                              </div>
                              {isInGracePeriod && (
                                <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                  📅 Grace period: {gracePeriod - daysOverdue} days remaining (no fine yet)
                                </div>
                              )}
                              {willHaveFine && (
                                <div className="text-xs text-destructive bg-red-50 px-2 py-1 rounded">
                                  💰 Fine: Rs {(daysOverdue - gracePeriod) * 10} (Rs 10/day after grace period)
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button
                              onClick={() => handleReturnBook(trans._id, trans.bookId?.title || "Book")}
                              disabled={returningIds.has(trans._id)}
                              variant={willHaveFine ? "destructive" : "default"}
                              size="sm"
                            >
                              {returningIds.has(trans._id) ? "Returning..." : "Return Book"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Return History</h2>
              <Card>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="text-center py-4">Loading history...</div>
                  ) : returnedBooks.length === 0 ? (
                    <div className="text-center py-4">No return history</div>
                  ) : (
                    <div className="space-y-4">
                      {returnedBooks.map((trans) => (
                        <div
                          key={trans._id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                        >
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {trans.bookId?.title || "Deleted Book"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {trans.bookId?.author || "Unknown Author"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Returned</p>
                            <p className="text-sm font-medium text-foreground">
                              {trans.returnDate ? format(new Date(trans.returnDate), "MMM dd, yyyy") : "N/A"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BorrowedBooks;
