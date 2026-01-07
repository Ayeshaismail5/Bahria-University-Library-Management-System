import { useState, useEffect } from "react";
import { Search, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { transactionService, Transaction } from "@/services/transaction.service";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

const Transactions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await transactionService.getAllTransactions();
      setTransactions(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnBook = async (id: string) => {
    try {
      await transactionService.returnBook(id);
      toast({
        title: "Success",
        description: "Book returned successfully",
      });
      fetchTransactions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to return book",
        variant: "destructive",
      });
    }
  };

  const filteredTransactions = transactions.filter((trans) =>
    trans.bookId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trans.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trans.userId?.studentId?.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "issued":
        return "bg-primary/10 text-primary";
      case "returned":
        return "bg-accent/10 text-accent";
      case "overdue":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated userRole="admin" userName="Admin" />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Issue / Return Management</h1>
              <p className="text-muted-foreground mt-2">
                Track and manage book transactions
              </p>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by book, student name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due/Return Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading transactions...</TableCell>
                    </TableRow>
                  ) : filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No transactions found</TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((trans) => (
                      <TableRow key={trans._id}>
                        <TableCell className="font-medium">{trans.bookId?.title || "N/A"}</TableCell>
                        <TableCell>{trans.userId?.name || "N/A"}</TableCell>
                        <TableCell>{trans.userId?.studentId || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(trans.issueDate), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {trans.returnDate 
                              ? format(new Date(trans.returnDate), "MMM dd, yyyy")
                              : format(new Date(trans.dueDate), "MMM dd, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              trans.status
                            )}`}
                          >
                            {trans.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {trans.status === "issued" || trans.status === "overdue" ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReturnBook(trans._id!)}
                            >
                              Mark Returned
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">Complete</span>
                          )}
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
    </div>
  );
};

export default Transactions;
