import { Link } from "wouter";

export default function MarketingInsightsFeature() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm py-4">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-bold text-gray-900">
            AdTrack <span className="text-blue-600 font-medium">| AI-Powered Solutions</span>
          </Link>
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Return to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="h-24 w-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Marketing Insights</h1>
          <p className="text-xl text-gray-600 mb-8">
            Our AI-powered Marketing Insights feature is coming soon.
          </p>
          <div className="max-w-2xl mx-auto mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-4">Transform your marketing data into actionable insights</h2>
            <p className="text-gray-600 mb-4">
              AdTrack's Marketing Insights will help you understand the story behind your marketing metrics. Our AI will analyze your campaigns and provide clear, actionable narratives about:
            </p>
            <ul className="space-y-3 text-left text-gray-600 mb-6">
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Which campaigns are delivering the best ROI and why</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>How your performance compares to similar businesses in your area</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Specific recommendations to optimize your marketing budget</span>
              </li>
              <li className="flex items-start">
                <svg className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Plain-English explanations of complex marketing trends</span>
              </li>
            </ul>
          </div>
          <p className="text-gray-600 mb-8">
            We're putting the finishing touches on this powerful feature. Sign up today to be notified when it's ready!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <span>Create Account</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </Link>
            <Link href="/" className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
              <span>Return to Homepage</span>
            </Link>
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