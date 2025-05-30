// This file is a copy of minisite.tsx for the landing page route
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Zap, 
  Globe, 
  TrendingUp, 
  ArrowUpRight, 
  DollarSign, 
  TrendingDown,
  Brain,
  BarChart,
  Search,
  Award,
  LucideRocket,
  Target,
  AlignRight,
  Users,
  Building,
  Store
} from "lucide-react";

export default function Landing() {
  console.log("Landing component rendered");
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm py-4">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              AdTrack <span className="text-blue-600 font-medium">| AI-Powered Solutions</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="secondary" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900">
              Transform Your 
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Marketing Data </span> 
              Into Actionable Insights
            </h1>
            <p className="text-xl text-gray-600">
              AdTrack is the industry's first LLM specifically designed to track your ROI, compare your performance against local businesses, and optimize your advertising budget for maximum returns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Start 7-Day Free Trial
                  <LucideRocket className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/roi-calculator">
                <Button size="lg" variant="outline">
                  Try ROI Calculator
                  <BarChart className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center pt-4">
              <div className="flex -space-x-2 mr-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold border-2 border-white">98%</div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold border-2 border-white">ROI</div>
              </div>
              <p className="text-sm text-gray-500">Average ROI improvement with our AI insights</p>
            </div>
          </div>
          <div className="rounded-lg shadow-2xl bg-white p-6 border border-gray-200">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800">
                <LineChart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">ROI Performance Tracker</h3>
                <p className="text-sm text-gray-500">Real-time advertising performance</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-16 w-16 text-blue-600 opacity-50" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-500">ROI</p>
                  <p className="text-xl font-bold text-green-600">+82%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Spend</p>
                  <p className="text-xl font-bold text-gray-900">$5.2k</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Return</p>
                  <p className="text-xl font-bold text-gray-900">$9.5k</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How AdTrack Transforms Your Marketing</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform delivers clear insights and predictive analytics for better marketing decisions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Performance</h3>
              <p className="text-gray-600">
                Easily log all your advertising methods, spending, and timelines. Our system automatically calculates ROI percentages.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Comparisons</h3>
              <p className="text-gray-600">
                See how your advertising performs against similar businesses within your area with our geographic comparison tools.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Recommendations</h3>
              <p className="text-gray-600">
                Get intelligent suggestions for budget allocation and campaign optimization based on historical data and predictive analytics.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <PieChart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visual Analytics</h3>
              <p className="text-gray-600">
                Interactive charts and dashboards that break down your marketing performance by method, time period, and budget allocation.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Top Performers</h3>
              <p className="text-gray-600">
                Identify the most successful advertising methods and campaigns in your area to model your own strategies after.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Insights Storytelling</h3>
              <p className="text-gray-600">
                Our One-Click Marketing Insights transforms complex analytics into easy-to-understand narratives for better decision making.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator Preview */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Know Your Marketing ROI Before You Spend
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                Our AI-powered ROI Calculator helps you predict the potential return on your marketing investments before you commit your budget.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <p>Predictive analytics based on industry benchmarks</p>
                </div>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <p>Budget optimization recommendations</p>
                </div>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <p>Risk assessment for different advertising methods</p>
                </div>
              </div>
              <div className="mt-8">
                <Link href="/roi-calculator">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Try The ROI Calculator
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">ROI Calculator</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Advertising Method</label>
                    <div className="border rounded-md h-10 px-3 bg-gray-50 flex items-center text-gray-500">
                      Select Method
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    <div className="border rounded-md h-10 px-3 bg-gray-50 flex items-center text-gray-500">
                      Select Type
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                    <div className="border rounded-md h-10 px-3 bg-gray-50 flex items-center text-gray-500">
                      Enter amount
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                    <div className="border rounded-md h-10 px-3 bg-gray-50 flex items-center text-gray-500">
                      30 days
                    </div>
                  </div>
                </div>
                <div className="pt-4 pb-2 border-t border-gray-100">
                  <h4 className="font-medium mb-2">Projected Results:</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-xs text-gray-500">Estimated ROI</p>
                      <p className="text-lg font-bold text-green-600">67-89%</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="text-lg font-bold text-gray-700">$1.7-2.1k</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="text-lg font-bold text-blue-600">87%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Marketing ROI?</h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
            Join thousands of businesses using AdTrack's AI-powered solutions to optimize their advertising spend and maximize returns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-gray-100">
                Start Your Free Trial
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
                Learn More About AdTrack
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">AdTrack</h3>
              <p className="text-sm max-w-xs">
                The industry's first LLM specifically designed to track your ROI, compare your performance against local businesses, and optimize your advertising budget for maximum returns.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/features/roi-tracking" className="hover:text-white transition-colors">
                    ROI Tracking
                  </Link>
                </li>
                <li>
                  <Link href="/features/competitor-analysis" className="hover:text-white transition-colors">
                    Competitor Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/features/ai-recommendations" className="hover:text-white transition-colors">
                    AI Recommendations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/minisite#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/roi-calculator" className="hover:text-white transition-colors">
                    ROI Calculator
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>info@adtrack.online</li>
                <li>(702) 625-6504</li>
                <li>3800 Howard Hughes Pkwy<br />Las Vegas, NV 89169</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} AdTrack | <span className="text-blue-400 font-medium">AI-Powered Solutions</span>. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-4 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}