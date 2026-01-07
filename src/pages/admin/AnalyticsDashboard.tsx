import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAdminDashboard, getPopularBooks, getCategoryStats, getOverdueTransactions } from '@/services/analytics.service';
import { BookOpen, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [popularBooks, setPopularBooks] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [overdueBooks, setOverdueBooks] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [dashboard, popular, categories, overdue] = await Promise.all([
        getAdminDashboard(),
        getPopularBooks(),
        getCategoryStats(),
        getOverdueTransactions()
      ]);
      
      setDashboardData(dashboard);
      setPopularBooks(popular.slice(0, 5));
      setCategoryStats(categories);
      setOverdueBooks(overdue.slice(0, 10));
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading analytics...</div>;

  const stats = dashboardData?.overallStats || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks || 0}</div>
            <p className="text-xs text-muted-foreground">{stats.totalCopies || 0} total copies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">{stats.completedTransactions || 0} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">Rs. {stats.totalFinesOwed || 0} in fines</p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Books */}
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Books</CardTitle>
          <CardDescription>Top borrowed books using SQL Views</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Borrows</TableHead>
                <TableHead className="text-right">Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {popularBooks.map((book) => (
                <TableRow key={book.id}>
                  <TableCell className="font-medium">{book.title}</TableCell>
                  <TableCell>{book.author}</TableCell>
                  <TableCell>{book.category}</TableCell>
                  <TableCell className="text-right">{book.totalBorrows}</TableCell>
                  <TableCell className="text-right">{book.availableCopies}/{book.totalCopies}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Category Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Books grouped by category</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Total Books</TableHead>
                <TableHead className="text-right">Total Copies</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Borrowed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryStats.map((cat, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{cat.category}</TableCell>
                  <TableCell className="text-right">{cat.totalBooks}</TableCell>
                  <TableCell className="text-right">{cat.totalCopies}</TableCell>
                  <TableCell className="text-right">{cat.availableCopies}</TableCell>
                  <TableCell className="text-right">{cat.borrowedCopies}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Overdue Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Books</CardTitle>
          <CardDescription>Books past their due date with calculated fines</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Days Overdue</TableHead>
                <TableHead className="text-right">Fine (Rs.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueBooks.map((item) => (
                <TableRow key={item.transactionId}>
                  <TableCell>
                    <div>{item.userName}</div>
                    <div className="text-xs text-muted-foreground">{item.studentid}</div>
                  </TableCell>
                  <TableCell className="font-medium">{item.bookTitle}</TableCell>
                  <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="destructive">{item.daysOverdue} days</Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-destructive">
                    Rs. {item.fineAmount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
