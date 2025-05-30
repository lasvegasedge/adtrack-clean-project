import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, RefreshCcw } from 'lucide-react';

export function DemoDataControls() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const restoreDemoData = async () => {
    if (!confirm('Are you sure you want to restore demonstration data? This will create multiple demo users and businesses.')) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await apiRequest('POST', '/api/demo/restore-demo-data');
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Demonstration data has been restored successfully',
        });
        setResult('Demonstration data restored successfully');
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Something went wrong while restoring demo data',
          variant: 'destructive',
        });
        setResult(`Error: ${data.message}`);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong while restoring demo data',
        variant: 'destructive',
      });
      setResult(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Demonstration Data Controls</CardTitle>
        <CardDescription>
          Manage the demonstration data for the application. This will create sample users, businesses, and campaigns.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">
          Use the button below to restore demonstration data. This will create 6 demo user accounts with associated businesses and campaigns.
          Each business will have multiple campaigns with various ROI metrics.
        </p>
        
        {result && (
          <div className={`p-4 rounded-md mb-4 ${result.startsWith('Error') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
            {result}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={restoreDemoData} 
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Restoring Data...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4" />
              Restore Demonstration Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}