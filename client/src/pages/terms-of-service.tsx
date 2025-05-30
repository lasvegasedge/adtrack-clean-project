import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";

export default function TermsOfService() {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
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
        
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose max-w-none">
          <p className="text-lg text-gray-700 mb-6">
            Last Updated: May 11, 2025
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction</h2>
          <p>
            Welcome to AdTrack ("we," "our," or "us"). By accessing or using our website and services, you agree to be bound by these Terms of Service ("Terms"). Please read these Terms carefully before using our platform.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Acceptance of Terms</h2>
          <p>
            By accessing or using our services, you agree to these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use our services.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Description of Services</h2>
          <p>
            AdTrack provides a digital marketing analytics platform that helps businesses track advertising performance, analyze ROI, compare performance against local competitors, and receive AI-powered marketing recommendations.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Account Registration</h2>
          <p>
            To use our services, you must create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>
          <p>
            You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Subscription and Payment</h2>
          <p>
            AdTrack offers various subscription plans with different features and pricing. By selecting a subscription plan, you agree to pay the applicable fees as described at the time of purchase.
          </p>
          <p>
            All subscriptions begin with a 7-day free trial. After the trial period ends, your selected payment method will be charged automatically for the subscription plan you chose, unless you cancel before the trial ends.
          </p>
          <p>
            We may change our subscription fees at any time, but we will provide notice of any fee change before it affects your subscription.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">User Content</h2>
          <p>
            You retain all rights to the data and content you upload to our platform. However, you grant us a non-exclusive, worldwide, royalty-free license to use, copy, modify, and display your content solely for the purpose of providing our services to you.
          </p>
          <p>
            You are solely responsible for all content you upload and confirm that you have all necessary rights to share that content with us.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Acceptable Use</h2>
          <p>
            You agree not to use our services to:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Violate any applicable laws or regulations.</li>
            <li>Infringe on the intellectual property rights of others.</li>
            <li>Upload malicious code or attempt to interfere with the platform's functionality.</li>
            <li>Share false, misleading, or fraudulent information.</li>
            <li>Attempt to access other users' accounts or data without authorization.</li>
            <li>Use the service for any illegal or unauthorized purpose.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Intellectual Property</h2>
          <p>
            Our platform, including its design, text, graphics, logos, icons, images, software, and other content, is protected by intellectual property rights owned or licensed by AdTrack. You may not copy, modify, distribute, sell, or lease any part of our services without our permission.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Disclaimer of Warranties</h2>
          <p>
            Our services are provided "as is" without warranties of any kind, either express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p>
            We do not guarantee that our services will always be available, uninterrupted, secure, or error-free, or that the results obtained from using our services will be accurate or reliable.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, in no event will AdTrack be liable for any indirect, special, incidental, consequential, or punitive damages arising from or related to your use of our services, even if we have been advised of the possibility of such damages.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless AdTrack and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from or related to your use of our services or violation of these Terms.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Termination</h2>
          <p>
            We may terminate or suspend your access to our services immediately, without prior notice or liability, for any reason, including if you breach these Terms.
          </p>
          <p>
            You may terminate your account at any time by contacting us. Upon termination, your right to use our services will immediately cease.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to Terms</h2>
          <p>
            We may modify these Terms at any time by posting the revised terms on our website. Your continued use of our services after any such changes constitutes your acceptance of the new Terms.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Governing Law</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the State of Nevada, without regard to its conflict of law principles.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
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