import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Globe, Search, TrendingUp, ArrowUpRight, MapPin } from "lucide-react";
import { useEffect } from "react";

export default function CompetitorAnalysisFeature() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Competitor Analysis</h1>
            <p className="text-xl text-gray-600 mb-8">
              Understand how your marketing efforts stack up against similar businesses in your area with AdTrack's advanced competitor analysis tools.
            </p>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Localized Comparisons</h3>
                  <p className="mt-2 text-gray-600">
                    Compare your advertising performance with similar businesses in an adjustable radius, giving you insights into your local competitive landscape.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Top Performer Insights</h3>
                  <p className="mt-2 text-gray-600">
                    Identify the top performers in your industry and location to benchmark your ROI against local and industry averages.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <Search className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Market Intelligence</h3>
                  <p className="mt-2 text-gray-600">
                    Discover which advertising methods are most effective in your market and receive alerts when competitors launch successful new campaigns.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mt-1 bg-blue-100 p-1.5 rounded-full text-blue-600">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">Premium Analytics</h3>
                  <p className="mt-2 text-gray-600">
                    Access detailed competitor insights with our premium analytics package, helping you stay ahead of the competition with data-driven intelligence.
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
                <h3 className="text-lg font-semibold mb-4">Competitive Landscape Map</h3>
                <div className="aspect-video bg-blue-50 rounded-lg flex items-center justify-center mb-6 relative overflow-hidden">
                  {/* Simulated map with business locations */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      {/* Map background with grid */}
                      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                        {Array(64).fill(0).map((_, i) => (
                          <div key={i} className="border border-blue-100"></div>
                        ))}
                      </div>

                      {/* Business markers - Your business */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center">
                          <span className="text-white text-xs">You</span>
                        </div>
                      </div>

                      {/* Competitor 1 */}
                      <div className="absolute top-[30%] left-[60%]">
                        <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
                          <span className="text-white text-[8px]">C1</span>
                        </div>
                      </div>

                      {/* Competitor 2 */}
                      <div className="absolute top-[45%] left-[75%]">
                        <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
                          <span className="text-white text-[8px]">C2</span>
                        </div>
                      </div>

                      {/* Competitor 3 */}
                      <div className="absolute top-[65%] left-[40%]">
                        <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center">
                          <span className="text-white text-[8px]">C3</span>
                        </div>
                      </div>

                      {/* Competitor 4 */}
                      <div className="absolute top-[35%] left-[30%]">
                        <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                          <span className="text-white text-[8px]">C4</span>
                        </div>
                      </div>

                      {/* Competitor 5 - top performer */}
                      <div className="absolute top-[55%] left-[20%]">
                        <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                          <span className="text-white text-[8px]">C5</span>
                        </div>
                      </div>

                      {/* Radius circle */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-blue-300 border-dashed opacity-40"></div>
                    </div>
                  </div>

                  <div className="absolute bottom-2 right-2 bg-white px-2 py-1 rounded text-xs text-gray-600 shadow-sm">
                    3 mile radius
                  </div>
                </div>

                <h4 className="text-sm font-medium text-gray-500 mb-2">Competitive Performance</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-1/4 text-sm">Your Business</div>
                    <div className="w-3/4 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '68%' }}></div>
                    </div>
                    <div className="w-12 text-right text-sm font-medium">68%</div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-1/4 text-sm">Top Performer</div>
                    <div className="w-3/4 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <div className="w-12 text-right text-sm font-medium">92%</div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-1/4 text-sm">Area Average</div>
                    <div className="w-3/4 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-400 rounded-full" style={{ width: '53%' }}></div>
                    </div>
                    <div className="w-12 text-right text-sm font-medium">53%</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-sm text-blue-800 mb-2">Top Performer Insight</h4>
                  <p className="text-sm text-blue-700">The highest performing competitor in your area is spending 40% more on digital advertising channels with an emphasis on targeted local campaigns.</p>
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