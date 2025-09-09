import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, registerSchema } from "@shared/schema";
import type { LoginData, RegisterData } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      isApproved: false,
      isAdmin: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginData) => apiRequest("POST", "/api/login", credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data);
      toast({ title: "Success", description: "Logged in successfully" });
      // The App component will handle redirecting to the appropriate dashboard
      window.location.reload();
    },
    onError: (error: any) => {
      toast({ 
        title: "Login failed", 
        description: error.message || "Invalid credentials", 
        variant: "destructive" 
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterData) => apiRequest("POST", "/api/register", credentials),
    onSuccess: () => {
      toast({ 
        title: "Registration successful", 
        description: "Your account has been created and is pending approval by an administrator." 
      });
      setActiveTab("login");
      registerForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Registration failed", 
        description: error.message || "Registration failed", 
        variant: "destructive" 
      });
    },
  });

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Auth Form */}
        <Card className="w-full">
          <CardHeader>
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-4 gaming-gradient rounded-full flex items-center justify-center">
                <i className="fas fa-crown text-2xl text-accent-foreground"></i>
              </div>
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <p className="text-muted-foreground">Access your League of Kingdoms dashboard</p>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} data-testid="input-login-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field} 
                              data-testid="input-login-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full gaming-gradient text-accent-foreground hover:opacity-90"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Admin credentials: username <strong>admin</strong>, password <strong>password</strong></p>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} data-testid="input-register-firstname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} data-testid="input-register-lastname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} data-testid="input-register-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} data-testid="input-register-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create a password (min 6 characters)" 
                              {...field} 
                              data-testid="input-register-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full gaming-gradient text-accent-foreground hover:opacity-90"
                      disabled={registerMutation.isPending}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>

                <div className="text-center text-xs text-muted-foreground">
                  <p>New accounts require admin approval before accessing the system.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Column - Hero Section */}
        <div className="hidden lg:flex flex-col justify-center space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              League of Kingdoms
            </h1>
            <h2 className="text-2xl font-semibold text-primary mb-4">
              Land Development Programme
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Manage your kingdoms, track contributions, and optimize your land development strategy.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <i className="fas fa-castle text-primary"></i>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Kingdom Management</h3>
                <p className="text-sm text-muted-foreground">Track multiple kingdoms and their development progress</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <i className="fas fa-chart-line text-accent"></i>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Contribution Tracking</h3>
                <p className="text-sm text-muted-foreground">Monitor weekly, bi-weekly, and monthly contributions</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <i className="fas fa-money-bill-wave text-emerald-500"></i>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Payment Requests</h3>
                <p className="text-sm text-muted-foreground">Submit and track payment requests with admin approval</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}