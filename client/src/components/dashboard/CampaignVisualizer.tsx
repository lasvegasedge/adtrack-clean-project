import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  LayoutGrid,
  List,
  CalendarRange,
  TrendingUp,
  Layers,
  DollarSign,
  Calendar,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Types for our campaign card
interface CampaignCardProps {
  id: number;
  name: string;
  adMethod: string;
  startDate: string;
  endDate: string | null;
  spent: number;
  revenue: number;
  status: string;
  image?: string | null;
}

// Sortable Campaign Card Component
const SortableCampaignCard = ({ campaign }: { campaign: CampaignCardProps }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: campaign.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Calculate ROI
  const roi = campaign.revenue > 0 ? 
    ((campaign.revenue - campaign.spent) / campaign.spent) * 100 : 0;
  
  // Helper function to determine status color
  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-4 cursor-move"
    >
      <Card className="overflow-hidden border hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg truncate">{campaign.name}</h3>
            <span className={`text-xs rounded-full px-2 py-1 ${getStatusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </div>
          
          <div className="text-sm text-gray-500 mb-3">
            {campaign.adMethod}
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
              <span className="text-xs">
                {new Date(campaign.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center">
              {campaign.endDate ? (
                <>
                  <CalendarRange className="h-4 w-4 mr-1 text-gray-400" />
                  <span className="text-xs">
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400">Ongoing</span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center text-gray-600 mb-1">
                <DollarSign className="h-3 w-3 mr-1" />
                <span className="text-xs">Spent</span>
              </div>
              <div className="font-medium">{formatCurrency(campaign.spent)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="flex items-center text-gray-600 mb-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span className="text-xs">Revenue</span>
              </div>
              <div className="font-medium">{formatCurrency(campaign.revenue)}</div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">ROI</span>
              <span className={`font-semibold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {roi.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div 
                className={`h-1.5 rounded-full ${roi >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                style={{ width: `${Math.min(Math.max(roi, 0), 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Campaign Visualizer Component
const CampaignVisualizer = () => {
  const [campaigns, setCampaigns] = useState<CampaignCardProps[]>([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'roi', 'name', 'spend'
  const [businessId, setBusinessId] = useState<number | null>(null);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Fetch user's businesses
  const { data: userBusinesses, isSuccess: businessesLoaded } = useQuery({
    queryKey: ['/api/user/business'],
    queryFn: async () => {
      try {
        // Get current authenticated user
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) throw new Error('Failed to get current user');
        const userData = await userResponse.json();
        
        console.log('Current user:', userData);
        
        // Fetch businesses for this user
        const response = await fetch(`/api/user/${userData.id}/business`);
        if (!response.ok) throw new Error('Failed to fetch businesses');
        const data = await response.json();
        console.log('Fetched businesses:', data);
        return [data]; // Wrap in array since API returns a single business object
      } catch (error) {
        console.error('Error fetching businesses:', error);
        throw error;
      }
    },
    retry: 2, // Retry failed requests up to 2 times
    refetchOnWindowFocus: false // Don't refetch when window focus changes
  });
  
  // Set first business as default when data is loaded
  useEffect(() => {
    if (userBusinesses && userBusinesses.length > 0 && !businessId) {
      console.log('Setting default business ID:', userBusinesses[0].id);
      setBusinessId(userBusinesses[0].id);
    }
  }, [userBusinesses, businessId]);
  
  // Log business ID changes
  useEffect(() => {
    if (businessId) {
      console.log('Current selected business ID:', businessId);
    }
  }, [businessId]);
  
  // Fetch campaigns for the selected business
  const { data: fetchedCampaigns, isLoading, isError } = useQuery({
    queryKey: ['/api/business', businessId, 'campaigns'],
    queryFn: async () => {
      if (!businessId) return [];
      try {
        console.log(`Fetching campaigns for business ID: ${businessId}`);
        const response = await fetch(`/api/business/${businessId}/campaigns`);
        if (!response.ok) {
          console.error(`Failed to fetch campaigns: ${response.status} ${response.statusText}`);
          throw new Error('Failed to fetch campaigns');
        }
        const data = await response.json();
        console.log(`Fetched ${data.length} campaigns`);
        return data;
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        throw error;
      }
    },
    enabled: !!businessId,
    retry: 2, // Retry failed requests up to 2 times
    refetchOnWindowFocus: false // Don't refetch when window focus changes
  });
  
  // Update campaigns when data is fetched
  useEffect(() => {
    if (fetchedCampaigns) {
      // Map API response fields to component expected fields
      const mappedCampaigns = fetchedCampaigns.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        adMethod: campaign.adMethod ? campaign.adMethod.name : '',
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        spent: parseFloat(campaign.amountSpent || '0'),
        revenue: parseFloat(campaign.amountEarned || '0'),
        status: campaign.isActive ? 'Active' : 'Completed',
        image: campaign.fileUrl
      }));
      
      console.log('Mapped campaigns:', mappedCampaigns);
      setCampaigns(mappedCampaigns);
    }
  }, [fetchedCampaigns]);
  
  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setCampaigns((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  
  // Handle sorting
  const handleSort = (method: string) => {
    setSortBy(method);
    let sortedCampaigns = [...campaigns];
    
    switch (method) {
      case 'date':
        sortedCampaigns.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        break;
      case 'roi':
        sortedCampaigns.sort((a, b) => {
          const roiA = a.revenue > 0 ? ((a.revenue - a.spent) / a.spent) * 100 : 0;
          const roiB = b.revenue > 0 ? ((b.revenue - b.spent) / b.spent) * 100 : 0;
          return roiB - roiA;
        });
        break;
      case 'name':
        sortedCampaigns.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'spend':
        sortedCampaigns.sort((a, b) => b.spent - a.spent);
        break;
    }
    
    setCampaigns(sortedCampaigns);
  };
  
  // Switch business
  const handleBusinessChange = (id: number) => {
    setBusinessId(id);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Campaign Visualizer</h2>
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Grid
          </Button>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>
      </div>
      
      {userBusinesses && userBusinesses.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Select Business</h3>
          <div className="flex flex-wrap gap-2">
            {userBusinesses.map((business: any) => (
              <Button
                key={business.id}
                variant={businessId === business.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleBusinessChange(business.id)}
              >
                {business.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg border p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Campaign Cards</h3>
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSort('date')}
              className={sortBy === 'date' ? 'text-primary' : 'text-gray-500'}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Date
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSort('roi')}
              className={sortBy === 'roi' ? 'text-primary' : 'text-gray-500'}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              ROI
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSort('name')}
              className={sortBy === 'name' ? 'text-primary' : 'text-gray-500'}
            >
              <Layers className="h-4 w-4 mr-1" />
              Name
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSort('spend')}
              className={sortBy === 'spend' ? 'text-primary' : 'text-gray-500'}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Spend
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="py-10 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-2 text-gray-500">Loading campaigns...</p>
          </div>
        ) : isError ? (
          <div className="py-10 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-500">There was an error loading your campaigns.</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-500">No campaigns found. Create your first campaign to get started.</p>
            <Button 
              className="mt-4"
              onClick={() => window.location.href = "/dashboard"}
            >
              Create Campaign
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className={`relative ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : ''}`}>
              <SortableContext
                items={campaigns.map(campaign => campaign.id)}
                strategy={verticalListSortingStrategy}
              >
                {campaigns.map((campaign) => (
                  <SortableCampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        )}
        
        <div className="mt-4 pt-4 border-t text-center text-sm text-gray-500">
          <p className="flex items-center justify-center">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Drag and drop campaigns to organize them
          </p>
        </div>
      </div>
    </div>
  );
};

export default CampaignVisualizer;