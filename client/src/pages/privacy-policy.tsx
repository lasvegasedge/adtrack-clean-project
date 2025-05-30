import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";

export default function PrivacyPolicy() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    // Add focus to the main heading for better accessibility
    const mainHeading = document.getElementById('privacy-heading');
    if (mainHeading) {
      mainHeading.setAttribute('tabIndex', '-1'); // Using string for HTML attribute
      mainHeading.focus();
    }
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-white">
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
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
        </div>
        
        <h1 id="privacy-heading" className="text-3xl font-bold mb-8" tabIndex={-1}>Privacy Policy</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Last Updated: May 11, 2025
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction</h2>
          <p>
            AdTrack ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and use our services, and tell you about your privacy rights and how the law protects you.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
          <p>
            We collect several types of information from and about users of our website and services, including:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Personal identifiers such as name, email address, and contact information when you create an account.</li>
            <li>Business information including business name, location, industry, and size.</li>
            <li>Marketing campaign data that you choose to upload or input into our platform.</li>
            <li>Usage data about how you interact with our website and services.</li>
            <li>Technical data including IP address, browser type, device information, and cookies.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
          <p>
            We use the information we collect for various purposes, including:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Providing, maintaining, and improving our services.</li>
            <li>Processing your transactions and managing your account.</li>
            <li>Analyzing marketing performance and providing insights.</li>
            <li>Comparing anonymized performance data to provide competitive benchmarks.</li>
            <li>Communicating with you about your account, updates, or promotional offers.</li>
            <li>Protecting the security and integrity of our platform.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All your business data is encrypted both in transit and at rest. We regularly review and enhance our security practices to maintain the highest standards of data protection.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share your information in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>With service providers who perform services on our behalf.</li>
            <li>With business partners with your consent.</li>
            <li>For legal compliance, to protect rights, or in connection with corporate transactions.</li>
          </ul>
          <p>
            We never share identifiable information about your business without your explicit consent.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Your Privacy Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal data, including:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>The right to access and receive a copy of your personal data.</li>
            <li>The right to rectify or update inaccurate or incomplete information.</li>
            <li>The right to delete your personal data in certain circumstances.</li>
            <li>The right to restrict or object to processing of your personal data.</li>
            <li>The right to data portability.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at info@adtrack.online.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to enhance your experience on our website, analyze usage patterns, and personalize content. You can manage your cookie preferences through your browser settings.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Children's Privacy</h2>
          <p>
            Our services are not intended for children under 16 years of age, and we do not knowingly collect personal information from children under 16.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to Our Privacy Policy</h2>
          <p>
            We may update our privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
          </p>
          <p className="mb-6">
            Email: info@adtrack.online<br />
            Phone: (702) 625-6504<br />
            Address: 3800 Howard Hughes Pkwy, Las Vegas, NV 89169
          </p>
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