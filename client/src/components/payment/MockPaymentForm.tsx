import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, CreditCard, Printer, Download, ArrowRight, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MockPaymentFormProps {
  amount: number;
  itemIds: number[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MockPaymentForm({ amount, itemIds, onSuccess, onCancel }: MockPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Mock form state
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiryDate, setExpiryDate] = useState('12/25');
  const [cvc, setCvc] = useState('123');
  const [name, setName] = useState('Demo User');
  
  // Handle print receipt
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };
  
  // Handle download receipt as PDF
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const receiptElement = document.getElementById('receipt-content');
      if (!receiptElement) {
        throw new Error('Receipt element not found');
      }

      const canvas = await html2canvas(receiptElement);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('adtrack-purchase-receipt.pdf');

      toast({
        title: 'Receipt downloaded',
        description: 'Your receipt has been saved as a PDF',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Download failed',
        description: 'Unable to download receipt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Handle navigation to dashboard
  const handleGoToDashboard = () => {
    setLocation('/dashboard');
  };
  
  // Handle navigation to compare page
  const handleGoToCompare = () => {
    setLocation('/compare');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate processing time for more realistic experience
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Record the purchase on the server
      const response = await fetch('/api/record-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          selectedItemIds: itemIds,
          status: 'succeeded',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record purchase');
      }

      // Mark as complete and show success message
      setIsComplete(true);
      toast({
        title: 'Payment successful',
        description: 'Thank you for your purchase! Your access has been granted.',
      });
      
      // No auto-redirect - user will choose what to do next
    } catch (error: any) {
      toast({
        title: 'Payment failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Complete Your Purchase</CardTitle>
        <CardDescription>Enter your payment details below</CardDescription>
      </CardHeader>
      <CardContent>
        {isComplete ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="bg-green-50 p-4 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
              <h3 className="text-xl font-medium">Thank you for your purchase</h3>
              <p className="text-muted-foreground">
                Your access to the competitor data has been granted.
              </p>
              <div id="receipt-content" className="border p-6 rounded-md mt-4 text-left bg-white">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold">Purchase Receipt</h3>
                  <p className="text-sm text-gray-500">Transaction ID: {Date.now()}</p>
                  <p className="text-sm text-gray-500">Date: {new Date().toLocaleString()}</p>
                </div>
                
                <div className="border-t border-b py-3 my-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Item</span>
                    <span className="font-medium">Price</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Top Performer Data Access ({itemIds.length} item{itemIds.length !== 1 ? 's' : ''})</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between font-bold mt-3">
                  <span>Total</span>
                  <span>${amount.toFixed(2)}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold text-gray-700 mb-2">What's included?</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Detailed competitor targeting information</li>
                    <li>Campaign budget allocation strategies</li>
                    <li>Actual conversion rates and ROI metrics</li>
                    <li>Campaign duration and scheduling data</li>
                    <li>Engagement metrics and audience response data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input 
                id="cardName" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="John Doe" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input 
                id="cardNumber" 
                value={cardNumber} 
                onChange={(e) => setCardNumber(e.target.value)} 
                placeholder="4242 4242 4242 4242" 
                required 
              />
              <p className="text-xs text-muted-foreground">
                Use 4242 4242 4242 4242 for this demo
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input 
                  id="expiry" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)} 
                  placeholder="MM/YY" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input 
                  id="cvc" 
                  value={cvc} 
                  onChange={(e) => setCvc(e.target.value)} 
                  placeholder="123" 
                  required 
                />
              </div>
            </div>
            
            <div className="bg-muted p-3 rounded-md flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Your payment information is secure. This is a demo and no real payments will be processed.
              </p>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className={isComplete ? "flex flex-col gap-3" : "flex justify-between"}>
        {isComplete ? (
          <>
            <div className="bg-blue-50 p-3 rounded-md mb-1 text-center">
              <p className="text-blue-700 font-medium">
                Your purchased competitor data is now available in the Compare Performance section
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Button 
                type="button" 
                onClick={handlePrint}
                disabled={isPrinting}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                Print Receipt
              </Button>
              
              <Button 
                type="button" 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download PDF
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                type="button" 
                onClick={handleGoToCompare}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <BarChart className="h-4 w-4" />
                View Purchased Data
              </Button>
              
              <Button 
                type="button" 
                onClick={handleGoToDashboard}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={isLoading} 
              className="flex items-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Pay ${amount.toFixed(2)}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}