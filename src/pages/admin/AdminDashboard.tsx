import { useEffect, useState } from "react";
import { BookOpen, Users, ArrowLeftRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { bookService } from "@/services/book.service";
import { memberService } from "@/services/member.service";
import { transactionService } from "@/services/transaction.service";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalBooks: 0,
    issuedBooks: 0,
    totalMembers: 0,
    activityRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [books, members, transactions] = await Promise.all([
        bookService.getAllBooks(),
        memberService.getAllMembers(),
        transactionService.getAllTransactions(),
      ]);

      // Calculate stats
      const totalBooks = books.reduce((acc, book) => acc + book.totalCopies, 0);
      const issuedBooks = transactions.filter(t => t.status === 'active' || t.status === 'overdue').length;
      const activityRate = totalBooks > 0 ? Math.round((issuedBooks / totalBooks) * 100) : 0;

      setStats({
        totalBooks,
        issuedBooks,
        totalMembers: members.length,
        activityRate,
      });

      // Get recent activities (last 5 transactions)
      const recent = transactions
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
        .slice(0, 5)
        .map(t => ({
          id: t._id,
          book: t.bookId?.title || 'Unknown Book',
          student: t.userId?.name || 'Unknown Student',
          action: t.status === 'returned' ? 'Returned' : 'Borrowed',
          time: formatDistanceToNow(new Date(t.returnDate || t.issueDate), { addSuffix: true }),
        }));

      setRecentActivities(recent);
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
    {
      title: "Total Books",
      value: isLoading ? "..." : stats.totalBooks.toLocaleString(),
      change: "All copies in library",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Issued Books",
      value: isLoading ? "..." : stats.issuedBooks.toString(),
      change: "Active borrowings",
      icon: ArrowLeftRight,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Total Members",
      value: isLoading ? "..." : stats.totalMembers.toString(),
      change: "Registered users",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Activity Rate",
      value: isLoading ? "..." : `${stats.activityRate}%`,
      change: "Books in circulation",
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated userRole="admin" userName="Admin" />
      <div className="flex">
        <Sidebar userRole="admin" />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                Overview of library statistics and recent activities
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
                      <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <p className="text-muted-foreground text-center py-8">Loading activities...</p>
                  ) : recentActivities.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No recent activities</p>
                  ) : (
                    recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{activity.book}</p>
                        <p className="text-sm text-muted-foreground">{activity.student}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            activity.action === "Borrowed"
                              ? "bg-accent/10 text-accent"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {activity.action}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
