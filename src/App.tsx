import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import BooksManagement from "./pages/admin/BooksManagement";
import MembersManagement from "./pages/admin/MembersManagement";
import Transactions from "./pages/admin/Transactions";
import StudentDashboard from "./pages/student/StudentDashboard";
import BrowseBooks from "./pages/student/BrowseBooks";
import BorrowedBooks from "./pages/student/BorrowedBooks";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import EditProfilePage from '@/pages/student/EditProfilePage';
import ChangePasswordPage from '@/pages/student/ChangePasswordPage';
import MembersList from "@/pages/admin/MembersList";
import EditBook from "@/pages/admin/EditBook";
import BookRequests from "@/pages/admin/BookRequests";
import ProtectedRoute from "@/components/ProtectedRoute";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Admin Routes - Protected */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/books" element={<ProtectedRoute allowedRole="admin"><BooksManagement /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute allowedRole="admin"><MembersManagement /></ProtectedRoute>} />
          <Route path="/admin/transactions" element={<ProtectedRoute allowedRole="admin"><Transactions /></ProtectedRoute>} />
          <Route path="/admin/book-requests" element={<ProtectedRoute allowedRole="admin"><BookRequests /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute allowedRole="admin"><Profile userRole="admin" /></ProtectedRoute>} />
          <Route path="/admin/edit-book/:id" element={<ProtectedRoute allowedRole="admin"><EditBook /></ProtectedRoute>} />

          
          {/* Student Routes - Protected */}
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/books" element={<ProtectedRoute allowedRole="student"><BrowseBooks /></ProtectedRoute>} />
          <Route path="/student/borrowed" element={<ProtectedRoute allowedRole="student"><BorrowedBooks /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRole="student"><Profile userRole="student" /></ProtectedRoute>} />
          <Route path="/student/edit-profile" element={<ProtectedRoute allowedRole="student"><EditProfilePage /></ProtectedRoute>} />
          <Route path="/student/change-password" element={<ProtectedRoute allowedRole="student"><ChangePasswordPage /></ProtectedRoute>} />

        
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
