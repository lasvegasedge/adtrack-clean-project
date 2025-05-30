import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function QuickStartGuide() {
  const [_, navigate] = useLocation();
  
  const handlePrint = () => {
    window.print();
  };
  
  const goBack = () => {
    // Go back to previous page or to home
    navigate("/");
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl print:py-0 print:px-0">
      <div className="mb-6 flex justify-between items-center print:hidden">
        <Button
          onClick={goBack}
          variant="ghost"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        
        <Button
          onClick={handlePrint}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          <span>Print Guide</span>
        </Button>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-lg print:shadow-none print:p-0">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">AdTrack Quick Start Guide</h1>
          <h2 className="text-xl text-muted-foreground">Maximize Your Marketing ROI in 15 Minutes</h2>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Welcome to AdTrack!</h3>
          <p>This guide will help you set up your account and get your first marketing insights in just 15 minutes. Let's get started!</p>
        </div>
        
        <div className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <div className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center mr-2">1</div>
              Complete Your Business Profile <span className="text-muted-foreground ml-2 text-sm">(2 min)</span>
            </h3>
            <ol className="space-y-2 ml-10">
              <li className="list-decimal">Log in to your AdTrack account at adtrack.online</li>
              <li className="list-decimal">Click on "Business" in the top navigation</li>
              <li className="list-decimal">Fill in your business details:
                <ul className="list-disc ml-6 mt-1 space-y-1">
                  <li>Business name</li>
                  <li>Business type (select from dropdown)</li>
                  <li>Address and zip code</li>
                  <li>Business contact information</li>
                </ul>
              </li>
              <li className="list-decimal">Click "Save" to complete your profile</li>
            </ol>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <div className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center mr-2">2</div>
              Add Your First Campaign <span className="text-muted-foreground ml-2 text-sm">(5 min)</span>
            </h3>
            <ol className="space-y-2 ml-10">
              <li className="list-decimal">Navigate to "Campaigns" using the bottom navigation</li>
              <li className="list-decimal">Click the "+ New Campaign" button</li>
              <li className="list-decimal">Enter campaign details:
                <ul className="list-disc ml-6 mt-1 space-y-1">
                  <li>Campaign name</li>
                  <li>Advertising method (Social Media, Email, etc.)</li>
                  <li>Start and end dates</li>
                  <li>Amount spent</li>
                  <li>Revenue generated (or estimated)</li>
                  <li>Brief description</li>
                </ul>
              </li>
              <li className="list-decimal">Optional: Upload a sample of your ad (image, PDF, etc.)</li>
              <li className="list-decimal">Click "Save Campaign"</li>
            </ol>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <div className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center mr-2">3</div>
              View Your Analytics Dashboard <span className="text-muted-foreground ml-2 text-sm">(3 min)</span>
            </h3>
            <ol className="space-y-2 ml-10">
              <li className="list-decimal">Click on "Analytics" in the bottom navigation</li>
              <li className="list-decimal">You'll see your first campaign ROI calculations</li>
              <li className="list-decimal">Explore different timeframes (7 days, 30 days, etc.)</li>
              <li className="list-decimal">Filter by ad method to see performance by channel</li>
            </ol>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <div className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center mr-2">4</div>
              Compare Your Performance <span className="text-muted-foreground ml-2 text-sm">(3 min)</span>
            </h3>
            <ol className="space-y-2 ml-10">
              <li className="list-decimal">Click on "Compare" in the bottom navigation</li>
              <li className="list-decimal">View your ROI ranking among similar businesses</li>
              <li className="list-decimal">Adjust the geographic radius to expand or narrow your comparison</li>
              <li className="list-decimal">See which advertising methods are performing best in your area</li>
            </ol>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <div className="bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center mr-2">5</div>
              Get AI-Powered Insights <span className="text-muted-foreground ml-2 text-sm">(2 min)</span>
            </h3>
            <ol className="space-y-2 ml-10">
              <li className="list-decimal">Click on "Insights" in the bottom navigation</li>
              <li className="list-decimal">Select "Quick Summary" under Marketing Insights Storyteller</li>
              <li className="list-decimal">Review your AI-generated marketing performance summary</li>
              <li className="list-decimal">Save or print your insights for team sharing</li>
            </ol>
          </section>
        </div>
        
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-3">Ready to Go Further?</h3>
          <ul className="ml-6 space-y-2 list-disc">
            <li>Add more campaigns to get more comprehensive insights</li>
            <li>Explore the "Recommendations" tab for AI-suggested improvements</li>
            <li>Check out the "Pricing" section to access competitor data</li>
          </ul>
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
          <ul className="ml-6 space-y-2">
            <li><span className="font-medium">Email:</span> support@adtrack.online</li>
            <li><span className="font-medium">Phone:</span> (555) 123-4567</li>
            <li><span className="font-medium">Live Chat:</span> Available 9am-5pm EST on our website</li>
          </ul>
        </div>
        
        <div className="mt-8 text-center">
          <p className="font-medium">Congratulations!</p>
          <p>You've completed the quick start process and are on your way to maximizing your marketing ROI with AdTrack.</p>
        </div>
      </div>
    </div>
  );
}