import { useState, useEffect } from "react";
import { Link, Redirect, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import * as z from "zod";
import { useAuth, hasAdminRights } from "@/hooks/use-auth";
import { 
  Card, CardHeader, CardTitle, CardDescription, 
  CardContent, CardFooter 
} from "@/components/ui/card";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Form, FormControl, FormDescription, FormField, 
  FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RefreshCw, AlertCircle, CheckCircle, Mail, Sparkles, Eye, EyeOff, Copy, RotateCcw 
} from "lucide-react";

const loginSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  businessName: z.string().min(2, { message: "Business name is required" }),
  businessType: z.string().min(1, { message: "Please select a business type" }),
  address: z.string().min(5, { message: "Please enter a valid address" }),
  zipCode: z.string().min(5, { message: "Please enter a valid ZIP code" }),
  phoneNumber: z.string().min(10, { message: "Please enter a valid phone number" }).max(15)
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation, demoAccountMutation, resendVerificationMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string | null;
  }>({ type: null, message: null });
  const [resendEmail, setResendEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  // Password generation function
  const generateStrongPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    setGeneratedPassword(newPassword);
    signupForm.setValue('password', newPassword);
    setShowPassword(true);
    toast({
      title: "Password Generated",
      description: "A strong password has been generated. Make sure to save it securely!",
    });
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: "Copied!",
      description: "Password copied to clipboard",
    });
  };
  
  // Set up login form first
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Check for verification status in URL and handle verification flows
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = localStorage.getItem('pendingVerificationEmail');
    
    // Handle successful verification from URL
    if (urlParams.get('verified') === 'true') {
      setVerificationStatus({
        type: 'success',
        message: 'Your email has been successfully verified! You can now log in.'
      });
      // Remove the query parameter from URL
      setLocation('/auth');
      // Clear the stored email
      localStorage.removeItem('pendingVerificationEmail');
    }
    
    // Show verification needed message after registration
    if (registerMutation.isSuccess) {
      setVerificationStatus({
        type: 'info',
        message: registerMutation.data?.requiresApproval
          ? 'Registration successful! Please check your email to verify your account. Once verified, your account will need admin approval before you can log in.'
          : 'Registration successful! Please check your email to verify your account.'
      });
      
      // Store the email for future verification attempts
      if (registerMutation.data?.username) {
        localStorage.setItem('pendingVerificationEmail', registerMutation.data.username);
        setResendEmail(registerMutation.data.username);
      }
    }
    
    // Handle verification and approval errors during login
    if (loginMutation.error) {
      const errorMessage = (loginMutation.error as any)?.message || 'Login failed';
      const errorResponse = (loginMutation.error as any)?.response;
      
      // Handle verification required error
      if (errorMessage.includes('verify')) {
        setVerificationStatus({
          type: 'error',
          message: 'Please verify your email before logging in. Check your inbox for a verification link.'
        });
        
        // Pre-fill the resend email field with the email that was used to login
        try {
          const loginFormEmail = loginForm.getValues('username');
          if (loginFormEmail) {
            setResendEmail(loginFormEmail);
            localStorage.setItem('pendingVerificationEmail', loginFormEmail);
          }
        } catch (e) {
          // Just ignore if we can't get the value yet
          console.log('Could not get login form values yet');
        }
      }
      // Handle pending approval error
      else if (errorMessage.includes('pending approval') || (errorResponse?.requiresApproval)) {
        setVerificationStatus({
          type: 'info',
          message: 'Your account is pending approval by the administrator. You will receive an email once your account has been approved.'
        });
      }
      // Handle rejected account error
      else if (errorMessage.includes('declined') || (errorResponse?.wasRejected)) {
        const reason = errorResponse?.rejectionReason || 'No reason provided';
        setVerificationStatus({
          type: 'error',
          message: `Your account registration was declined. Reason: ${reason}. Please contact support for more information.`
        });
      }
    }
    
    // If we have a stored email from a previous registration, pre-fill the resend field
    if (email && !resendEmail) {
      setResendEmail(email);
    }
  }, [location, loginMutation.error, registerMutation.isSuccess, registerMutation.data, setLocation, loginForm, resendEmail]);

  // Set up signup form
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      password: "",
      businessName: "",
      businessType: "",
      address: "",
      zipCode: "",
      phoneNumber: "",
    },
  });

  // Fetch business types for signup form
  const { data: businessTypes = [], isLoading: isLoadingBusinessTypes } = useQuery<any[]>({
    queryKey: ['/api/business-types'],
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const onSignupSubmit = (values: SignupFormValues) => {
    registerMutation.mutate(values);
  };

  const handleDemoAccount = () => {
    if (demoAccountMutation) {
      demoAccountMutation.mutate();
    } else {
      // Fallback to direct login with demo credentials
      loginMutation.mutate({
        username: "demo@adtrack.online",
        password: "demo123"
      });
    }
  };

  // Redirect if already logged in
  if (user) {
    // Check if user is an admin and redirect to admin panel
    if (hasAdminRights(user)) {
      console.log('Admin user detected, redirecting to admin panel');
      return <Redirect to="/admin" />;
    }
    // Regular user redirect to dashboard
    console.log('Regular user detected, redirecting to dashboard');
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Navigation removed from top position */}
      {/* Login/Signup Form */}
      <div className="md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          {verificationStatus.type && (
            <CardContent className="pt-6">
              <Alert
                variant={verificationStatus.type === 'error' ? 'destructive' : 'default'}
              >
                {verificationStatus.type === 'success' && (
                  <CheckCircle className="h-4 w-4" />
                )}
                {verificationStatus.type === 'error' && (
                  <AlertCircle className="h-4 w-4" />
                )}
                {verificationStatus.type === 'info' && (
                  <Mail className="h-4 w-4" />
                )}
                <AlertTitle>
                  {verificationStatus.type === 'success' && "Email Verified"}
                  {verificationStatus.type === 'error' && "Verification Required"}
                  {verificationStatus.type === 'info' && "Check Your Email"}
                </AlertTitle>
                <AlertDescription>
                  {verificationStatus.message}
                  
                  {/* Verification info with resend capability */}
                  {verificationStatus.type === 'error' && (
                    <div className="mt-3">
                      <div className="flex space-x-2 items-center">
                        <Input
                          placeholder="Enter your email"
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                          className="h-8 text-sm"
                          type="email"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => {
                            if (resendVerificationMutation) {
                              resendVerificationMutation.mutate({ email: resendEmail });
                            } else {
                              toast({
                                title: "Feature Unavailable",
                                description: "Email verification is not available in this version",
                                variant: "default"
                              });
                            }
                          }}
                          disabled={!resendEmail || (resendVerificationMutation?.isPending || false)}
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          {resendVerificationMutation?.isPending ? (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Resend
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {activeTab === "login" ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login" 
                ? "Log in to your AdTrack account to continue" 
                : "Sign up for AdTrack to start tracking your advertisement ROI"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="mb-4"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} type="email" />
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
                            <Input placeholder="••••••••" {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="text-sm text-right mb-4">
                      <Link href="/forgot-password" className="text-primary underline hover:text-primary/80">
                        Forgot your password?
                      </Link>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>

                {/* Demo account option removed */}
              </TabsContent>
              
              <TabsContent value="signup">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Business Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={isLoadingBusinessTypes}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessTypes?.map((type) => (
                                <SelectItem key={type.id} value={type.name}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St, City, State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} maxLength={5} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (required)</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} type="tel" />
                          </FormControl>
                          <FormDescription>
                            Required for notifications and account recovery
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="••••••••" 
                                {...field} 
                                type={showPassword ? "text" : "password"}
                                className="pr-20"
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                                {generatedPassword && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={copyPasswordToClipboard}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </FormControl>
                          <div className="flex items-center justify-between mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleGeneratePassword}
                              className="text-xs"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Generate Strong Password
                            </Button>
                            {generatedPassword && (
                              <span className="text-xs text-green-600 font-medium">
                                Strong password generated ✓
                              </span>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating account..." : "Sign Up"}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6">
                  {/* Demo account option removed */}
                </div>
              </TabsContent>
            </Tabs>


          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t pt-4">
            <div className="flex w-full justify-between">
              <p className="text-muted-foreground text-xs">
                &copy; {new Date().getFullYear()} AdTrack | <span className="text-blue-600 font-medium">AI-Powered Solutions</span>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Hero Section */}
      <div className="md:w-1/2 bg-primary text-white p-8 md:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Track Your ROI with Precision
          </h1>
          <p className="text-lg mb-8 opacity-90">
            AdTrack helps businesses of all sizes measure and optimize their marketing ROI with powerful analytics and insights.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-semibold text-xl mb-2">Performance Tracking</h3>
              <p className="opacity-90">Monitor campaigns with real-time analytics and ROI calculations</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-semibold text-xl mb-2">Competitor Analysis</h3>
              <p className="opacity-90">See how your campaigns compare to similar businesses</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-semibold text-xl mb-2">Smart Insights</h3>
              <p className="opacity-90">Get AI-powered recommendations to improve campaign performance</p>
            </div>
            <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-semibold text-xl mb-2">Visual Reports</h3>
              <p className="opacity-90">Beautiful dashboards that highlight what matters most</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <Link href="/about" className="bg-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-300 transition-colors shadow-sm border border-blue-300">
              About AdTrack →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}