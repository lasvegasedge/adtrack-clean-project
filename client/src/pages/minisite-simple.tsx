import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
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
  ArrowRight,
  Target,
  AlignRight,
  Users,
  Building,
  Store
} from "lucide-react";

export default function MinisiteSimple() {
  console.log("MinisiteSimple component rendered");
  const [location] = useLocation();
  
  useEffect(() => {
    // Check if URL has a hash
    if (location.includes('#pricing')) {
      setTimeout(() => {
        const pricingSection = document.getElementById('pricing');
        if (pricingSection) {
          pricingSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);
  
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
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/roi-calculator">
                <Button size="lg" variant="outline">
                  Try ROI Calculator
                  <BarChart className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="pt-4">
              <p className="text-sm text-gray-500">Improve your average ROI with our proprietary AI insights</p>
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
              Our proprietary AI-powered platform delivers clear insights and predictive analytics for better marketing decisions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
            <Link href="/features/roi-tracking" className="bg-gray-50 p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Performance</h3>
              <p className="text-gray-600">
                Easily log all your advertising methods, spending, and timelines. Our system automatically calculates ROI percentages.
              </p>
            </Link>
            <Link href="/features/competitor-analysis" className="bg-gray-50 p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Comparisons</h3>
              <p className="text-gray-600">
                See how your advertising performs against similar businesses within your area with our geographic comparison tools.
              </p>
            </Link>
            <Link href="/features/ai-recommendations" className="bg-gray-50 p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Recommendations</h3>
              <p className="text-gray-600">
                Get intelligent suggestions for budget allocation and campaign optimization based on historical data and predictive analytics.
              </p>
            </Link>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <PieChart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Visual Analytics</h3>
              <p className="text-gray-600">
                Interactive charts and dashboards that break down your marketing performance by method, time period, and budget allocation.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Top Performers</h3>
              <p className="text-gray-600">
                Identify the most successful advertising methods and campaigns in your area to model your own strategies after.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
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

      {/* Pricing Preview */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Start with our 7-day free trial, then choose the plan that works best for your business
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Basic Plan</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$378.95</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">✓</div>
                  <span>Up to 5 active campaigns</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">✓</div>
                  <span>Basic ROI tracking</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">✓</div>
                  <span>Local competitor insights</span>
                </li>
              </ul>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="w-full">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <div className="border-2 border-blue-600 rounded-lg p-6 bg-white shadow-lg relative">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                POPULAR
              </div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Professional Plan</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$678.95</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">✓</div>
                  <span>Up to 20 active campaigns</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">✓</div>
                  <span>Advanced analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">✓</div>
                  <span>AI-powered recommendations</span>
                </li>
              </ul>
              <Link href="/auth">
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Premium Plan</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">$978.95</span>
                  <span className="text-gray-500">/month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">✓</div>
                  <span>Unlimited campaigns</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">✓</div>
                  <span>All Professional features</span>
                </li>
                <li className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-2">✓</div>
                  <span>Custom ROI reporting</span>
                </li>
              </ul>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="w-full">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Maximize Your Marketing ROI?</h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
            Get ahead of thousands of businesses looking for ways to use AI to optimize their advertising spend and maximize returns.
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
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
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
                  <Link href="/privacy-policy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}