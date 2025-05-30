import React, { useState, useEffect } from "react";
import { Link } from "wouter";

export default function LandingPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm py-4">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              AdTrack <span className="text-blue-600 font-medium">| AI-Powered Solutions</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded text-sm">
              Log In
            </Link>
            <Link href="/auth" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm">
              Create Account
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
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600"> Marketing Data </span> 
              Into Actionable Insights
            </h1>
            <p className="text-xl text-gray-600">
              AdTrack is the industry's first LLM specifically designed to track your ROI, compare your performance against local businesses, and optimize your advertising budget for maximum returns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded inline-flex items-center">
                Create Account
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                  <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                  <path d="M9 18h6"></path>
                  <path d="M10 22h4"></path>
                </svg>
              </Link>
              <Link href="/roi-calculator" className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded inline-flex items-center">
                Try ROI Calculator
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <path d="M3 9h18"></path>
                  <path d="M9 21V9"></path>
                </svg>
              </Link>
            </div>
            <div className="pt-4">
              <p className="text-sm text-gray-500">Improve your average ROI with our proprietary AI insights</p>
            </div>
          </div>
          <div className="rounded-lg shadow-2xl bg-white p-6 border border-gray-200">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-800">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M3 3v18h18"></path>
                  <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">ROI Performance Tracker</h3>
                <p className="text-sm text-gray-500">Real-time advertising performance</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-blue-600 opacity-50">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
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

      {/* How AdTrack Transforms Your Marketing Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How AdTrack Transforms Your Marketing</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform delivers clear insights and predictive analytics for better marketing decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 */}
            <Link href="/features/roi-tracking" className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Performance</h3>
              <p className="text-gray-600">
                Easily log all your advertising methods, spending, and timelines. Our system automatically calculates ROI percentages.
              </p>
            </Link>

            {/* Card 2 */}
            <Link href="/features/competitor-analysis" className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M2 12h20"></path>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Comparisons</h3>
              <p className="text-gray-600">
                See how your advertising performs against similar businesses within your area with our geographic comparison tools.
              </p>
            </Link>

            {/* Card 3 */}
            <Link href="/features/ai-recommendations" className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.96-4.03A2.5 2.5 0 0 1 9.5 2Z"></path>
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.96-4.03A2.5 2.5 0 0 0 14.5 2Z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Recommendations</h3>
              <p className="text-gray-600">
                Get intelligent suggestions for budget allocation and campaign optimization based on historical data and predictive analytics.
              </p>
            </Link>

            {/* Card 4 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 21H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h5l2 3h9a2 2 0 0 1 2 2v2M21.12 15.88a3 3 0 1 0-4.24 4.24 3 3 0 0 0 4.24-4.24ZM16.88 11.12a3 3 0 1 0 4.24-4.24 3 3 0 0 0-4.24 4.24Z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Visual Analytics</h3>
              <p className="text-gray-600">
                Interactive charts and dashboards that break down your marketing performance by method, time period, and budget allocation.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6"></circle>
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Top Performers</h3>
              <p className="text-gray-600">
                Identify the most successful advertising methods and campaigns in your area to model your own strategies after.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Insights Storytelling</h3>
              <p className="text-gray-600">
                Our One-Click Marketing Insights transforms complex analytics into easy-to-understand narratives for better decision making.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Our Customers Say</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Real results from real businesses using AdTrack's AI-powered solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                  JD
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Jessica Davis</h4>
                  <p className="text-sm text-gray-500">Marketing Director, Riverside Cafe</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex text-yellow-400 mb-2">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <p className="text-gray-700">
                  "AdTrack has transformed how we approach local advertising. The AI recommendations have improved our ROI by 40% in just two months."
                </p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                  MR
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Michael Rodriguez</h4>
                  <p className="text-sm text-gray-500">Owner, Peak Fitness Studio</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex text-yellow-400 mb-2">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <p className="text-gray-700">
                  "Being able to compare our performance with other local fitness studios has given us incredible insights. We've optimized our ad spend and seen membership increase 25%."
                </p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                  SP
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold">Sarah Parker</h4>
                  <p className="text-sm text-gray-500">CMO, Bluewave Technologies</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex text-yellow-400 mb-2">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <p className="text-gray-700">
                  "The visualization tools make it easy to present results to stakeholders. We're now investing more strategically based on actual performance data."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Maximize Your Marketing ROI?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Get ahead of thousands of businesses looking for ways to use AI to optimize their advertising spend and maximize returns.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/plans" className="bg-white text-blue-700 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg inline-flex items-center justify-center">
              View Plans
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </Link>
            <Link href="/auth" className="border-2 border-white text-white hover:bg-white hover:bg-opacity-10 font-bold py-3 px-8 rounded-lg inline-flex items-center justify-center">
              Create Account
            </Link>
          </div>
        </div>
      </section>

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