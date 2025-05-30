import React from "react";
import { Link } from "wouter";
import { Twitter, Linkedin } from "lucide-react";

export default function MinisiteSimpleFooter() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Very minimal header */}
      <header className="bg-white border-b shadow-sm py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-xl font-bold">
            AdTrack <span className="text-blue-600">| AI-Powered Solutions</span>
          </h1>
        </div>
      </header>

      {/* Minimal content */}
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-6">Testing Footer Display</h2>
          <p className="text-center">This is a simplified test page to verify that the footer displays correctly.</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">AdTrack</h3>
              <p className="text-sm mb-4">
                The industry's first LLM specifically designed to track your ROI, compare your performance against local businesses, and optimize your advertising budget for maximum returns.
              </p>
              <div className="flex space-x-4">
                <Link href="https://twitter.com" className="hover:text-white">
                  <Twitter size={20} />
                </Link>
                <Link href="https://linkedin.com" className="hover:text-white">
                  <Linkedin size={20} />
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Features</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features/roi-tracking">ROI Tracking</Link></li>
                <li><Link href="/features/competitor-analysis">Competitor Analysis</Link></li>
                <li><Link href="/features/ai-recommendations">AI Recommendations</Link></li>
                <li><Link href="/features/marketing-insights">Marketing Insights</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/roi-calculator">ROI Calculator</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-sm">
              © {new Date().getFullYear()} AdTrack | <span className="text-blue-400 font-medium">AI-Powered Solutions</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}