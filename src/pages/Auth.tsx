import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import bahriaLogo from "@/assets/bahria-logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
 const [signupData, setSignupData] = useState({
  name: "",
  email: "",
  studentid: "",
  phone: "",
  password: "",
  role: "student",
});


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authService.login(loginData);

      if (response.token) {
        // Decode token to get user info (simplified - in production use a proper JWT library)
        const payload = JSON.parse(atob(response.token.split('.')[1]));
        const userData = { user: payload, token: response.token };
        authService.saveUser(userData);

        toast({
          title: "Login successful",
          description: `Welcome back!`,
        });

        if (payload.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      } else {
        throw new Error("Login failed");
      }

    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Ensure role defaults to "student" if empty
      const signupPayload = {
        ...signupData,
        role: signupData.role || "student"
      };

      const response = await authService.register(signupPayload);

      if (response.message !== "User registered successfully") {
        throw new Error(response.message);
      }

      toast({
        title: "Account created",
        description: "Your account has been created successfully!",
      });

      // If admin signup, auto-login and navigate to admin dashboard
      if (signupPayload.role === "admin") {
        const loginResponse = await authService.login({
          email: signupPayload.email,
          password: signupPayload.password,
        });

        if (loginResponse.token) {
          const payload = JSON.parse(atob(loginResponse.token.split('.')[1]));
          const userData = { user: payload, token: loginResponse.token };
          authService.saveUser(userData);

          toast({
            title: "Admin login successful",
            description: `Welcome Admin!`,
          });

          navigate("/admin/dashboard");
        } else {
          // Fallback to login tab if auto-login fails
          setActiveTab("login");
        }
      } else {
        setActiveTab("login");
      }

    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.response?.data?.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero text-primary-foreground p-12 flex-col justify-center items-center">
        <div className="max-w-md text-center">
          <img src={bahriaLogo} alt="Bahria University" className="h-32 w-32 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Bahria University</h1>
          <p className="text-xl mb-2 text-accent">Library Management System</p>
          <p className="text-primary-foreground/80 mt-6">
            Access thousands of academic resources and manage your library activities with ease.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">10K+</p>
              <p className="text-sm text-primary-foreground/80">Books</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">5K+</p>
              <p className="text-sm text-primary-foreground/80">Members</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">24/7</p>
              <p className="text-sm text-primary-foreground/80">Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img src={bahriaLogo} alt="Bahria University" className="h-20 w-20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary">Bahria University</h2>
            <p className="text-muted-foreground">Library Management</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your.email@bahria.edu.pk"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Fill in your details to create a new account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Your Name"
                        value={signupData.name}
                        onChange={(e) =>
                          setSignupData({ ...signupData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your.email@bahria.edu.pk"
                        value={signupData.email}
                        onChange={(e) =>
                          setSignupData({ ...signupData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-id">Student ID</Label>
                      <Input
                        id="signup-id"
                        type="text"
                        placeholder="XYZ-001"
                        value={signupData.studentid}
                        onChange={(e) =>
                          setSignupData({ ...signupData, studentid: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
  <Label htmlFor="signup-phone">Phone</Label>
  <Input
    id="signup-phone"
    type="text"
    placeholder="03XXXXXXXXX"
    value={signupData.phone}
    onChange={(e) =>
      setSignupData({ ...signupData, phone: e.target.value })
    }
    required
  />
</div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a strong password"
                        value={signupData.password}
                        onChange={(e) =>
                          setSignupData({ ...signupData, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Sign Up"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
