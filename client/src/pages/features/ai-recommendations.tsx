import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Brain, Sparkles, Zap, ArrowUpRight, LightbulbIcon, TrendingUp } from "lucide-react";
import { useEffect } from "react";

export default function AIRecommendationsFeature() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-6">AI Recommendations</h1>
            <p className="text-xl text-gray-600 mb-8">
              Leverage our proprietary AI engine to transform your marketing strategy with predictive, actionable insights.
            </p>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <Brain className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Personalized Insights</h3>
                  <p className="mt-2 text-gray-600">
                    Receive personalized recommendations based on your historical performance data and get AI-powered suggestions for optimal budget allocation across channels.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Predictive Analytics</h3>
                  <p className="mt-2 text-gray-600">
                    Predict campaign outcomes before investing your marketing dollars and identify underperforming campaigns with suggestions for improvement.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <LightbulbIcon className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Trend Alerts</h3>
                  <p className="mt-2 text-gray-600">
                    Receive alerts about emerging trends and opportunities in your market, helping you stay ahead of industry changes.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">One-Click Marketing Insights</h3>
                  <p className="mt-2 text-gray-600">
                    Transform complex data into easy-to-understand narratives with our One-Click Marketing Insights feature, making data accessible to all stakeholders.
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
                <h3 className="text-lg font-semibold mb-4">AI Recommendation Engine</h3>
                <div className="aspect-video bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-20">
                    {Array(64).fill(0).map((_, i) => (
                      <div key={i} className="border border-indigo-200"></div>
                    ))}
                  </div>
                  <div className="relative z-10 text-center">
                    <Brain className="h-16 w-16 text-indigo-500 mx-auto mb-2 opacity-70" />
                    <div className="text-indigo-800 font-medium">Proprietary AI Engine</div>
                    <div className="text-xs text-indigo-600 mt-1">Powered by predictive analytics</div>
                  </div>

                  {/* Animated pulse effect */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-blue-500 rounded-full opacity-10 animate-ping"></div>
                  </div>
                </div>

                <h4 className="text-sm font-medium text-gray-500 mb-3">Sample AI Recommendations</h4>

                <div className="space-y-4">
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <div className="flex items-start">
                      <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-indigo-900">Increase Facebook Ads Budget</h5>
                        <p className="text-sm text-indigo-700 mt-1">Based on your recent campaign data, increasing your Facebook Ads budget by 20% could yield a 35% higher ROI.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start">
                      <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-blue-900">Optimize Google Ads Keywords</h5>
                        <p className="text-sm text-blue-700 mt-1">Your top 3 performing keywords account for 68% of conversions. Consider reallocating budget from the bottom 5 keywords.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="flex items-start">
                      <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-purple-900">Emerging Market Trend</h5>
                        <p className="text-sm text-purple-700 mt-1">Recent data shows increasing engagement with video content in your industry. Consider adding short-form video to your marketing mix.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <span className="text-xs text-gray-500">Our AI engine continuously learns from performance data to deliver increasingly accurate recommendations</span>
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