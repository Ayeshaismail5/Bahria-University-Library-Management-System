import { Link } from "react-router-dom";
import { BookOpen, Users, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import bahriaLogo from "@/assets/bahria-logo.png";

const Landing = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Extensive Collection",
      description: "Access thousands of books across various disciplines and categories.",
    },
    {
      icon: Users,
      title: "Easy Management",
      description: "Streamlined system for borrowing and returning books efficiently.",
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Protected student and admin portals with role-based permissions.",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Browse and manage your library activities anytime, anywhere.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-primary-foreground py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="flex justify-center md:justify-start mb-6">
                <img src={bahriaLogo} alt="Bahria University" className="h-24 w-24" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Bahria University
                <span className="block text-accent mt-2">Library Management System</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-primary-foreground/90">
                Your gateway to knowledge. Manage, browse, and access thousands of academic resources with ease.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  <Link to="#about">Learn More</Link>
                </Button>
              </div>
            </div>
            <div className="flex-1 hidden md:flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 bg-accent/20 rounded-full blur-3xl absolute -z-10"></div>
                <BookOpen className="w-64 h-64 text-accent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 px-4 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Why Choose Our System?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience a modern, efficient, and user-friendly library management platform designed for academic excellence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 text-primary-foreground/90">
            Join thousands of students and faculty members using our library management system.
          </p>
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/login">Access Library Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">
            © 2025 Bahria University. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
