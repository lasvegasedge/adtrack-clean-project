import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Loader2, 
  Download, 
  FileDown,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type AnalyticsData = {
  byState: { state: string; count: number }[];
  byCity: { city: string; count: number }[];
  byBusinessType: { businessType: string; count: number }[];
  byYear: { year: number; count: number }[];
  byMonth: { year: number; month: number; count: number }[];
  byFeature: { featureName: string; count: number }[];
  topBusinesses: { businessName: string; count: number }[];
};

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#82CA9D', '#FF6B6B', '#6B66FF',
  '#FFD700', '#32CD32', '#FF69B4', '#1E90FF'
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FeatureUsageAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('byState');
  const [selectedDrillDown, setSelectedDrillDown] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<any[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [topBusinessCount, setTopBusinessCount] = useState<string>("10");
  // Individual category filters
  const [filterSelections, setFilterSelections] = useState<{[key: string]: {[key: string]: boolean}}>({
    byState: {},
    byCity: {},
    byBusinessType: {},
    byYear: {},
    byMonth: {},
    byFeature: {}
  });
  // Unified filter for cross-category filtering
  const [unifiedFilter, setUnifiedFilter] = useState<{
    states: string[];
    cities: string[];
    businessTypes: string[];
    years: number[];
    months: number[];
    features: string[];
  }>({
    states: [],
    cities: [],
    businessTypes: [],
    years: [],
    months: [],
    features: []
  });
  const [showUnifiedFilter, setShowUnifiedFilter] = useState<boolean>(false);
  const analyticsRef = useRef<HTMLDivElement>(null);
  
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['/api/feature-usage/analytics'],
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Feature Usage Analytics</CardTitle>
          <CardDescription>Loading usage data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Feature Usage Analytics</CardTitle>
          <CardDescription>Error loading usage data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            An error occurred while loading the analytics data.
            Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Feature Usage Analytics</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            No usage data is available yet. This could be because:
            <ul className="list-disc pl-5 mt-2">
              <li>No features have been used in the system yet</li>
              <li>The feature tracking system was recently implemented</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format month data for display
  const formattedMonthData = data.byMonth.map(item => ({
    ...item,
    name: `${MONTHS[item.month - 1]} ${item.year}`
  }));

  // Handle drill down navigation
  const handleDrillDown = (item: any) => {
    // This would be expanded with actual API calls in a real implementation
    // For now, we'll simulate the drill-down experience
    
    // Update breadcrumbs
    const newBreadcrumbs = [...breadcrumbs];
    
    if (activeTab === 'byState') {
      newBreadcrumbs.push(item.state);
      setActiveTab('byCity');
      // Filter to only show cities in this state
      setDrilldownData(data.byCity.slice(0, 5));
    } else if (activeTab === 'byCity') {
      newBreadcrumbs.push(item.city);
      setActiveTab('byBusinessType');
      // Filter to only show business types in this city
      setDrilldownData(data.byBusinessType.slice(0, 4));
    } else if (activeTab === 'byBusinessType') {
      newBreadcrumbs.push(item.businessType);
      setActiveTab('topBusinesses');
      // Filter to only show businesses of this type
      setDrilldownData(data.topBusinesses.slice(0, 6));
    }
    
    setBreadcrumbs(newBreadcrumbs);
    setSelectedDrillDown(JSON.stringify(item));
  };

  // Handle navigation back up the hierarchy
  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index);
    setBreadcrumbs(newBreadcrumbs);
    
    // Determine which view to show based on breadcrumb level
    if (index === 0) {
      setActiveTab('byState');
      setSelectedDrillDown(null);
    } else if (index === 1) {
      setActiveTab('byCity');
      // Would make API call to get cities for the selected state
      setDrilldownData(data.byCity.slice(0, 5));
    } else if (index === 2) {
      setActiveTab('byBusinessType');
      // Would make API call to get business types for the selected city
      setDrilldownData(data.byBusinessType.slice(0, 4));
    }
  };

  // Reset drill down
  const resetDrillDown = () => {
    setBreadcrumbs([]);
    setSelectedDrillDown(null);
    setActiveTab('byState');
  };
  
  // Export report as PDF
  const exportAsPDF = () => {
    if (analyticsRef.current) {
      html2canvas(analyticsRef.current).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        // Add metadata
        pdf.setProperties({
          title: 'AdTrack Feature Usage Analytics',
          subject: `${activeTab.replace('by', '')} Analytics`,
          author: 'AdTrack.online',
          creator: 'AdTrack Analytics Dashboard'
        });
        
        // Add timestamp
        const now = new Date();
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Generated: ${now.toLocaleString()}`, 20, 20);
        
        // Add the chart image
        pdf.addImage(imgData, 'PNG', 0, 30, canvas.width * 0.8, canvas.height * 0.8);
        
        pdf.save(`AdTrack_${activeTab}_Analytics_${now.toISOString().split('T')[0]}.pdf`);
      });
    }
  };
  
  // Export data as CSV
  const exportAsCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let rows = [];
    
    // Create headers and data based on active tab
    if (activeTab === 'byState') {
      rows.push(["State", "Usage Count"]);
      data.byState.forEach(item => {
        rows.push([item.state, item.count]);
      });
    } else if (activeTab === 'byCity') {
      rows.push(["City", "Usage Count"]);
      (breadcrumbs.length > 0 ? drilldownData : data.byCity).forEach((item: any) => {
        rows.push([item.city, item.count]);
      });
    } else if (activeTab === 'byBusinessType') {
      rows.push(["Business Type", "Usage Count"]);
      (breadcrumbs.length > 1 ? drilldownData : data.byBusinessType).forEach((item: any) => {
        rows.push([item.businessType, item.count]);
      });
    } else if (activeTab === 'byYear') {
      rows.push(["Year", "Usage Count"]);
      data.byYear.forEach(item => {
        rows.push([item.year, item.count]);
      });
    } else if (activeTab === 'byMonth') {
      rows.push(["Month", "Year", "Usage Count"]);
      data.byMonth.forEach(item => {
        rows.push([MONTHS[item.month - 1], item.year, item.count]);
      });
    } else if (activeTab === 'byFeature') {
      rows.push(["Feature", "Usage Count"]);
      data.byFeature.forEach(item => {
        rows.push([item.featureName, item.count]);
      });
    } else if (activeTab === 'topBusinesses') {
      rows.push(["Business Name", "Usage Count"]);
      const displayCount = parseInt(topBusinessCount, 10);
      const businessesToShow = (breadcrumbs.length > 2 ? drilldownData : data.topBusinesses)
        .slice(0, displayCount);
      
      businessesToShow.forEach((item: any) => {
        rows.push([item.businessName, item.count]);
      });
    }
    
    // Convert array to CSV format
    rows.forEach(row => {
      const processedRow = row.map(value => {
        // Handle values with commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      });
      
      csvContent += processedRow.join(',') + '\r\n';
    });
    
    // Create download link and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AdTrack_${activeTab}_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Toggle a filter selection
  const toggleFilter = (category: string, key: string) => {
    setFilterSelections(prev => {
      const newSelections = {...prev};
      
      if (!newSelections[category]) {
        newSelections[category] = {};
      }
      
      newSelections[category][key] = !newSelections[category][key];
      
      return newSelections;
    });
  };
  
  // Filter data based on selections
  const getFilteredData = (category: string, data: any[]) => {
    const filters = filterSelections[category];
    
    // If no filters are selected or "All" is selected, return all data
    const hasFilters = filters && Object.values(filters).some(v => v);
    if (!hasFilters) {
      return data;
    }
    
    // Get the property name for this category
    const propMap: {[key: string]: string} = {
      byState: 'state', 
      byCity: 'city',
      byBusinessType: 'businessType',
      byYear: 'year',
      byMonth: 'month',
      byFeature: 'featureName'
    };
    
    const prop = propMap[category];
    
    // Return only items that match the selected filters
    return data.filter(item => {
      return filters[item[prop]];
    });
  };
  
  // Get businesses that match the cross-category filters
  const getCrossCategoryFilteredBusinesses = () => {
    // If no filters are selected, return all businesses
    const hasFilters = 
      unifiedFilter.states.length > 0 ||
      unifiedFilter.cities.length > 0 ||
      unifiedFilter.businessTypes.length > 0 ||
      unifiedFilter.years.length > 0 ||
      unifiedFilter.months.length > 0 ||
      unifiedFilter.features.length > 0;
      
    if (!hasFilters) {
      return data.topBusinesses;
    }
    
    // Helper function to check if a business matches the criteria
    const matchesFilter = (businessName: string) => {
      // Find usages associated with this business
      // This would be more efficient with a backend API call in a real implementation
      
      // For demonstration purposes, we'll apply the filters directly in the frontend
      const business = data.topBusinesses.find(b => b.businessName === businessName);
      const businessCount = business?.count || 0;
      
      const businessMatchesState = unifiedFilter.states.length === 0 || 
        data.byState.some(stateItem => 
          unifiedFilter.states.includes(stateItem.state) && businessCount > 0
        );
        
      const businessMatchesCity = unifiedFilter.cities.length === 0 ||
        data.byCity.some(cityItem => 
          unifiedFilter.cities.includes(cityItem.city) && businessCount > 0
        );
        
      const businessMatchesType = unifiedFilter.businessTypes.length === 0 ||
        data.byBusinessType.some(typeItem => 
          unifiedFilter.businessTypes.includes(typeItem.businessType) && businessCount > 0
        );
        
      const businessMatchesFeature = unifiedFilter.features.length === 0 ||
        data.byFeature.some(featureItem => 
          unifiedFilter.features.includes(featureItem.featureName) && businessCount > 0
        );
        
      const businessMatchesYear = unifiedFilter.years.length === 0 ||
        data.byYear.some(yearItem => 
          unifiedFilter.years.includes(yearItem.year) && businessCount > 0
        );
        
      const businessMatchesMonth = unifiedFilter.months.length === 0 ||
        data.byMonth.some(monthItem => 
          unifiedFilter.months.includes(monthItem.month) && businessCount > 0
        );
      
      return businessMatchesState && 
             businessMatchesCity && 
             businessMatchesType && 
             businessMatchesFeature && 
             businessMatchesYear &&
             businessMatchesMonth;
    };
    
    // Filter businesses that match all selected criteria
    return data.topBusinesses.filter(business => matchesFilter(business.businessName));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Feature Usage Analytics</CardTitle>
        <CardDescription>
          Analyze feature usage across the platform
        </CardDescription>
        {breadcrumbs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetDrillDown}
              className="h-6 px-2"
            >
              All
            </Button>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <span>/</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => handleBreadcrumbClick(index + 1)}
                >
                  {crumb}
                </Button>
              </React.Fragment>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsPDF}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportAsCSV}
              className="flex items-center gap-1"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnifiedFilter(!showUnifiedFilter)}
              className="flex items-center gap-1"
            >
              {showUnifiedFilter ? "Hide Cross-Category Filter" : "Show Cross-Category Filter"}
            </Button>
          </div>
          
          {activeTab === 'topBusinesses' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Show:</span>
              <Select 
                value={topBusinessCount} 
                onValueChange={setTopBusinessCount}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="25">Top 25</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {showUnifiedFilter && (
          <div className="bg-slate-50 p-4 mb-6 rounded-lg border">
            <h3 className="text-lg font-medium mb-3">Cross-Category Filter</h3>
            <p className="text-sm text-gray-500 mb-3">
              Select filters from multiple categories to view combined data analysis.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* State Filter */}
              <div>
                <h4 className="font-medium text-sm mb-2">States</h4>
                <div className="max-h-32 overflow-y-auto pr-2 space-y-1">
                  {data.byState.map((item, i) => (
                    <div key={`state-${i}`} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`unified-state-${i}`} 
                        checked={unifiedFilter.states.includes(item.state)}
                        onCheckedChange={(checked) => {
                          setUnifiedFilter(prev => {
                            const newFilter = {...prev};
                            if (checked) {
                              newFilter.states = [...prev.states, item.state];
                            } else {
                              newFilter.states = prev.states.filter(s => s !== item.state);
                            }
                            return newFilter;
                          });
                        }}
                      />
                      <label 
                        htmlFor={`unified-state-${i}`}
                        className="text-sm leading-none"
                      >
                        {item.state}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* City Filter */}
              <div>
                <h4 className="font-medium text-sm mb-2">Cities</h4>
                <div className="max-h-32 overflow-y-auto pr-2 space-y-1">
                  {data.byCity.map((item, i) => (
                    <div key={`city-${i}`} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`unified-city-${i}`} 
                        checked={unifiedFilter.cities.includes(item.city)}
                        onCheckedChange={(checked) => {
                          setUnifiedFilter(prev => {
                            const newFilter = {...prev};
                            if (checked) {
                              newFilter.cities = [...prev.cities, item.city];
                            } else {
                              newFilter.cities = prev.cities.filter(c => c !== item.city);
                            }
                            return newFilter;
                          });
                        }}
                      />
                      <label 
                        htmlFor={`unified-city-${i}`}
                        className="text-sm leading-none"
                      >
                        {item.city}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Business Type Filter */}
              <div>
                <h4 className="font-medium text-sm mb-2">Business Types</h4>
                <div className="max-h-32 overflow-y-auto pr-2 space-y-1">
                  {data.byBusinessType.map((item, i) => (
                    <div key={`type-${i}`} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`unified-type-${i}`} 
                        checked={unifiedFilter.businessTypes.includes(item.businessType)}
                        onCheckedChange={(checked) => {
                          setUnifiedFilter(prev => {
                            const newFilter = {...prev};
                            if (checked) {
                              newFilter.businessTypes = [...prev.businessTypes, item.businessType];
                            } else {
                              newFilter.businessTypes = prev.businessTypes.filter(bt => bt !== item.businessType);
                            }
                            return newFilter;
                          });
                        }}
                      />
                      <label 
                        htmlFor={`unified-type-${i}`}
                        className="text-sm leading-none"
                      >
                        {item.businessType}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Year Filter */}
              <div>
                <h4 className="font-medium text-sm mb-2">Years</h4>
                <div className="max-h-32 overflow-y-auto pr-2 space-y-1">
                  {data.byYear.map((item, i) => (
                    <div key={`year-${i}`} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`unified-year-${i}`} 
                        checked={unifiedFilter.years.includes(item.year)}
                        onCheckedChange={(checked) => {
                          setUnifiedFilter(prev => {
                            const newFilter = {...prev};
                            if (checked) {
                              newFilter.years = [...prev.years, item.year];
                            } else {
                              newFilter.years = prev.years.filter(y => y !== item.year);
                            }
                            return newFilter;
                          });
                        }}
                      />
                      <label 
                        htmlFor={`unified-year-${i}`}
                        className="text-sm leading-none"
                      >
                        {item.year}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Month Filter */}
              <div>
                <h4 className="font-medium text-sm mb-2">Months</h4>
                <div className="max-h-32 overflow-y-auto pr-2 space-y-1">
                  {MONTHS.map((monthName, index) => (
                    <div key={`month-${index}`} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`unified-month-${index}`} 
                        checked={unifiedFilter.months.includes(index + 1)}
                        onCheckedChange={(checked) => {
                          setUnifiedFilter(prev => {
                            const newFilter = {...prev};
                            if (checked) {
                              newFilter.months = [...prev.months, index + 1];
                            } else {
                              newFilter.months = prev.months.filter(m => m !== index + 1);
                            }
                            return newFilter;
                          });
                        }}
                      />
                      <label 
                        htmlFor={`unified-month-${index}`}
                        className="text-sm leading-none"
                      >
                        {monthName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Feature Filter */}
              <div>
                <h4 className="font-medium text-sm mb-2">Features</h4>
                <div className="max-h-32 overflow-y-auto pr-2 space-y-1">
                  {data.byFeature.map((item, i) => (
                    <div key={`feature-${i}`} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`unified-feature-${i}`} 
                        checked={unifiedFilter.features.includes(item.featureName)}
                        onCheckedChange={(checked) => {
                          setUnifiedFilter(prev => {
                            const newFilter = {...prev};
                            if (checked) {
                              newFilter.features = [...prev.features, item.featureName];
                            } else {
                              newFilter.features = prev.features.filter(f => f !== item.featureName);
                            }
                            return newFilter;
                          });
                        }}
                      />
                      <label 
                        htmlFor={`unified-feature-${i}`}
                        className="text-sm leading-none"
                      >
                        {item.featureName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setUnifiedFilter({
                    states: [],
                    cities: [],
                    businessTypes: [],
                    years: [],
                    months: [],
                    features: []
                  });
                }}
              >
                Clear All Filters
              </Button>
              
              <Button 
                variant="default" 
                size="sm"
                onClick={() => {
                  // Force the view to display businesses with the combined filters
                  setActiveTab('crossCategoryResults');
                }}
                disabled={
                  unifiedFilter.states.length === 0 &&
                  unifiedFilter.cities.length === 0 &&
                  unifiedFilter.businessTypes.length === 0 &&
                  unifiedFilter.years.length === 0 &&
                  unifiedFilter.months.length === 0 &&
                  unifiedFilter.features.length === 0
                }
              >
                Apply Filters
              </Button>
            </div>
          </div>
        )}
        
        <div ref={analyticsRef}>
          <Tabs defaultValue="byState" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="byState">State</TabsTrigger>
              <TabsTrigger value="byCity">City</TabsTrigger>
              <TabsTrigger value="byBusinessType">Business Type</TabsTrigger>
              <TabsTrigger value="byYear">Year</TabsTrigger>
              <TabsTrigger value="byMonth">Month</TabsTrigger>
              <TabsTrigger value="byFeature">Feature</TabsTrigger>
              <TabsTrigger value="topBusinesses">Top Businesses</TabsTrigger>
              <TabsTrigger value="crossCategoryResults">Combined Results</TabsTrigger>
            </TabsList>
          
            {/* State Tab */}
            <TabsContent value="byState" className="py-4">
              <h3 className="text-lg font-medium mb-4">Usage by State</h3>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const anySelected = Object.values(filterSelections.byState || {}).some(v => v);
                    const newSelections = {...filterSelections};
                    
                    data.byState.forEach(item => {
                      if (!newSelections.byState) newSelections.byState = {};
                      newSelections.byState[item.state] = !anySelected;
                    });
                    
                    setFilterSelections(newSelections);
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {Object.values(filterSelections.byState || {}).some(v => v) ? 'Clear All' : 'Select All'}
                </Button>
                
                <div className="flex flex-wrap gap-2 items-center">
                  {data.byState.map((item, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`filter-state-${i}`} 
                        checked={filterSelections.byState?.[item.state] || false}
                        onCheckedChange={() => toggleFilter('byState', item.state)}
                      />
                      <label 
                        htmlFor={`filter-state-${i}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.state}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          Object.values(filterSelections.byState || {}).some(v => v) 
                            ? data.byState.filter(item => filterSelections.byState?.[item.state])
                            : data.byState
                        }
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="state"
                        label={({ state, count, percent }) => `${state}: ${count} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {(
                          Object.values(filterSelections.byState || {}).some(v => v) 
                            ? data.byState.filter(item => filterSelections.byState?.[item.state])
                            : data.byState
                        ).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        Object.values(filterSelections.byState || {}).some(v => v) 
                          ? data.byState.filter(item => filterSelections.byState?.[item.state])
                          : data.byState
                      }
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="state" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                      <Bar 
                        dataKey="count" 
                        fill="#8884d8" 
                        name="Usage Count"
                        onClick={handleDrillDown}
                        cursor="pointer"
                      >
                        {(
                          Object.values(filterSelections.byState || {}).some(v => v) 
                            ? data.byState.filter(item => filterSelections.byState?.[item.state])
                            : data.byState
                        ).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
            
            {/* City Tab */}
            <TabsContent value="byCity" className="py-4">
              <h3 className="text-lg font-medium mb-4">
                {breadcrumbs.length > 0 ? `Cities in ${breadcrumbs[0]}` : 'Usage by City'}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const cityData = breadcrumbs.length > 0 ? drilldownData : data.byCity;
                    const anySelected = Object.values(filterSelections.byCity || {}).some(v => v);
                    const newSelections = {...filterSelections};
                    
                    cityData.forEach((item: any) => {
                      if (!newSelections.byCity) newSelections.byCity = {};
                      newSelections.byCity[item.city] = !anySelected;
                    });
                    
                    setFilterSelections(newSelections);
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {Object.values(filterSelections.byCity || {}).some(v => v) ? 'Clear All' : 'Select All'}
                </Button>
                
                <div className="flex flex-wrap gap-2 items-center">
                  {(breadcrumbs.length > 0 ? drilldownData : data.byCity).map((item: any, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`filter-city-${i}`} 
                        checked={filterSelections.byCity?.[item.city] || false}
                        onCheckedChange={() => toggleFilter('byCity', item.city)}
                      />
                      <label 
                        htmlFor={`filter-city-${i}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.city}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      Object.values(filterSelections.byCity || {}).some(v => v) 
                        ? (breadcrumbs.length > 0 ? drilldownData : data.byCity).filter((item: any) => 
                            filterSelections.byCity?.[item.city])
                        : (breadcrumbs.length > 0 ? drilldownData : data.byCity)
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="city" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                    <Bar 
                      dataKey="count" 
                      fill="#00C49F" 
                      name="Usage Count"
                      onClick={handleDrillDown}
                      cursor="pointer"
                    >
                      {(
                        Object.values(filterSelections.byCity || {}).some(v => v) 
                          ? (breadcrumbs.length > 0 ? drilldownData : data.byCity).filter((item: any) => 
                              filterSelections.byCity?.[item.city])
                          : (breadcrumbs.length > 0 ? drilldownData : data.byCity)
                      ).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            {/* Business Type Tab */}
            <TabsContent value="byBusinessType" className="py-4">
              <h3 className="text-lg font-medium mb-4">
                {breadcrumbs.length > 1 
                  ? `Business Types in ${breadcrumbs[1]}` 
                  : 'Usage by Business Type'}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const typeData = breadcrumbs.length > 1 ? drilldownData : data.byBusinessType;
                    const anySelected = Object.values(filterSelections.byBusinessType || {}).some(v => v);
                    const newSelections = {...filterSelections};
                    
                    typeData.forEach((item: any) => {
                      if (!newSelections.byBusinessType) newSelections.byBusinessType = {};
                      newSelections.byBusinessType[item.businessType] = !anySelected;
                    });
                    
                    setFilterSelections(newSelections);
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {Object.values(filterSelections.byBusinessType || {}).some(v => v) ? 'Clear All' : 'Select All'}
                </Button>
                
                <div className="flex flex-wrap gap-2 items-center">
                  {(breadcrumbs.length > 1 ? drilldownData : data.byBusinessType).map((item: any, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`filter-type-${i}`} 
                        checked={filterSelections.byBusinessType?.[item.businessType] || false}
                        onCheckedChange={() => toggleFilter('byBusinessType', item.businessType)}
                      />
                      <label 
                        htmlFor={`filter-type-${i}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.businessType}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          Object.values(filterSelections.byBusinessType || {}).some(v => v) 
                            ? (breadcrumbs.length > 1 ? drilldownData : data.byBusinessType).filter((item: any) => 
                                filterSelections.byBusinessType?.[item.businessType])
                            : (breadcrumbs.length > 1 ? drilldownData : data.byBusinessType)
                        }
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="businessType"
                        label={({ businessType, count, percent }) => 
                          `${businessType}: ${count} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {(
                          Object.values(filterSelections.byBusinessType || {}).some(v => v) 
                            ? (breadcrumbs.length > 1 ? drilldownData : data.byBusinessType).filter((item: any) => 
                                filterSelections.byBusinessType?.[item.businessType])
                            : (breadcrumbs.length > 1 ? drilldownData : data.byBusinessType)
                        ).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        Object.values(filterSelections.byBusinessType || {}).some(v => v) 
                          ? (breadcrumbs.length > 1 ? drilldownData : data.byBusinessType).filter((item: any) => 
                              filterSelections.byBusinessType?.[item.businessType])
                          : (breadcrumbs.length > 1 ? drilldownData : data.byBusinessType)
                      }
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="businessType" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                      <Bar 
                        dataKey="count" 
                        fill="#FFBB28" 
                        name="Usage Count"
                        onClick={handleDrillDown}
                        cursor="pointer"
                      >
                        {(
                          Object.values(filterSelections.byBusinessType || {}).some(v => v) 
                            ? (breadcrumbs.length > 1 ? drilldownData : data.byBusinessType).filter((item: any) => 
                                filterSelections.byBusinessType?.[item.businessType])
                            : (breadcrumbs.length > 1 ? drilldownData : data.byBusinessType)
                        ).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
            
            {/* Year Tab */}
            <TabsContent value="byYear" className="py-4">
              <h3 className="text-lg font-medium mb-4">Usage by Year</h3>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const anySelected = Object.values(filterSelections.byYear || {}).some(v => v);
                    const newSelections = {...filterSelections};
                    
                    data.byYear.forEach(item => {
                      if (!newSelections.byYear) newSelections.byYear = {};
                      newSelections.byYear[item.year.toString()] = !anySelected;
                    });
                    
                    setFilterSelections(newSelections);
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {Object.values(filterSelections.byYear || {}).some(v => v) ? 'Clear All' : 'Select All'}
                </Button>
                
                <div className="flex flex-wrap gap-2 items-center">
                  {data.byYear.map((item, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`filter-year-${i}`} 
                        checked={filterSelections.byYear?.[item.year.toString()] || false}
                        onCheckedChange={() => toggleFilter('byYear', item.year.toString())}
                      />
                      <label 
                        htmlFor={`filter-year-${i}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.year}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      Object.values(filterSelections.byYear || {}).some(v => v) 
                        ? data.byYear.filter(item => 
                            filterSelections.byYear?.[item.year.toString()])
                        : data.byYear
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                    <Bar dataKey="count" fill="#FF8042" name="Usage Count">
                      {(
                        Object.values(filterSelections.byYear || {}).some(v => v) 
                          ? data.byYear.filter(item => 
                              filterSelections.byYear?.[item.year.toString()])
                          : data.byYear
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            {/* Month Tab */}
            <TabsContent value="byMonth" className="py-4">
              <h3 className="text-lg font-medium mb-4">Usage by Month</h3>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const anySelected = Object.values(filterSelections.byMonth || {}).some(v => v);
                    const newSelections = {...filterSelections};
                    
                    formattedMonthData.forEach(item => {
                      if (!newSelections.byMonth) newSelections.byMonth = {};
                      newSelections.byMonth[item.name] = !anySelected;
                    });
                    
                    setFilterSelections(newSelections);
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {Object.values(filterSelections.byMonth || {}).some(v => v) ? 'Clear All' : 'Select All'}
                </Button>
                
                <div className="flex flex-wrap gap-2 items-center">
                  {formattedMonthData.map((item, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`filter-month-${i}`} 
                        checked={filterSelections.byMonth?.[item.name] || false}
                        onCheckedChange={() => toggleFilter('byMonth', item.name)}
                      />
                      <label 
                        htmlFor={`filter-month-${i}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      Object.values(filterSelections.byMonth || {}).some(v => v) 
                        ? formattedMonthData.filter(item => filterSelections.byMonth?.[item.name])
                        : formattedMonthData
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                    <Bar dataKey="count" fill="#8884D8" name="Usage Count">
                      {(
                        Object.values(filterSelections.byMonth || {}).some(v => v) 
                          ? formattedMonthData.filter(item => filterSelections.byMonth?.[item.name])
                          : formattedMonthData
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            {/* Feature Tab */}
            <TabsContent value="byFeature" className="py-4">
              <h3 className="text-lg font-medium mb-4">Usage by Feature</h3>
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const anySelected = Object.values(filterSelections.byFeature || {}).some(v => v);
                    const newSelections = {...filterSelections};
                    
                    data.byFeature.forEach(item => {
                      if (!newSelections.byFeature) newSelections.byFeature = {};
                      newSelections.byFeature[item.featureName] = !anySelected;
                    });
                    
                    setFilterSelections(newSelections);
                  }}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {Object.values(filterSelections.byFeature || {}).some(v => v) ? 'Clear All' : 'Select All'}
                </Button>
                
                <div className="flex flex-wrap gap-2 items-center">
                  {data.byFeature.map((item, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`filter-feature-${i}`} 
                        checked={filterSelections.byFeature?.[item.featureName] || false}
                        onCheckedChange={() => toggleFilter('byFeature', item.featureName)}
                      />
                      <label 
                        htmlFor={`filter-feature-${i}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.featureName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          Object.values(filterSelections.byFeature || {}).some(v => v) 
                            ? data.byFeature.filter(item => filterSelections.byFeature?.[item.featureName])
                            : data.byFeature
                        }
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="featureName"
                        label={({ featureName, count, percent }) => 
                          `${featureName}: ${count} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {(
                          Object.values(filterSelections.byFeature || {}).some(v => v) 
                            ? data.byFeature.filter(item => filterSelections.byFeature?.[item.featureName])
                            : data.byFeature
                        ).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        Object.values(filterSelections.byFeature || {}).some(v => v) 
                          ? data.byFeature.filter(item => filterSelections.byFeature?.[item.featureName])
                          : data.byFeature
                      }
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="featureName" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                      <Bar dataKey="count" fill="#82CA9D" name="Usage Count">
                        {(
                          Object.values(filterSelections.byFeature || {}).some(v => v) 
                            ? data.byFeature.filter(item => filterSelections.byFeature?.[item.featureName])
                            : data.byFeature
                        ).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
            
            {/* Top Businesses Tab */}
            <TabsContent value="topBusinesses" className="py-4">
              <h3 className="text-lg font-medium mb-4">
                {breadcrumbs.length > 2 
                  ? `Businesses (${breadcrumbs[2]})` 
                  : 'Top Businesses by Usage'}
              </h3>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      breadcrumbs.length > 2 
                        ? drilldownData 
                        : data.topBusinesses.slice(0, parseInt(topBusinessCount, 10))
                    }
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="businessName" type="category" width={150} />
                    <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                    <Bar dataKey="count" fill="#FF6B6B" name="Usage Count">
                      {(
                        breadcrumbs.length > 2 
                          ? drilldownData 
                          : data.topBusinesses.slice(0, parseInt(topBusinessCount, 10))
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            {/* Cross-Category Results tab */}
            <TabsContent value="crossCategoryResults" className="py-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium">Cross-Category Filtered Results</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Displaying businesses matching the selected filters across all categories
                </p>
                
                {/* Display summary of applied filters */}
                <div className="mt-4 bg-slate-50 p-3 rounded-md border">
                  <h4 className="text-sm font-medium mb-2">Applied Filters:</h4>
                  <div className="space-y-1">
                    {unifiedFilter.states.length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-sm font-medium">States:</span>
                        <span className="text-sm">{unifiedFilter.states.join(', ')}</span>
                      </div>
                    )}
                    
                    {unifiedFilter.cities.length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-sm font-medium">Cities:</span>
                        <span className="text-sm">{unifiedFilter.cities.join(', ')}</span>
                      </div>
                    )}
                    
                    {unifiedFilter.businessTypes.length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-sm font-medium">Business Types:</span>
                        <span className="text-sm">{unifiedFilter.businessTypes.join(', ')}</span>
                      </div>
                    )}
                    
                    {unifiedFilter.years.length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-sm font-medium">Years:</span>
                        <span className="text-sm">{unifiedFilter.years.join(', ')}</span>
                      </div>
                    )}
                    
                    {unifiedFilter.months.length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-sm font-medium">Months:</span>
                        <span className="text-sm">
                          {unifiedFilter.months.map(m => MONTHS[m-1]).join(', ')}
                        </span>
                      </div>
                    )}
                    
                    {unifiedFilter.features.length > 0 && (
                      <div className="flex gap-2">
                        <span className="text-sm font-medium">Features:</span>
                        <span className="text-sm">{unifiedFilter.features.join(', ')}</span>
                      </div>
                    )}
                    
                    {!unifiedFilter.states.length && 
                     !unifiedFilter.cities.length && 
                     !unifiedFilter.businessTypes.length &&
                     !unifiedFilter.years.length &&
                     !unifiedFilter.months.length &&
                     !unifiedFilter.features.length && (
                      <div className="text-sm italic">No filters applied. Showing all businesses.</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Businesses Table */}
                <div className="overflow-x-auto">
                  <h4 className="text-md font-medium mb-3">Matching Businesses</h4>
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Business Name</TableHead>
                        <TableHead className="text-right">Usage Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCrossCategoryFilteredBusinesses()
                        .slice(0, parseInt(topBusinessCount, 10))
                        .map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{item.businessName}</TableCell>
                            <TableCell className="text-right">{item.count}</TableCell>
                          </TableRow>
                        ))
                      }
                      {getCrossCategoryFilteredBusinesses().length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">
                            No businesses match all the selected filter criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Chart visualization of results */}
                <div>
                  <h4 className="text-md font-medium mb-3">Usage Distribution</h4>
                  <div className="h-[300px]">
                    {getCrossCategoryFilteredBusinesses().length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getCrossCategoryFilteredBusinesses().slice(0, 10)}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="businessName" 
                            angle={-45} 
                            textAnchor="end"
                            height={70}
                            interval={0}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} usages`, 'Count']} />
                          <Bar 
                            dataKey="count" 
                            fill="#8884d8" 
                            name="Usage Count"
                          >
                            {getCrossCategoryFilteredBusinesses().slice(0, 10).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full border rounded-md bg-slate-50">
                        <div className="text-center p-4">
                          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No data available for visualization</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Try adjusting your filter criteria
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-md font-medium mb-3">Summary Statistics</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Total Businesses</p>
                        <p className="text-3xl font-bold mt-1">
                          {getCrossCategoryFilteredBusinesses().length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Total Usage Count</p>
                        <p className="text-3xl font-bold mt-1">
                          {getCrossCategoryFilteredBusinesses().reduce((sum, item) => sum + item.count, 0)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Average Usage</p>
                        <p className="text-3xl font-bold mt-1">
                          {getCrossCategoryFilteredBusinesses().length > 0 
                            ? (getCrossCategoryFilteredBusinesses().reduce((sum, item) => sum + item.count, 0) / 
                               getCrossCategoryFilteredBusinesses().length).toFixed(1)
                            : '0'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-muted-foreground">Applied Filters</p>
                        <p className="text-3xl font-bold mt-1">
                          {unifiedFilter.states.length +
                           unifiedFilter.cities.length +
                           unifiedFilter.businessTypes.length +
                           unifiedFilter.years.length +
                           unifiedFilter.months.length +
                           unifiedFilter.features.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureUsageAnalytics;