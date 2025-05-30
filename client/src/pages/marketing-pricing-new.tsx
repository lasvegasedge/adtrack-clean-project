import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, X, Loader2 } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import type { PricingConfig } from "@shared/schema";

const FEATURE_LIST = [
  {
    id: 'roi_tracking',
    name: 'ROI Tracking',
    description: 'Track and analyze ROI for marketing campaigns',
    basic: 'limited',
    professional: 'full',
    premium: 'full'
  },
  {
    id: 'competitor_analysis',
    name: 'Competitor Analysis',
    description: 'Compare performance against similar businesses',
    basic: 'limited',
    professional: 'limited',
    premium: 'full'
  },
  {
    id: 'ai_recommendations',
    name: 'AI Recommendations',
    description: 'Get intelligent suggestions for campaigns',
    basic: 'none',
    professional: 'limited',
    premium: 'full'
  },
  {
    id: 'marketing_insights',
    name: 'Marketing Insights',
    description: 'Detailed analysis of marketing performance',
    basic: 'none',
    professional: 'limited',
    premium: 'full'
  },
  {
    id: 'ad_upload',
    name: 'Ad Upload',
    description: 'Upload and manage advertisement files',
    basic: 'limited',
    professional: 'full',
    premium: 'full'
  },
  {
    id: 'location_management',
    name: 'Location Management',
    description: 'Manage business locations and campaigns',
    basic: 'limited',
    professional: 'limited',
    premium: 'full'
  },
  {
    id: 'benchmark_tooltips',
    name: 'AI Benchmark Tooltips',
    description: 'Contextual insights when viewing performance',
    basic: 'none',
    professional: 'none',
    premium: 'full'
  },
  {
    id: 'comparison_radius_control',
    name: 'Comparison Radius Control',
    description: 'Adjust radius for competitor comparisons',
    basic: 'none', 
    professional: 'none',
    premium: 'full'
  }
];

export default function MarketingPricingPage() {
  // Fix scroll issue - ensure page loads at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch pricing data from admin configuration
  const { data: pricingConfigs, isLoading: isPricingLoading } = useQuery<PricingConfig[]>({
    queryKey: ["/api/pricing-public"],
    queryFn: async () => {
      const response = await fetch("/api/pricing-public");
      if (!response.ok) {
        throw new Error("Failed to fetch pricing data");
      }
      return response.json();
    }
  });

  // Convert admin pricing to plan format
  const getPlanPricing = () => {
    if (!pricingConfigs || pricingConfigs.length === 0) {
      // Fallback to default pricing if no admin config
      return {
        basic: { price: "876.95", name: "Basic Plan" },
        professional: { price: "1876.95", name: "Pro Plan" },
        premium: { price: "3276.95", name: "Enterprise Plan" }
      };
    }

    const plans = { basic: null, professional: null, premium: null };
    
    pricingConfigs.forEach(config => {
      const price = parseFloat(config.price).toFixed(2);
      if (config.name.toLowerCase().includes('basic')) {
        plans.basic = { price, name: config.name };
      } else if (config.name.toLowerCase().includes('pro')) {
        plans.professional = { price, name: config.name };
      } else if (config.name.toLowerCase().includes('enterprise') || config.name.toLowerCase().includes('premium')) {
        plans.premium = { price, name: config.name };
      }
    });

    return {
      basic: plans.basic || { price: "876.95", name: "Basic Plan" },
      professional: plans.professional || { price: "1876.95", name: "Pro Plan" },
      premium: plans.premium || { price: "3276.95", name: "Enterprise Plan" }
    };
  };

  const planPricing = getPlanPricing();

  // Helper function to render feature availability
  const renderFeatureAvailability = (availability: string) => {
    switch (availability) {
      case 'full':
        return (
          <div className="flex items-center">
            <Check className="h-5 w-5 text-green-500 mr-1.5" />
            <span className="text-sm">Full</span>
          </div>
        );
      case 'limited':
        return (
          <div className="flex items-center">
            <Check className="h-5 w-5 text-amber-500 mr-1.5" />
            <span className="text-sm">Limited</span>
          </div>
        );
      case 'none':
      default:
        return (
          <div className="flex items-center">
            <X className="h-5 w-5 text-gray-300 mr-1.5" />
            <span className="text-sm text-gray-400">No</span>
          </div>
        );
    }
  };

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
      
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Transparent Pricing for Every Business
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Choose the plan that works best for your business. All plans include a 7-day free trial with no credit card required.
          </p>
        </div>

        {isPricingLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading pricing plans...</span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {/* Basic Plan */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">{planPricing.basic.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${planPricing.basic.price}</span>
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
              <button className="w-full py-2 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-center font-medium rounded-lg">
                Create Account
              </button>
            </Link>
          </div>

          {/* Professional Plan */}
          <div className="border-2 border-blue-600 rounded-lg p-6 bg-white shadow-lg relative">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
              POPULAR
            </div>
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">{planPricing.professional.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">${planPricing.professional.price}</span>
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
              <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-lg">
                Create Account
              </button>
            </Link>
          </div>

          {/* Premium Plan */}
          <div className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">{planPricing.premium.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">${planPricing.premium.price}</span>
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
              <button className="w-full py-2 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-center font-medium rounded-lg">
                Create Account
              </button>
            </Link>
          </div>
          </div>
        )}

        {/* Compare Features Section */}
        <div className="max-w-6xl mx-auto mt-16 bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-8 py-6 border-b bg-gray-50">
            <h2 className="text-2xl font-bold text-center">Compare Features</h2>
            <p className="text-gray-600 text-center mt-2">
              See what's included in each plan
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Feature</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900">Basic</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900">Professional</th>
                  <th className="text-center py-4 px-6 font-medium text-gray-900">Premium</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_LIST.map((feature, index) => (
                  <tr key={feature.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{feature.name}</div>
                        <div className="text-sm text-gray-500">{feature.description}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {renderFeatureAvailability(feature.basic)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {renderFeatureAvailability(feature.professional)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {renderFeatureAvailability(feature.premium)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-16 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How does the 7-day free trial work?</h3>
              <p className="text-gray-600">
                Our 7-day free trial gives you full access to all features in your selected plan. You won't be charged until the trial ends, and you can cancel anytime during the trial period with no obligation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I switch plans later?</h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll have immediate access to new features. When downgrading, changes will take effect at your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Privacy-Focused Benchmarking</h3>
              <p className="text-gray-600">
                Competitor data is anonymized to preserve privacy while still providing valuable insights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Geographic Comparison</h3>
              <p className="text-gray-600">
                See how you compare to similar businesses within an adjustable radius (default 3 miles).
              </p>
            </div>
          </div>
        </div>
      </div>
      
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