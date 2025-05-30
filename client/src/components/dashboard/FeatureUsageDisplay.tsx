
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";

export default function FeatureUsageDisplay() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-primary" />
          Feature Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <div className="text-sm font-medium">Competitor Insights</div>
              <div className="text-sm text-muted-foreground">18/30 used</div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[60%]"></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <div className="text-sm font-medium">AI Marketing Reports</div>
              <div className="text-sm text-muted-foreground">7/10 used</div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[70%]"></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <div className="text-sm font-medium">Performance Exports</div>
              <div className="text-sm text-muted-foreground">3/25 used</div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[12%]"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
