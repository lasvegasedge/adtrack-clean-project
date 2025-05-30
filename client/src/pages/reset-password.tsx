import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LockIcon, ArrowLeftIcon, CheckCircleIcon } from "lucide-react";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Extract token from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      setTokenError("Reset token is missing. Please use the link from your email.");
    } else {
      setToken(tokenParam);
    }
  }, []);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (!token) return;
    
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/reset-password", {
        token,
        newPassword: values.newPassword,
      });
      
      setIsSuccess(true);
      toast({
        title: "Password reset successfully",
        description: "Your password has been reset. You can now log in with your new password.",
      });
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        setLocation("/auth");
      }, 3000);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to reset your password. The token may be invalid or expired.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (tokenError) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-red-500">Invalid Request</CardTitle>
              <CardDescription>
                {tokenError}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/forgot-password">
                  Request New Reset Link
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12">
      <div className="w-full max-w-md">
        <Link href="/auth" className="flex items-center text-sm text-muted-foreground mb-4 hover:text-primary">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to login
        </Link>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Create new password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                <CheckCircleIcon className="h-12 w-12 text-primary" />
                <h3 className="text-lg font-medium">Password reset successful</h3>
                <p className="text-muted-foreground">
                  Your password has been reset successfully. You will be redirected to the login page.
                </p>
                <Button asChild>
                  <Link href="/auth">
                    Go to login
                  </Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                        Resetting...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <LockIcon className="mr-2 h-4 w-4" />
                        Reset Password
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}