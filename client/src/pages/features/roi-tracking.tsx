import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, BarChart3, Calculator, ChartPieIcon, ArrowUpRight, LineChart, PieChart } from "lucide-react";
import { useEffect } from "react";

export default function ROITrackingFeature() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm py-4">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/landing-no-pricing">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 cursor-pointer">
                AdTrack <span className="text-blue-600 font-medium">| AI-Powered Solutions</span>
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth">
              <Button variant="secondary" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Feature Content */}
      <main className="container mx-auto px-4 md:px-6 py-12">
        <div className="flex items-center mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 mt-8">
          <div className="lg:w-1/2">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">ROI Tracking</h1>
            <p className="text-xl text-gray-600 mb-8">
              AdTrack provides powerful tools to measure, analyze, and optimize your marketing ROI with precision.
            </p>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <Calculator className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Accurate ROI Calculation</h3>
                  <p className="mt-2 text-gray-600">
                    Easily track and calculate return on investment for all your marketing campaigns. Our system automatically calculates ROI using the formula: ((Revenue - Cost) / Cost) × 100%.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Multi-Channel Attribution</h3>
                  <p className="mt-2 text-gray-600">
                    Understand which marketing channels deliver the best results with advanced attribution modeling that helps you allocate your budget more effectively.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <LineChart className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Trend Analysis</h3>
                  <p className="mt-2 text-gray-600">
                    Track your marketing performance over time with detailed trend analysis, enabling you to identify patterns and optimize future campaigns.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <PieChart className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Custom Reports</h3>
                  <p className="mt-2 text-gray-600">
                    Generate comprehensive, customizable reports that transform complex data into easy-to-understand visualizations for stakeholders at all levels.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <Link href="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Start Your Free Trial
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:w-1/2 mt-8 lg:mt-0">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">ROI Tracking Dashboard</h3>
                <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 flex flex-col">
                    {/* Header */}
                    <div className="bg-blue-600 text-white p-2 text-sm">
                      Campaign Performance Dashboard
                    </div>

                    {/* Dashboard content */}
                    <div className="flex-1 grid grid-cols-2 gap-2 p-3 bg-white">
                      {/* Top left chart: ROI by channel */}
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600 font-medium mb-2">ROI by Channel</div>
                        <div className="h-24 flex items-end space-x-1 px-2">
                          <div className="w-1/5 bg-blue-500 rounded-t" style={{ height: '40%' }}>
                            <div className="text-xs text-center text-white mt-1">FB</div>
                          </div>
                          <div className="w-1/5 bg-green-500 rounded-t" style={{ height: '85%' }}>
                            <div className="text-xs text-center text-white mt-1">IG</div>
                          </div>
                          <div className="w-1/5 bg-yellow-500 rounded-t" style={{ height: '60%' }}>
                            <div className="text-xs text-center text-white mt-1">SM</div>
                          </div>
                          <div className="w-1/5 bg-purple-500 rounded-t" style={{ height: '75%' }}>
                            <div className="text-xs text-center text-white mt-1">G</div>
                          </div>
                          <div className="w-1/5 bg-red-500 rounded-t" style={{ height: '50%' }}>
                            <div className="text-xs text-center text-white mt-1">TV</div>
                          </div>
                        </div>
                      </div>

                      {/* Top right chart: Trend line */}
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600 font-medium mb-2">ROI Trend (6 Months)</div>
                        <div className="h-24 flex items-center justify-center">
                          <svg width="100%" height="100%" viewBox="0 0 100 50">
                            <polyline 
                              points="0,40 20,35 40,30 60,20 80,15 100,10" 
                              fill="none" 
                              stroke="#2563eb" 
                              strokeWidth="2"
                            />
                            <circle cx="0" cy="40" r="2" fill="#2563eb" />
                            <circle cx="20" cy="35" r="2" fill="#2563eb" />
                            <circle cx="40" cy="30" r="2" fill="#2563eb" />
                            <circle cx="60" cy="20" r="2" fill="#2563eb" />
                            <circle cx="80" cy="15" r="2" fill="#2563eb" />
                            <circle cx="100" cy="10" r="2" fill="#2563eb" />
                          </svg>
                        </div>
                      </div>

                      {/* Bottom left: KPI cards */}
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600 font-medium mb-2">Key Metrics</div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center bg-white p-1 rounded">
                            <span className="text-xs">Avg. ROI:</span>
                            <span className="text-xs font-bold text-green-600">68%</span>
                          </div>
                          <div className="flex justify-between items-center bg-white p-1 rounded">
                            <span className="text-xs">Best Channel:</span>
                            <span className="text-xs font-bold text-blue-600">Instagram</span>
                          </div>
                          <div className="flex justify-between items-center bg-white p-1 rounded">
                            <span className="text-xs">Best Campaign:</span>
                            <span className="text-xs font-bold text-purple-600">Summer'25</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom right: Pie chart */}
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600 font-medium mb-2">Budget Allocation</div>
                        <div className="h-24 flex items-center justify-center">
                          <svg width="80" height="80" viewBox="0 0 100 100">
                            {/* Pie segments */}
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#2563eb" strokeWidth="40" strokeDasharray="75 100" strokeDashoffset="0" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="40" strokeDasharray="50 100" strokeDashoffset="-75" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="40" strokeDasharray="35 100" strokeDashoffset="-125" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="40" strokeDasharray="15 100" strokeDashoffset="-160" />
                            <circle cx="50" cy="50" r="25" fill="white" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-blue-800 mb-2">How AdTrack Improves Your ROI</h4>
                    <p className="text-sm text-blue-700">AdTrack users see an average improvement of 32% in marketing ROI within the first 3 months by optimizing budget allocation based on performance data.</p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <h4 className="font-medium text-green-800 mb-2">Calculate Your Potential Savings</h4>
                    <p className="text-sm text-green-700">Use our <Link href="/roi-calculator" className="underline">ROI Calculator</Link> to estimate how much you could save by optimizing your current marketing spend.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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
                <li><Link href="/features/roi-tracking" className="hover:text-white">ROI Tracking</Link></li>
                <li><Link href="/features/competitor-analysis" className="hover:text-white">Competitor Analysis</Link></li>
                <li><Link href="/features/ai-recommendations" className="hover:text-white">AI Recommendations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/roi-calculator" className="hover:text-white">ROI Calculator</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/case-studies" className="hover:text-white">Case Studies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-left">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} AdTrack | <span className="text-blue-400 font-medium">AI-Powered Solutions</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}