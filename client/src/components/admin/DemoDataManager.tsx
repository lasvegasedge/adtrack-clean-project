import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, RefreshCcw } from 'lucide-react';

export default function DemoDataManager() {
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

        // Invalidate relevant queries to refresh data across the admin interface
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/businesses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
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
    <Card className="shadow-lg border-2 border-blue-100">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-xl font-bold text-blue-700">Demonstration Data Manager</CardTitle>
        <CardDescription>
          Restore and manage sample data for user demonstrations and testing
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
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
      <CardFooter className="bg-gray-50 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Last update: {new Date().toLocaleString()}
        </span>
        <Button 
          onClick={restoreDemoData} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
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