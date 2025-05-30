import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

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
import { MailIcon, ArrowLeftIcon, CheckCircleIcon } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/forgot-password", values);
      setIsSuccess(true);
      toast({
        title: "Reset email sent",
        description: "If an account with this email exists, a password reset link has been sent.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            <CardTitle className="text-2xl font-bold">Reset password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                <CheckCircleIcon className="h-12 w-12 text-primary" />
                <h3 className="text-lg font-medium">Check your email</h3>
                <p className="text-muted-foreground">
                  We've sent you a password reset link to your email address.
                </p>
                <p className="text-sm text-muted-foreground">
                  Don't see it? Check your spam folder or{" "}
                  <button
                    className="text-primary underline"
                    onClick={() => {
                      setIsSuccess(false);
                      form.reset();
                    }}
                  >
                    try again
                  </button>
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            type="email"
                            autoComplete="email"
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
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <MailIcon className="mr-2 h-4 w-4" />
                        Send reset link
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