import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  Mail,
  FileSpreadsheet,
  Upload,
  Globe,
  TrendingUp,
  ArrowUpRight,
  CalendarDays,
  DollarSign,
  Smartphone,
  LayoutDashboard,
  Download,
  ExternalLink,
  Info,
  Trophy,
  Award,
  Gift,
  ArrowLeft,
} from "lucide-react";

export default function AboutPage() {
  const { user } = useAuth();
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6 max-w-5xl">
        <div className="flex flex-col space-y-8">
          {/* Back button */}
          <div className="mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                AdTrack Home
              </Button>
            </Link>
          </div>
          
          {/* Header section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Info className="h-7 w-7 text-primary" />
              About AdTrack | <span className="text-blue-600 font-medium">AI-Powered Solutions</span>
            </h1>
            <p className="text-muted-foreground">
              A sophisticated marketing performance analytics platform serving businesses of all sizes, from small businesses to enterprises
            </p>
          </div>

          <Separator />

          {/* Value Proposition */}
          <Card>
            <CardHeader>
              <CardTitle>Core Value Proposition</CardTitle>
              <CardDescription>
                How AdTrack helps your business make better advertising decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                AdTrack transforms complex advertising data into actionable strategic insights through intelligent visualization and predictive technologies. Our platform empowers businesses of all sizes—from small local shops to large enterprise corporations—to track ROI, compare performance against local competitors, and optimize advertising budgets for maximum returns.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-primary/5">
                  Easy Data Entry
                </Badge>
                <Badge variant="outline" className="bg-primary/5">
                  Automated ROI Calculation
                </Badge>
                <Badge variant="outline" className="bg-primary/5">
                  Competitive Intelligence
                </Badge>
                <Badge variant="outline" className="bg-primary/5">
                  Geographic Comparison
                </Badge>
                <Badge variant="outline" className="bg-primary/5">
                  Predictive Analytics
                </Badge>
                <Badge variant="outline" className="bg-primary/5">
                  Email Notifications
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Key Features</h2>
            
            {/* Campaign Tracking */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Comprehensive Campaign Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Keep track of all your advertising efforts in one place with powerful organization and visualization tools.
                </p>
                <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Easy Data Entry</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Log all advertising methods, spending, timelines, and upload ad samples (JPG, PNG, PDF).
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Automated ROI Calculation</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      System automatically calculates ROI percentages based on spend and revenue data.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Campaign Status Tracking</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Clear visibility into active vs. completed campaigns with timeline visualization.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitive Intelligence */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Competitive Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Understand how your advertising performance compares to similar businesses in your area.
                </p>
                <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Geographic Comparison</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      See how you compare to similar businesses within an adjustable radius (default 3 miles).
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Privacy-Focused Benchmarking</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Competitor data is anonymized to preserve privacy while still providing valuable insights.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Top Performers Analysis</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Displays key metrics and strategies of high-performing similar businesses.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Analytics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Advanced Analytics Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Visualize your marketing performance data through interactive charts and insightful breakdowns.
                </p>
                <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Multi-Dimensional Analysis</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Breakdowns by advertising method, time period, and budget allocation.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Performance Trends</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Visual representation of ROI trends over time using interactive charts.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Comparative Metrics</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Side-by-side comparison of different campaigns and advertising methods.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Predictive Intelligence */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Predictive Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Get ahead of the curve with AI-powered forecasts and strategic recommendations.
                </p>
                <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Dynamic Performance Insights</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The Trend Predictor provides personalized ROI forecasts for the next 12 months.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Seasonal Planning Guide</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Identifies optimal timing for advertising based on industry trends and historical data.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Smart Budget Allocation</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      AI-powered recommendations for distributing advertising budget across channels.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Notification System */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Notification System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Stay informed about your advertising performance without constantly checking the platform.
                </p>
                <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Performance Alerts</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Automated notifications when campaigns reach target ROI thresholds.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Reminder System</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gentle nudges to update campaign data for consistent tracking.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Weekly Summaries</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Digest of performance metrics and improvement opportunities.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benchmark Insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Competitive Benchmark Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Quickly analyze your business performance against local competitors with detailed visualizations.
                </p>
                <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">One-Click Analysis</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate instant insights comparing your business to local competitors.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Multi-View Visualization</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bar, line, and radar charts to visualize comparative data.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                      <h3 className="font-medium">Actionable Recommendations</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Specific suggestions based on competitive analysis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Demo Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Exploring The Platform</CardTitle>
              <CardDescription>
                A guided tour through AdTrack's key features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="dashboard">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      <span>Dashboard Overview</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      The dashboard provides a quick overview of your current performance metrics and active campaigns.
                      You can see at a glance:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Current ROI across all campaigns</li>
                      <li>Total ad spend and revenue generated</li>
                      <li>Top performing campaigns</li>
                      <li>How you compare to other businesses in your area</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="campaigns">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                      <span>Campaign Management</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Add and track advertising campaigns with detailed information:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Campaign name, description, and timeline</li>
                      <li>Advertising method selection from configurable options</li>
                      <li>Budget tracking with amount spent and earned</li>
                      <li>Upload advertisement samples in JPG, PNG, or PDF formats</li>
                      <li>Track campaign status (active/completed)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="analytics">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-primary" />
                      <span>Analytics Deep Dive</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      The enhanced analytics dashboard provides various visualization options:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>ROI breakdown by advertising method</li>
                      <li>Monthly performance trends over time</li>
                      <li>Campaign comparison charts</li>
                      <li>One-click competitor benchmark insights</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="comparison">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <span>Competitor Comparison</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      See how your business stacks up against local competitors:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Compare ROI with similar businesses in your area</li>
                      <li>View top performers in your business category</li>
                      <li>Analyze what advertising methods are most effective for your industry</li>
                      <li>All competitor data is anonymized to protect privacy</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="prediction">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>Predictive Features</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Use AI-powered predictions to optimize your advertising strategy:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Dynamic Performance Insights sidebar with ROI forecasts</li>
                      <li>Smart Budget Allocation tool for optimizing spend across channels</li>
                      <li>Seasonal Planning Guide for timing your advertising efforts</li>
                      <li>Personalized recommendations based on your business type and historical data</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="notifications">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>Email Notifications</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Stay informed with timely alerts and reminders:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Performance alerts when campaigns reach ROI targets</li>
                      <li>Reminders to update campaign data for accurate tracking</li>
                      <li>Weekly performance summaries with insights</li>
                      <li>Fully customizable notification preferences</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="demo">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <span>Demo Account Feature</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Explore the platform with pre-populated sample data:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>One-click demo account creation</li>
                      <li>Sample campaigns with realistic data</li>
                      <li>Test all features without entering your own data first</li>
                      <li>Great way to evaluate if AdTrack is right for your business</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Value Points */}
          <Card>
            <CardHeader>
              <CardTitle>Business Value</CardTitle>
              <CardDescription>
                How AdTrack improves your marketing effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Time Savings
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Eliminates manual ROI calculations and spreadsheet maintenance, saving hours of administrative work.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-primary" />
                    Decision Confidence
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Data-driven insights lead to smarter advertising decisions with increased confidence in outcomes.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Budget Optimization
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ensures marketing dollars are spent where they generate the highest returns for your business.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    Competitive Edge
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Understand the local marketing landscape without violating privacy, gaining strategic advantages.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Future Planning
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Anticipate trends and prepare for seasonal variations in advertising performance.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Proactive Management
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Email notifications keep you informed of changes in performance without constant monitoring.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Sharing Tools */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                Professional Sharing Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Easily share your marketing campaign results with stakeholders and team members through professional presentation options.
              </p>
              <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Email Sharing</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share campaign performance details directly via email with clients or team members.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Export as Image</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Download campaign results as high-quality images for presentations and reports.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Shareable Links</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate unique links to share campaign results with stakeholders even without an account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gamification and Rewards System */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Gamified Achievements & Rewards System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Stay motivated and unlock valuable features through our engaging achievement system and rewards store.
              </p>
              <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Achievement System</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Earn points by completing campaign goals, reaching ROI targets, and consistent platform usage.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Rewards Store</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Spend earned points to unlock premium features, advanced analytics, and exclusive templates.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <h3 className="font-medium">Feature Unlocks</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Access special capabilities like competitor insights, custom reports, and advanced analytics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download section */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Ready to get started?</h3>
                <p>Create a free demo account and explore the platform with sample data.</p>
              </div>
              <div className="flex gap-4">
                {!user ? (
                  <Button className="gap-2" asChild>
                    <Link href="/auth">
                      <ExternalLink className="h-4 w-4" />
                      Create Account
                    </Link>
                  </Button>
                ) : (
                  <Button className="gap-2" asChild>
                    <Link href="/">
                      <LayoutDashboard className="h-4 w-4" />
                      Go to Dashboard
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="gap-2" asChild>
                  <a href="#" onClick={() => window.print()}>
                    <Download className="h-4 w-4" />
                    Print this page
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}