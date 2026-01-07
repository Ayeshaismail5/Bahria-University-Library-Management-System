import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  User,
  ClipboardList,
} from "lucide-react";

interface SidebarProps {
  userRole: "admin" | "student";
}

const Sidebar = ({ userRole }: SidebarProps) => {
  const location = useLocation();

  const adminLinks = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/books", icon: BookOpen, label: "Books" },
    { to: "/admin/members", icon: Users, label: "Members" },
    { to: "/admin/transactions", icon: ArrowLeftRight, label: "Transactions" },
    { to: "/admin/book-requests", icon: ClipboardList, label: "Book Requests" },
    { to: "/admin/profile", icon: User, label: "Profile" },
  ];

  const studentLinks = [
    { to: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/student/books", icon: BookOpen, label: "Browse Books" },
    { to: "/student/borrowed", icon: ArrowLeftRight, label: "My Books" },
    { to: "/student/profile", icon: User, label: "Profile" },
  ];

  const links = userRole === "admin" ? adminLinks : studentLinks;

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen border-r border-sidebar-border">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-6 text-sidebar-foreground">
          {userRole === "admin" ? "Admin Panel" : "Student Portal"}
        </h2>
        <nav className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
